import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

jest.mock('../tools/libs/elasticsearch-client.js', () => ({
  indexExists: jest.fn(), createIndex: jest.fn(), bulkCreate: jest.fn(),
  refreshIndex: jest.fn(), deletePoet: jest.fn(), deleteWork: jest.fn(),
}));
import * as client from '../tools/libs/elasticsearch-client.js';
import { update_elasticsearch } from '../tools/build-static/elastic.js';
import { iterateElasticsearchTextEntryDocuments } from '../tools/build-static/elastic-documents.js';
import { createIndexingStats, writeElasticsearchStream } from '../tools/build-static/elastic-stream.js';

const repository = process.cwd();
let directory;
let log;
let collected;
const work = (count = 3, prefix = 'p', content = 'Gamle ord') =>
  `<kalliopework><workbody>${Array.from({ length: count }, (_, index) =>
    `<text id="${prefix}${index}"><head><title>Titel ${index}</title></head><body><poetry>${content}</poetry></body></text>`).join('')}</workbody></kalliopework>`;
const run = options => update_elasticsearch(collected, { statePath: 'state.json', ...options });
const stats = () => JSON.parse(log.mock.calls.filter(([value]) =>
  String(value).startsWith('Elasticsearch-statistik: ') === true).at(-1)[0].split('Elasticsearch-statistik: ')[1]);
const ids = () => client.bulkCreate.mock.calls.flatMap(([, documents]) => documents.map(document => document.id));
const checkpoint = () => JSON.parse(fs.readFileSync('state.json'));

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-elastic-stream-'));
  process.chdir(directory);
  fs.symlinkSync(path.join(repository, 'tools'), 'tools');
  fs.mkdirSync('fdirs/p', { recursive: true });
  fs.writeFileSync('fdirs/p/info.xml', '<person/>');
  fs.writeFileSync('fdirs/p/w.xml', work());
  const poet = { id: 'p', name: { fullname: 'Digter' } };
  collected = { poets: new Map([['p', poet]]), keywords: new Map(),
    works: new Map([['p/w', { id: 'w', poet_id: 'p', title: 'Værk',
      sourceFiles: ['fdirs/p/info.xml', 'fdirs/p/w.xml'] }]]),
    texts: new Map(Array.from({ length: 3 }, (_, index) => [`p${index}`, {
      id: `p${index}`, poetId: 'p', workId: 'w', sourcePoetId: 'p', sourceWorkId: 'w',
    }])),
  };
  log = jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.clearAllMocks();
  client.indexExists.mockResolvedValue(true);
  client.bulkCreate.mockResolvedValue({ errors: false });
  client.createIndex.mockResolvedValue(undefined);
  client.refreshIndex.mockResolvedValue(undefined);
});

afterEach(() => {
  process.chdir(repository);
  log.mockRestore();
  fs.rmSync(directory, { recursive: true, force: true });
});

test('unchanged input skips writes and DOM parsing using its own checkpoint', async () => {
  await run();
  jest.clearAllMocks();
  const write = jest.spyOn(fs, 'writeFileSync');
  try {
    await run();
    expect(write).not.toHaveBeenCalled();
  } finally { write.mockRestore(); }
  expect(client.bulkCreate).not.toHaveBeenCalled();
  expect(client.createIndex).not.toHaveBeenCalled();
  expect(stats()).toMatchObject({ status: 'unchanged', selectedWorks: 0, domParses: 0, sourceHashReads: 0 });
});

test('a text edit updates one work even after the global file cache was saved', async () => {
  await run();
  jest.clearAllMocks();
  fs.writeFileSync('fdirs/p/w.xml', work(3, 'p', 'Nye ord'));
  await run();
  expect(client.createIndex).not.toHaveBeenCalled();
  expect(client.deleteWork).toHaveBeenCalledWith('kalliope', 'p', 'w');
  expect(ids()).toEqual(['p-w', 'p0', 'p1', 'p2']);
  expect(stats()).toMatchObject({ selectedWorks: 1, domParses: 1 });
});

