import { isFileModified, force_reload } from '../libs/caching.js';
import elasticSearchClient from '../libs/elasticsearch-client.js';
import { worksForPoet } from './anthologies.js';
import { buildElasticsearchTextEntryDocuments, iterateElasticsearchTextEntryDocuments } from './elastic-documents.js';
import { writeElasticsearchStream, createIndexingStats, finishIndexingStats } from './elastic-stream.js';
import { loadIndexState, buildIndexSnapshot, saveIndexState, indexStatePath } from './elastic-state.js';
import { performance } from 'node:perf_hooks';

const elasticsearchConcurrency = Math.max(
  1,
  Number.parseInt(process.env.KALLIOPE_ELASTICSEARCH_CONCURRENCY ?? '1', 10)
);
const elasticsearchBulkSize = Math.max(
  1,
  Number.parseInt(process.env.KALLIOPE_ELASTICSEARCH_BULK_SIZE ?? '500', 10)
);
const elasticsearchForceRebuild = ['1', 'true', 'yes'].includes(
  (process.env.KALLIOPE_ELASTICSEARCH_FORCE_REBUILD ?? '').toLowerCase()
);

const getElasticsearchTextEntryKey = (poetId, workId) => `${poetId}-${workId}`;

const getElasticsearchTextEntrySourceFiles = (poetId, workId, work) =>
  work.sourceFiles ?? [
    `fdirs/${poetId}/info.xml`,
    `fdirs/${poetId}/${workId}.xml`,
  ];

const includesPoet = (poetIds, poetId) =>
  poetIds == null || poetIds.has(poetId);

const selectedPoetIds = (collected, poetIds) => {
  if (poetIds == null) {
    return null;
  }

  const selected = new Set(poetIds);
  const unknown = Array.from(selected).filter(
    poetId => collected.poets.has(poetId) === false
  );
  if (unknown.length > 0) {
    throw new Error(
      `Unknown Elasticsearch poet ids: ${unknown.sort().join(', ')}`
    );
  }
  if (selected.size === 0) {
    throw new Error('Elasticsearch poet selection cannot be empty.');
  }
  return selected;
};

const buildElasticsearchTextEntries = (collected, poetIds = null) => {
  const entries = [];

  collected.poets.forEach((poet, poetId) => {
    if (includesPoet(poetIds, poetId) === false) {
      return;
    }
    worksForPoet(collected, poetId).forEach(work => {
      const workId = work.id;
      entries.push({
        poet,
        poetId,
        workId,
        work,
        textEntryKey: getElasticsearchTextEntryKey(poetId, workId),
        sourceFiles: getElasticsearchTextEntrySourceFiles(
          poetId,
          workId,
          work
        ),
      });
    });
  });

  return entries.sort((a, b) => a.textEntryKey.localeCompare(b.textEntryKey));
};

const getChangedElasticsearchTextEntries = (textEntries, changedPoetIds = []) => {
  const modifiedPoetIds = new Set(changedPoetIds);
  const modifiedTextEntryKeys = new Set();

  textEntries.forEach(entry => {
    if (isFileModified(`fdirs/${entry.poetId}/info.xml`)) {
      modifiedPoetIds.add(entry.poetId);
    } else if (isFileModified(...entry.sourceFiles)) {
      modifiedTextEntryKeys.add(entry.textEntryKey);
    }
  });

  return {
    modifiedPoetIds,
    entries: textEntries.filter(
      entry =>
        modifiedPoetIds.has(entry.poetId) ||
        modifiedTextEntryKeys.has(entry.textEntryKey)
    ),
  };
};

const getPoetSearchText = poet => {
  const name = poet.name ?? {};
  return [
    name.firstname,
    name.lastname,
    name.fullname,
    name.pseudonym,
    name.christened,
    name.realname,
    name.sortname,
  ]
    .filter(value => value != null && value !== '')
    .join(' ');
};

