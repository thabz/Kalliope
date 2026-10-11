import crypto from 'crypto';
import zlib from 'zlib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { textPath } from '../common/paths.js';
import {
  deterministicGzip,
  jsonLines,
  normalizedFullText,
  buildTextAuditFields,
  buildCorpusDataset,
  buildPoetRecords,
  buildTextRecord,
  buildTextRecords,
  buildWorkRecords,
  validateRelations,
  validateRecordShapes,
} from '../tools/build-static/corpus-dataset.js';

describe('versioned corpus dataset', () => {
  it('uses rendered records and reads unchanged texts from disk with identical output', () => {
    const authorText = { id: 'one', poetId: 'poet', workId: 'book', title: 'En titel' };
    const unchangedText = { ...authorText, id: 'two', title: 'Anden titel' };
    const publicationText = { ...authorText, id: 'onea', indexable: false };
    const textData = {
      text: {
        content_lang: 'da',
        source: { pages: '12–13' },
        blocks: [{ lines: ['En linje', { source: 'En anden linje' }] }],
        has_footnotes: 1,
        footnotes_count: 2,
      },
    };
    const collected = {
      poets: new Map([['poet', { lang: 'da', name: { firstname: 'En', lastname: 'Digter' } }]]),
      works: new Map([['poet/book', { title: 'En bog' }]]),
      texts: new Map([['two', unchangedText], ['onea', publicationText], ['one', authorText]]),
    };
    const readFile = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(textData));
    try {
      const diskRecords = buildTextRecords(collected);
      expect(readFile).toHaveBeenCalledTimes(2);
      readFile.mockClear();
      collected.corpusTextRecords = new Map([
        ['one', buildTextRecord(collected, authorText, textData)],
      ]);
      expect(buildTextRecords(collected)).toEqual(diskRecords);
      expect(readFile).toHaveBeenCalledTimes(1);
      expect(readFile).toHaveBeenCalledWith(textPath('two'), 'utf8');
      expect(diskRecords.map(record => record.id)).toEqual(['one', 'two']);
      expect(diskRecords[0]).toEqual(expect.objectContaining({
        full_text: 'En linje\nEn anden linje',
        source_pages: '12–13',
        has_footnotes: true,
        footnotes_count: 2,
      }));
    } finally {
      readFile.mockRestore();
    }
  });

  it('writes one JSON record per line in the supplied deterministic order', () => {
    expect(jsonLines([{ id: 'a' }, { id: 'b' }])).toBe(
      '{"id":"a"}\n{"id":"b"}\n'
    );
  });

  it('creates reproducible gzip bytes', () => {
    const content = jsonLines([{ id: 'a' }]);
    const first = deterministicGzip(content);
    const second = deterministicGzip(content);

    expect(crypto.createHash('sha256').update(first).digest('hex')).toBe(
      crypto.createHash('sha256').update(second).digest('hex')
    );
    expect(zlib.gunzipSync(first).toString('utf8')).toBe(content);
  });

  it('sorts work records by their stable global ID', () => {
    const works = new Map([
      ['z/work', { id: 'work', title: 'Z' }],
      ['a/work', { id: 'work', title: 'A' }],
    ]);
    expect(buildWorkRecords({ works }).map(work => work.id)).toEqual([
      'a/work',
      'z/work',
    ]);
  });

  it('preserves baptism data independently of birth data', () => {
    const poets = new Map([
      ['eltzholtz', {
        id: 'eltzholtz',
        country: 'dk',
        lang: 'da',
        type: 'poet',
        name: { firstname: 'Alberta', lastname: 'Eltzholtz' },
        period: {
          baptized: { date: '1846-05-24', place: null, inon: 'in' },
          dead: { date: '1934-05-19', place: null, inon: 'in' },
        },
      }],
    ]);

    const record = buildPoetRecords({ poets })[0];
    expect(record).not.toHaveProperty('born');
    expect(record).toEqual(expect.objectContaining({
      baptized: { date: '1846-05-24', place: null, inon: 'in' },
      dead: { date: '1934-05-19', place: null, inon: 'in' },
    }));
  });

  it('preserves nationality independently of the poet grouping country', () => {
    const poets = new Map([
      ['runeberg', {
        id: 'runeberg', country: 'un', nationality: 'fi', lang: 'sv', type: 'poet',
        name: { firstname: 'Johan Ludvig', lastname: 'Runeberg' },
      }],
    ]);
    expect(buildPoetRecords({ poets })[0]).toEqual(expect.objectContaining({
      country: 'un', nationality: 'fi',
    }));
  });

  it('normalizes text blocks without losing line boundaries', () => {
    expect(normalizedFullText({
      title: ' En titel ',
      blocks: [{ lines: [' Første   linje ', { source: 'Anden linje' }] }],
    })).toBe('En titel\nFørste linje\nAnden linje');
  });

  it('keeps common audit fields in text records', () => {
    const fields = buildTextAuditFields(
      {
        firstline: 'Første linje',
        dates: { written: ' 1840-01-02 ', performed: '', event: '1841' },
      },
      { text: { has_footnotes: 1, footnotes_count: 2 } },
      { pages: '12–13' },
    );

    expect(fields).toEqual({
      firstline: 'Første linje',
      events: [
        { type: 'written', date: '1840-01-02' },
        { type: 'event', date: '1841' },
      ],
      has_footnotes: true,
      footnotes_count: 2,
      source_pages: '12–13',
    });
  });

  it('rejects dangling poet and work references', () => {
    const poets = [{ id: 'poet' }];
    const works = [{ id: 'poet/work', poet_id: 'poet' }];
    expect(() => validateRelations(poets, works, [{ id: 'text', poet_id: 'poet', work_id: 'missing' }]))
      .toThrow('Korpusteksten text');
    expect(() => validateRelations(poets, [{ id: 'other/work', poet_id: 'other' }], []))
      .toThrow('Korpusværket other/work');
  });

  it('rejects records that do not satisfy their documented schema fields', () => {
    expect(() => validateRecordShapes(
      [{ id: 'poet' }],
      [],
      []
    )).toThrow('poet-posten poet mangler feltet name');
  });
});