test('shared keyword changes rebuild and poet metadata changes replace that poet', async () => {
  await run();
  jest.clearAllMocks();
  collected.keywords.set('rose', { id: 'rose', title: 'Rose' });
  await run();
  expect(client.createIndex).toHaveBeenCalledTimes(1);
  expect(stats().fullRebuildReasons).toContain('shared-keyword-metadata');
  jest.clearAllMocks();
  collected.poets.get('p').name.fullname = 'Ændret navn';
  await run();
  expect(client.createIndex).not.toHaveBeenCalled();
  expect(client.deletePoet).toHaveBeenCalledWith('kalliope', 'p');
  expect(ids()).toContain('poet-p');
});

test('deleting a text and moving a work deletes old index entries and writes the new ones', async () => {
  await run();
  jest.clearAllMocks();
  fs.writeFileSync('fdirs/p/w.xml', work(2));
  collected.texts.delete('p2');
  await run();
  expect(client.deleteWork).toHaveBeenCalledWith('kalliope', 'p', 'w');
  expect(ids()).toEqual(['p-w', 'p0', 'p1']);
  jest.clearAllMocks();
  fs.renameSync('fdirs/p/w.xml', 'fdirs/p/moved.xml');
  const metadata = collected.works.get('p/w');
  collected.works = new Map([['p/moved', { ...metadata, id: 'moved',
    sourceFiles: ['fdirs/p/info.xml', 'fdirs/p/moved.xml'] }]]);
  for (const text of collected.texts.values()) { text.workId = 'moved'; text.sourceWorkId = 'moved'; }
  await run();
  expect(client.deleteWork).toHaveBeenCalledWith('kalliope', 'p', 'w');
  expect(ids()).toContain('p-moved');
  expect(ids()).not.toContain('p-w');
});

test.each(['missing', 'old', 'broken', 'invalid'])('rebuilds with a %s checkpoint', async kind => {
  await run();
  jest.clearAllMocks();
  if (kind === 'missing') fs.unlinkSync('state.json');
  if (kind === 'old') fs.writeFileSync('state.json', JSON.stringify({ ...checkpoint(), version: 0 }));
  if (kind === 'broken') fs.writeFileSync('state.json', '{partial');
  if (kind === 'invalid') fs.writeFileSync('state.json', JSON.stringify({ ...checkpoint(), entries: { broken: null } }));
  await run();
  expect(client.createIndex).toHaveBeenCalledTimes(1);
  expect(stats().fullRebuildReasons).toContain('missing-or-invalid-checkpoint');
});

test('a failed bulk leaves a pending checkpoint and forces a safe complete retry', async () => {
  await run();
  fs.writeFileSync('fdirs/p/w.xml', work(3, 'p', 'Ændring'));
  client.bulkCreate.mockRejectedValueOnce(new Error('bulk item failed'));
  await expect(run({ bulkSize: 2 })).rejects.toThrow('bulk item failed');
  expect(checkpoint().pending).toBe(true);
  jest.clearAllMocks();
  await run({ bulkSize: 2 });
  expect(client.createIndex).toHaveBeenCalledTimes(1);
  expect(stats().fullRebuildReasons).toContain('unfinished-previous-update');
  expect(checkpoint().pending).toBe(false);
});

test('an unavailable server does not acknowledge pending source changes', async () => {
  await run();
  const before = fs.readFileSync('state.json', 'utf8');
  fs.writeFileSync('fdirs/p/w.xml', work(3, 'p', 'Ny tekst'));
  const unavailable = Object.assign(new Error('ECONNREFUSED'), { code: 'ECONNREFUSED' });
  client.indexExists.mockRejectedValueOnce(unavailable);
  await run();
  expect(fs.readFileSync('state.json', 'utf8')).toBe(before);
  jest.clearAllMocks();
  await run();
  expect(client.deleteWork).toHaveBeenCalledWith('kalliope', 'p', 'w');
  expect(ids()).toContain('p2');
});