const buildElasticsearchPoetEntries = (collected, poetIds = null) => {
  return Array.from(collected.poets.values())
    .filter(poet => includesPoet(poetIds, poet.id))
    .map(poet => ({
      id: `poet-${poet.id}`,
      data: {
        result_type: 'poet',
        poet,
        poet_search: getPoetSearchText(poet),
      },
    }));
};

const buildElasticsearchKeywordEntries = collected => {
  return Array.from(collected.keywords?.values() ?? [])
    .filter(keyword => keyword.isDraft !== true)
    .map(keyword => ({
      id: `keyword-${keyword.id}`,
      data: {
        result_type: 'keyword',
        keyword: {
          id: keyword.id,
          title: keyword.title,
          redirectURL: keyword.redirectURL,
        },
      },
    }));
};


const isElasticsearchUnavailable = error => {
  const unavailableCodes = new Set([
    'ECONNREFUSED',
    'ECONNRESET',
    'ENOTFOUND',
    'EHOSTUNREACH',
    'ETIMEDOUT',
    'EPERM',
  ]);
  const pending = error == null ? [] : [error];

  while (pending.length > 0) {
    const current = pending.pop();
    if (
      unavailableCodes.has(current.code) ||
      unavailableCodes.has(current.errno)
    ) {
      return true;
    }
    if (
      /\b(ECONNREFUSED|ECONNRESET|ENOTFOUND|EHOSTUNREACH|ETIMEDOUT)\b/.test(
        current.message ?? ''
      )
    ) {
      return true;
    }
    if (current.cause != null) {
      pending.push(current.cause);
    }
    if (Array.isArray(current.errors)) {
      pending.push(...current.errors);
    }
  }

  return false;
};

