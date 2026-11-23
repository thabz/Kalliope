import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import elasticSearchClient from '../libs/elasticsearch-client.js';
import { sourceWorkFilename } from './work-cache.js';

const version = 1;
const domVersion = createRequire(import.meta.url)('@xmldom/xmldom/package.json').version;
const hash = value => createHash('sha256').update(value).digest('hex');
const isRecord = value => value !== null && typeof value === 'object' && Array.isArray(value) === false;
const codeDependencies = [
  'tools/build-static/elastic-documents.js', 'tools/build-static/xml.js',
  'tools/build-static/anthologies.js', 'tools/build-static/work-cache.js',
  'tools/build-static/keyword-taxonomy.js', 'tools/libs/helpers.js',
  'tools/libs/bible-abbr.js',
];
const indexStatePath = index => `caches/elasticsearch/${hash(JSON.stringify([
  process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200', index,
]))}.json`;
const loadIndexState = filename => {
  try {
    const value = JSON.parse(fs.readFileSync(filename, 'utf8'));
    const isHash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
    return value?.version === version && typeof value.pending === 'boolean' &&
        isHash(value.format) === true && isHash(value.keywords) === true &&
        isRecord(value.entries) === true && isRecord(value.poets) === true && isRecord(value.files) === true &&
        Object.values(value.poets).every(isHash) === true &&
        Object.values(value.entries).every(entry => isRecord(entry) === true &&
          typeof entry.poetId === 'string' && typeof entry.workId === 'string' && isHash(entry.hash) === true) === true
      ? value : null;
  } catch (error) {
    if (error.code !== 'ENOENT' && error instanceof SyntaxError === false) throw error;
    return null;
  }
};
const saveIndexState = (filename, state) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const temporary = `${filename}.tmp-${process.pid}-${randomUUID()}`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(state));
    fs.renameSync(temporary, filename);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
};

const indexedWorkMetadata = work => ({
  id: work.id, poet_id: work.poet_id, title: work.title,
  year: work.year, status: work.status, type: work.type,
  virtualType: work.virtualType, textIds: work.textIds,
});

const buildIndexSnapshot = (collected, entries, previous, stats) => {
  const files = Object.create(null);
  const sourceHash = filename => {
    if (files[filename] != null) return files[filename].hash;
    let stamp = null;
    try {
      const stat = fs.statSync(filename, { bigint: true });
      stamp = stat.dev > 0n && stat.ino > 0n
        ? [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs].join(':') : null;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      files[filename] = { stamp: null, hash: 'missing' };
      return 'missing';
    }
    const cached = previous?.files[filename];
    let contentHash;
    if (stamp !== null && cached?.stamp === stamp && /^[a-f0-9]{64}$/.test(cached?.hash ?? '') === true) {
      contentHash = cached.hash;
    } else {
      const data = fs.readFileSync(filename);
      stats.sourceHashReads += 1;
      stats.sourceHashBytes += data.length;
      contentHash = hash(data);
    }
    files[filename] = { stamp, hash: contentHash };
    return contentHash;
  };
  const snapshot = {
    version, pending: false,
    // Mapping/document semantics require rebuilding. Transport/batching/logging
    // edits do not. helpers.js is deliberately a conservative dependency.
    format: hash(JSON.stringify({ version, domVersion,
      mapping: elasticSearchClient.createIndex.toString(),
      code: codeDependencies.map(filename => [filename, hash(fs.readFileSync(filename))]),
    })),
    keywords: hash(JSON.stringify(Array.from(collected.keywords ?? []).sort(([a], [b]) => a.localeCompare(b)))),
    poets: Object.create(null), entries: Object.create(null), files,
  };
  for (const poet of collected.poets.values()) snapshot.poets[poet.id] = hash(JSON.stringify(poet));
  const ownership = new Map();
  for (const [id, text] of collected.texts) {
    const filename = sourceWorkFilename(text);
    const group = ownership.get(filename) ?? [];
    group.push([id, text.poetId, text.sourcePoetId, text.sourceWorkId, text.sourceTextId, text.placement]);
    ownership.set(filename, group);
  }
  const ownershipHashes = new Map(Array.from(ownership, ([filename, group]) =>
    [filename, hash(JSON.stringify(group.sort(([a], [b]) => a.localeCompare(b))))]));
  const publications = new Map(Array.from(collected.works, ([key, work]) =>
    [`fdirs/${key}.xml`, hash(JSON.stringify(indexedWorkMetadata(work)))]));
  for (const entry of entries) {
    snapshot.entries[entry.textEntryKey] = {
      poetId: entry.poetId, workId: entry.workId,
      hash: hash(JSON.stringify({
        poet: snapshot.poets[entry.poetId],
        work: indexedWorkMetadata(entry.work),
        sources: entry.sourceFiles.map(filename => [filename, sourceHash(filename), ownershipHashes.get(filename), publications.get(filename)]),
      })),
    };
  }
  return snapshot;
};

export { loadIndexState, buildIndexSnapshot, saveIndexState, indexStatePath };