test('refresh failure leaves an unfinished checkpoint too', async () => {
  client.refreshIndex.mockRejectedValueOnce(new Error('refresh failed'));
  await expect(run()).rejects.toThrow('refresh failed');
  expect(checkpoint().pending).toBe(true);
  await run();
  expect(checkpoint().pending).toBe(false);
});

test('a large single work is split before the entire work has been materialized', async () => {
  fs.writeFileSync('fdirs/p/w.xml', work(1200));
  await run({ bulkSize: 11, bulkBytes: 4096, concurrency: 1 });
  expect(stats()).toMatchObject({ documentsWritten: 1202, domParses: 1, maxInFlight: 1 });
  expect(stats().maxBulkDocuments).toBeLessThanOrEqual(11);
  expect(stats().maxBulkBytes).toBeLessThanOrEqual(4096);
  expect(stats().maxRetainedDocuments).toBeLessThanOrEqual(12);
});

test('anthology texts from one source are parsed once per author/source group', async () => {
  const source = collected.works.get('p/w');
  collected.poets.set('author', { id: 'author', name: { fullname: 'Forfatter' } });
  collected.works.set('author/antologier', { id: 'antologier', virtualType: 'anthology',
    textIds: ['p0', 'p1', 'p2'], sourceFiles: ['fdirs/p/w.xml'] });
  for (const text of collected.texts.values()) {
    text.poetId = 'author'; text.sourceTextId = text.id;
  }
  const parsed = [];
  const entry = { poet: collected.poets.get('author'), poetId: 'author', workId: 'antologier',
    work: collected.works.get('author/antologier'), textEntryKey: 'author-antologier' };
  const documents = Array.from(iterateElasticsearchTextEntryDocuments(collected, entry, filename => parsed.push(filename)));
  expect(parsed).toEqual(['fdirs/p/w.xml']);
  expect(documents.map(document => document.id)).toEqual(['p0', 'p1', 'p2']);
  expect(documents.every(document => document.data.poet.id === 'author' && document.data.work.id === source.id)).toBe(true);
});

test('bounded request concurrency applies backpressure before producing further documents', async () => {
  let produced = 0;
  const releases = [];
  client.bulkCreate.mockImplementation(() => new Promise(resolve => releases.push(resolve)));
  function* documents() {
    for (let index = 0; index < 100; index += 1) {
      produced += 1;
      yield { id: `${index}`, data: { text: 'indhold' } };
    }
  }
  const metrics = createIndexingStats();
  const task = writeElasticsearchStream('test', documents(), metrics, { bulkSize: 3, bulkBytes: 1024, concurrency: 2 });
  await new Promise(resolve => setImmediate(resolve));
  expect(produced).toBe(6);
  expect(client.bulkCreate).toHaveBeenCalledTimes(2);
  client.bulkCreate.mockResolvedValue({ errors: false });
  releases.forEach(resolve => resolve({ errors: false }));
  await task;
  expect(metrics.maxInFlight).toBe(2);
  expect(metrics.maxRetainedDocuments).toBeLessThanOrEqual(6);
  expect(metrics.documentsWritten).toBe(100);
});

test('a document over the byte limit fails without acknowledging the index', async () => {
  await expect(run({ bulkBytes: 10 })).rejects.toThrow('KALLIOPE_ELASTICSEARCH_BULK_BYTES');
  expect(checkpoint().pending).toBe(true);
  expect(client.refreshIndex).not.toHaveBeenCalled();
});

test('changing the selected poet scope rebuilds instead of retaining an incomplete index', async () => {
  await run({ poetIds: new Set(['p']) });
  jest.clearAllMocks();
  await run();
  expect(client.createIndex).toHaveBeenCalledTimes(1);
  expect(stats().fullRebuildReasons).toContain('selection-changed');
});

