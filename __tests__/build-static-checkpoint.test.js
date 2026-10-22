import fs from 'fs';
import vm from 'vm';
import os from 'os';
import path from 'path';
import { writeCachedJSON } from '../tools/libs/caching.js';

// Execute the actual orchestration with lightweight build stages. Failure points
// model interruption without requiring the full corpus or image collection.
const source = fs.readFileSync('tools/build-static.js', 'utf8');
const mainSource = source.slice(source.indexOf('const main = async () => {'), source.indexOf('\nmain().catch'));

const runBuild = async (failure) => {
  const events = [];
  const collected = { corpusTextRecords: new Map(), poetFilesCache: { version: 1, files: {} } };
  const context = {
    collected,
    skipImageThumbnails: false,
    skipElasticsearch: true,
    buildSqlite: false,
    showTimings: false,
    console: { log() {} },
    safeMkdir() {},
    build_dict_first_pass() {},
    flushImageSizeCache: () => events.push('image-sizes'),
    refreshFilesModifiedCache: () => events.push('file-hashes'),
    writeCachedJSON: key => events.push(key),
    b: async (name) => {
      events.push(name);
      if (name === failure) throw new Error('interrupted');
      return {};
    },
  };
  for (const match of mainSource.matchAll(/await b\(\s*'[^']+',\s*(\w+)/g)) {
    context[match[1]] = () => {};
  }
  vm.runInNewContext(`${mainSource}\nglobalThis.run = main;`, context);
  await expect(context.run()).rejects.toThrow('interrupted');
  return events;
};

it('checkpoints the completed text build before thumbnails can be interrupted', async () => {
  const events = await runBuild('build_image_thumbnails');
  expect(events.indexOf('poet-files')).toBeGreaterThan(events.indexOf('build_anniversaries_ical'));
  expect(events.indexOf('image-sizes')).toBeLessThan(events.indexOf('file-hashes'));
  expect(events.indexOf('poet-files')).toBeLessThan(events.indexOf('file-hashes'));
  expect(events.indexOf('file-hashes')).toBeLessThan(events.indexOf('build_image_thumbnails'));
});

it('does not publish discovery or input hashes when text output is incomplete', async () => {
  const events = await runBuild('works_second_pass');
  expect(events).not.toContain('poet-files');
  expect(events).not.toContain('file-hashes');
  expect(events).not.toContain('build_image_thumbnails');
});

it('preserves the previous cache if publishing a new cache fails', () => {
  const previousDirectory = process.cwd();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-checkpoint-'));
  let rename;
  try {
    process.chdir(directory);
    fs.mkdirSync('caches');
    writeCachedJSON('poet-files', { version: 'previous' });
    rename = jest.spyOn(fs, 'renameSync').mockImplementation(() => {
      throw new Error('interrupted');
    });
    expect(() => writeCachedJSON('poet-files', { version: 'next' })).toThrow('interrupted');
    expect(JSON.parse(fs.readFileSync('caches/poet-files.json'))).toEqual({ version: 'previous' });
    expect(fs.readdirSync('caches')).toEqual(['poet-files.json']);
  } finally {
    rename?.mockRestore();
    process.chdir(previousDirectory);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