const update_elasticsearch = async (collected, options = {}) => {
  const start = performance.now();
  const index = options.index ?? 'kalliope';
  const poetIds = selectedPoetIds(collected, options.poetIds ?? null);
  const forceRebuild = options.forceRebuild ?? elasticsearchForceRebuild;
  const skipUnavailable = options.skipUnavailable ?? true;
  const statePath = options.statePath ?? indexStatePath(index);
  const stats = createIndexingStats();
  const streamOptions = {
    bulkSize: options.bulkSize ?? elasticsearchBulkSize,
    bulkBytes: options.bulkBytes ?? Math.max(1, Number.parseInt(process.env.KALLIOPE_ELASTICSEARCH_BULK_BYTES ?? '8388608', 10)),
    concurrency: options.concurrency ?? elasticsearchConcurrency,
  };
  for (const [name, value] of Object.entries(streamOptions)) {
    if (Number.isInteger(value) === false || value < 1) throw new Error(`Ugyldig Elasticsearch-grænse ${name}: ${value}`);
  }
  let status = 'failed';
  try {
    const indexExists = await elasticSearchClient.indexExists(index);
    const previous = loadIndexState(statePath);
    const textEntries = buildElasticsearchTextEntries(collected, poetIds);
    const snapshotStart = performance.now();
    const current = buildIndexSnapshot(collected, textEntries, previous, stats);
    stats.snapshotMs = performance.now() - snapshotStart;
    current.selection = poetIds === null ? null : Array.from(poetIds).sort();
    const reasons = [];
    if (force_reload === true) reasons.push('force-reload');
    if (forceRebuild === true) reasons.push('explicit-force-rebuild');
    if (poetIds !== null) reasons.push('selected-poets');
    if (indexExists === false) reasons.push('missing-index');
    if (previous === null) reasons.push('missing-or-invalid-checkpoint');
    if (previous !== null && JSON.stringify(previous.selection ?? null) !== JSON.stringify(current.selection)) reasons.push('selection-changed');
    if (previous?.pending === true) reasons.push('unfinished-previous-update');
    if (previous !== null && previous.format !== current.format) reasons.push('index-format-or-dependencies');
    if (previous !== null && previous.keywords !== current.keywords) reasons.push('shared-keyword-metadata');
    stats.fullRebuildReasons = reasons;
    const full = reasons.length > 0;
    const changedPoets = new Set();
    const removedEntries = [];
    if (full === false) {
      for (const id of new Set([...Object.keys(previous.poets), ...Object.keys(current.poets)])) {
        if (previous.poets[id] !== current.poets[id]) changedPoets.add(id);
      }
      for (const [key, entry] of Object.entries(previous.entries)) {
        if (current.entries[key] === undefined) removedEntries.push(entry);
      }
    }
    const selectedEntries = full === true ? textEntries : textEntries.filter(entry =>
      changedPoets.has(entry.poetId) === true ||
      previous.entries[entry.textEntryKey]?.hash !== current.entries[entry.textEntryKey].hash);
    stats.selectedWorks = selectedEntries.length;
    if (full === false && selectedEntries.length === 0 && removedEntries.length === 0 && changedPoets.size === 0) {
      console.log('Skipping Elasticsearch update; no changed text entries');
      // Metadata-only source changes can refresh the snapshot without index writes.
      if (stats.sourceHashReads > 0) saveIndexState(statePath, current);
      status = 'unchanged';
      return;
    }
    console.log(`Elasticsearch: ${full === true ? 'fuld genindeksering' : 'inkrementel opdatering'}; ` +
      `årsager=${reasons.join(',')}; valgte værker=${selectedEntries.length}; slettede værker=${removedEntries.length}`);
    // Independent of the global file cache, which build-static checkpoints before
    // thumbnails/search. Any partial mutation forces a complete retry next time.
    saveIndexState(statePath, { ...current, pending: true });
    if (full === true) {
      await elasticSearchClient.createIndex(index);
    } else {
      for (const poetId of changedPoets) await elasticSearchClient.deletePoet(index, poetId);
      const removals = new Map();
      for (const entry of [...removedEntries, ...selectedEntries]) {
        if (changedPoets.has(entry.poetId) === false) removals.set(getElasticsearchTextEntryKey(entry.poetId, entry.workId), entry);
      }
      for (const entry of removals.values()) await elasticSearchClient.deleteWork(index, entry.poetId, entry.workId);
    }
    // Keep each document family separate, preserving the existing bulk API.
    function* poetDocuments() {
      for (const poet of collected.poets.values()) {
        if (includesPoet(poetIds, poet.id) === true && (full === true || changedPoets.has(poet.id) === true)) {
          yield { id: `poet-${poet.id}`, data: { result_type: 'poet', poet, poet_search: getPoetSearchText(poet) } };
        }
      }
    }
    function* keywordDocuments() {
      if (full === false) return;
      for (const keyword of collected.keywords?.values() ?? []) {
        if (keyword.isDraft === true) continue;
        yield { id: `keyword-${keyword.id}`, data: { result_type: 'keyword', keyword: {
          id: keyword.id, title: keyword.title, redirectURL: keyword.redirectURL,
        } } };
      }
    }
    const sourceFiles = new Set();
    const onParse = filename => {
      stats.domParses += 1;
      sourceFiles.add(filename);
      stats.uniqueSourceFiles = sourceFiles.size;
    };
    function* textDocuments() {
      for (const entry of selectedEntries) {
        yield* iterateElasticsearchTextEntryDocuments(collected, entry, onParse);
      }
    }
    for (const documents of [poetDocuments(), keywordDocuments(), textDocuments()]) {
      await writeElasticsearchStream(index, documents, stats, streamOptions);
    }
    await elasticSearchClient.refreshIndex(index);
    saveIndexState(statePath, current);
    status = 'complete';
  } catch (error) {
    if (skipUnavailable === true && isElasticsearchUnavailable(error) === true) {
      status = 'unavailable';
      console.log('Elasticsearch server not available; skipping search index update.');
      return;
    }
    console.log('Elasticsearch update failed.');
    console.log(error);
    throw error;
  } finally {
    finishIndexingStats(stats, start, status);
  }
};

export {
  buildElasticsearchKeywordEntries,
  buildElasticsearchPoetEntries,
  buildElasticsearchTextEntries,
  buildElasticsearchTextEntryDocuments,
  getChangedElasticsearchTextEntries,
  update_elasticsearch,
};