test('format dependency changes explain a full rebuild', async () => {
  await run();
  jest.clearAllMocks();
  const read = fs.readFileSync;
  const changed = jest.spyOn(fs, 'readFileSync').mockImplementation((filename, ...args) =>
    filename === 'tools/build-static/elastic-documents.js'
      ? Buffer.concat([read(filename, ...args), Buffer.from('\n// new document semantics')])
      : read(filename, ...args));
  try {
    await run();
    expect(client.createIndex).toHaveBeenCalledTimes(1);
    expect(stats().fullRebuildReasons).toContain('index-format-or-dependencies');
  } finally { changed.mockRestore(); }
});

test('a removed poet is deleted even when no remaining work references it', async () => {
  await run();
  jest.clearAllMocks();
  collected.poets.clear();
  await run();
  expect(client.deletePoet).toHaveBeenCalledWith('kalliope', 'p');
  expect(ids()).toEqual([]);
});


test('SIGKILL during a request leaves an unfinished checkpoint that is retried', async () => {
  await run();
  fs.writeFileSync('fixture.json', JSON.stringify(Object.fromEntries(
    Object.entries(collected).map(([key, value]) => [key, Array.from(value)]))));
  let child;
  const server = http.createServer((request, response) => {
    request.resume();
    request.on('end', () => {
      if (request.url.endsWith('/_bulk') === true) {
        child.kill('SIGKILL');
        response.destroy();
      } else {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end('{}');
      }
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const moduleUrl = pathToFileURL(path.join(repository, 'tools/build-static/elastic.js')).href;
    child = spawn(process.execPath, ['--input-type=module', '-e', `
      import fs from 'node:fs';
      import { update_elasticsearch } from ${JSON.stringify(moduleUrl)};
      const fixture = JSON.parse(fs.readFileSync('fixture.json'));
      const collected = Object.fromEntries(Object.entries(fixture).map(([key, value]) => [key, new Map(value)]));
      await update_elasticsearch(collected, { statePath: 'state.json', forceRebuild: true, skipUnavailable: false });
    `], { cwd: directory, env: { ...process.env,
      ELASTICSEARCH_URL: `http://127.0.0.1:${server.address().port}` }, stdio: 'ignore' });
    const signal = await new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('exit', (code, signal) => resolve(signal));
    });
    expect(signal).toBe('SIGKILL');
    expect(checkpoint().pending).toBe(true);
    jest.clearAllMocks();
    await run();
    expect(stats().fullRebuildReasons).toContain('unfinished-previous-update');
    expect(checkpoint().pending).toBe(false);
    expect(ids()).toEqual(['poet-p', 'p-w', 'p0', 'p1', 'p2']);
  } finally {
    child?.kill('SIGKILL');
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});


test('shared publication metadata updates the authors virtual entries without an XML edit', async () => {
  collected.poets.set('author', { id: 'author', name: { fullname: 'Forfatter' } });
  collected.works.set('author/antologier', { id: 'antologier', virtualType: 'anthology',
    textIds: ['p0', 'p1', 'p2'], sourceFiles: ['fdirs/p/w.xml'] });
  for (const text of collected.texts.values()) { text.poetId = 'author'; text.sourceTextId = text.id; }
  await run();
  jest.clearAllMocks();
  collected.works.get('p/w').title = 'Rettet publikationstitel';
  await run();
  expect(client.deleteWork).toHaveBeenCalledWith('kalliope', 'author', 'antologier');
  const textDocuments = client.bulkCreate.mock.calls.flatMap(([, documents]) => documents)
    .filter(document => document.data.result_type === 'text');
  expect(textDocuments).toHaveLength(3);
  expect(textDocuments.every(document => document.data.work.title === 'Rettet publikationstitel')).toBe(true);
});