describe('incremental corpus dataset', () => {
  let cwd;
  let directory;
  let collected;
  const builtAt = '2026-10-09T10:00:00.000Z';
  const outputFiles = [
    'public/api/v1/poets.jsonl.gz',
    'public/api/v1/works.jsonl.gz',
    'public/api/v1/texts.jsonl.gz',
    'public/api/v1/schema.json',
    'public/api/v1/README.md',
    'public/api/v1/manifest.json',
    'public/api/manifest.json',
  ];
  const write = (filename, content) => {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, content);
  };
  const readTexts = () => zlib.gunzipSync(fs.readFileSync('public/api/v1/texts.jsonl.gz'))
    .toString('utf8').trim().split('\n').map(line => JSON.parse(line));

  beforeEach(() => {
    cwd = process.cwd();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-corpus-'));
    // Give each build its own code and data so invalidation tests never touch
    // repository sources or the developer's generated API files.
    for (const filename of [
      'tools/build-static/corpus-dataset.js',
      'tools/build-static/external-identifiers.js',
      'tools/build-static/formatting.js',
      'tools/build-static/xml.js',
      'tools/libs/helpers.js',
      'common/external-identifiers.js',
      'common/paths.js',
    ]) {
      write(path.join(directory, filename), fs.readFileSync(filename));
    }
    process.chdir(directory);
    write('fdirs/poet/info.xml', '<person><identifiers><wikidata>Q1</wikidata></identifiers></person>');
    write(textPath('one'), JSON.stringify({ text: { blocks: [{ lines: ['Første linje'] }] } }));
    collected = {
      poets: new Map([['poet', {
        id: 'poet', name: { firstname: 'En', lastname: 'Digter' },
        country: 'dk', lang: 'da', type: 'poet',
      }]]),
      works: new Map([['poet/book', { id: 'book', title: 'En bog' }]]),
      texts: new Map([['one', { id: 'one', poetId: 'poet', workId: 'book', title: 'En titel' }]]),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.chdir(cwd);
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it('skips text and XML reads, gzip and output writes on an unchanged build', () => {
    const manifest = buildCorpusDataset(collected, { builtAt });
    const read = jest.spyOn(fs, 'readFileSync');
    const compress = jest.spyOn(zlib, 'gzipSync');
    const writeFile = jest.spyOn(fs, 'writeFileSync');
    expect(buildCorpusDataset(collected)).toEqual(manifest);
    expect(read.mock.calls.map(([filename]) => filename)).not.toContain(textPath('one'));
    expect(read.mock.calls.map(([filename]) => filename)).not.toContain('fdirs/poet/info.xml');
    expect(compress).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('exports changed text content and metadata', () => {
    buildCorpusDataset(collected, { builtAt });
    write(textPath('one'), JSON.stringify({ text: { blocks: [{ lines: ['En anden linje'] }] } }));
    collected.texts.get('one').title = 'Ny titel';
    collected.works.get('poet/book').title = 'Ny bog';
    collected.poets.get('poet').name.firstname = 'Anden';
    buildCorpusDataset(collected);
    expect(readTexts()[0]).toEqual(expect.objectContaining({
      full_text: 'En anden linje', title: 'Ny titel',
      work_title: 'Ny bog', poet_name: 'Anden Digter',
    }));
  });

  it('exports changed external identifiers', () => {
    buildCorpusDataset(collected, { builtAt });
    write('fdirs/poet/info.xml', '<person><identifiers><wikidata>Q22</wikidata></identifiers></person>');
    buildCorpusDataset(collected);
    const poet = JSON.parse(zlib.gunzipSync(fs.readFileSync('public/api/v1/poets.jsonl.gz')).toString('utf8'));
    expect(poet.identifiers.wikidata).toBe('Q22');
  });

  it.each(['poet', 'work', 'text'])('detects changed %s metadata without changed API files', (type) => {
    buildCorpusDataset(collected, { builtAt });
    if (type === 'poet') collected.poets.get('poet').name.firstname = 'Anden';
    if (type === 'work') collected.works.get('poet/book').title = 'Ny bog';
    if (type === 'text') collected.texts.get('one').title = 'Ny titel';
    buildCorpusDataset(collected);
    const fields = { poet: 'poet_name', work: 'work_title', text: 'title' };
    const values = { poet: 'Anden Digter', work: 'Ny bog', text: 'Ny titel' };
    expect(readTexts()[0][fields[type]]).toBe(values[type]);
  });

  it('validates fresh rendered records even when the on-disk API is unchanged', () => {
    buildCorpusDataset(collected, { builtAt });
    collected.corpusTextRecords = new Map([['one', buildTextRecord(
      collected, collected.texts.get('one'),
      { text: { blocks: [{ lines: ['Første linje'] }] } },
    )]]);
    const compress = jest.spyOn(zlib, 'gzipSync');
    buildCorpusDataset(collected);
    expect(readTexts()[0].full_text).toBe('Første linje');
    expect(compress).toHaveBeenCalledTimes(3);
  });

  it('detects additions, changed selection and deletions', () => {
    buildCorpusDataset(collected, { builtAt });
    collected.texts.set('two', { ...collected.texts.get('one'), id: 'two' });
    write(textPath('two'), JSON.stringify({ text: { blocks: [{ lines: ['Ny tekst'] }] } }));
    expect(buildCorpusDataset(collected).counts.texts).toBe(2);
    collected.texts.get('one').indexable = false;
    expect(buildCorpusDataset(collected).counts.texts).toBe(1);
    expect(readTexts().map(text => text.id)).toEqual(['two']);
    collected.texts.clear();
    collected.works.clear();
    collected.poets.clear();
    expect(buildCorpusDataset(collected).counts).toEqual({ poets: 0, works: 0, texts: 0 });
  });

  it.each(outputFiles)('recreates a missing output file: %s', (filename) => {
    buildCorpusDataset(collected, { builtAt });
    const content = fs.readFileSync(filename);
    fs.rmSync(filename);
    buildCorpusDataset(collected, { builtAt });
    expect(fs.readFileSync(filename)).toEqual(content);
  });

  it('repairs modified output and rebuilds when export code changes', () => {
    buildCorpusDataset(collected, { builtAt });
    const content = fs.readFileSync('public/api/v1/texts.jsonl.gz');
    write('public/api/v1/texts.jsonl.gz', 'broken');
    buildCorpusDataset(collected, { builtAt });
    expect(fs.readFileSync('public/api/v1/texts.jsonl.gz')).toEqual(content);
    fs.appendFileSync('tools/build-static/corpus-dataset.js', '\n// changed\n');
    const compress = jest.spyOn(zlib, 'gzipSync');
    buildCorpusDataset(collected);
    expect(compress).toHaveBeenCalledTimes(3);
  });

  it.each(['missing', 'invalid', 'forced'])('rebuilds with a %s cache', (mode) => {
    buildCorpusDataset(collected, { builtAt });
    if (mode === 'missing') fs.rmSync('caches/corpus-dataset.json');
    if (mode === 'invalid') write('caches/corpus-dataset.json', '{');
    const compress = jest.spyOn(zlib, 'gzipSync');
    expect(buildCorpusDataset(collected, { forceReload: mode === 'forced' }).built_at).toBe(builtAt);
    expect(compress).toHaveBeenCalledTimes(3);
  });

  it('does not cache a failed build', () => {
    buildCorpusDataset(collected, { builtAt });
    const state = fs.readFileSync('caches/corpus-dataset.json');
    collected.texts.get('one').workId = 'missing';
    expect(() => buildCorpusDataset(collected)).toThrow();
    expect(fs.readFileSync('caches/corpus-dataset.json')).toEqual(state);
  });
});
