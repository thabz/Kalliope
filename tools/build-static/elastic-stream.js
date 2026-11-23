import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import elasticSearchClient from '../libs/elasticsearch-client.js';

const cgroupMemory = () => {
  for (const filename of ['/sys/fs/cgroup/memory.current', '/sys/fs/cgroup/memory/memory.usage_in_bytes']) {
    try {
      const bytes = Number(fs.readFileSync(filename, 'utf8').trim());
      if (Number.isFinite(bytes) === true) return bytes;
    } catch {
      // Optional telemetry must not make indexing fail on an inaccessible cgroup.
    }
  }
  return null;
};
const sampleMemory = stats => {
  const memory = process.memoryUsage();
  stats.maxHeapBytes = Math.max(stats.maxHeapBytes, memory.heapUsed);
  stats.maxRssBytes = Math.max(stats.maxRssBytes, memory.rss);
  const cgroup = cgroupMemory();
  if (cgroup !== null) stats.maxCgroupBytes = Math.max(stats.maxCgroupBytes ?? 0, cgroup);
};
const createIndexingStats = () => {
  const stats = {
    selectedWorks: 0, uniqueSourceFiles: 0, domParses: 0,
    sourceHashReads: 0, sourceHashBytes: 0, documentsBuilt: 0, documentsWritten: 0,
    payloadBytes: 0, bulkRequests: 0, maxBulkDocuments: 0, maxBulkBytes: 0,
    maxInFlight: 0, maxRetainedDocuments: 0, maxRetainedBytes: 0,
    buildMs: 0, sendMs: 0, snapshotMs: 0,
    maxHeapBytes: 0, maxRssBytes: 0, maxCgroupBytes: null,
  };
  sampleMemory(stats);
  return stats;
};
const finishIndexingStats = (stats, start, status) => {
  sampleMemory(stats);
  stats.elapsedMs = performance.now() - start;
  stats.status = status;
  console.log(`Elasticsearch-statistik: ${JSON.stringify(stats)}`);
  return stats;
};

const writeElasticsearchStream = async (index, documents, stats, options) => {
  const { bulkSize, bulkBytes, concurrency } = options;
  const iterator = documents[Symbol.iterator]();
  const active = new Set();
  let buffer = [];
  let bytes = 0;
  let retainedDocuments = 0;
  let retainedBytes = 0;
  let failure = null;
  let capacityAvailable = null;
  const observe = () => {
    stats.maxRetainedDocuments = Math.max(stats.maxRetainedDocuments, retainedDocuments);
    stats.maxRetainedBytes = Math.max(stats.maxRetainedBytes, retainedBytes);
  };
  const flush = async () => {
    if (buffer.length === 0) return;
    const chunk = buffer;
    const chunkBytes = bytes;
    buffer = [];
    bytes = 0;
    stats.bulkRequests += 1;
    stats.payloadBytes += chunkBytes;
    stats.maxBulkDocuments = Math.max(stats.maxBulkDocuments, chunk.length);
    stats.maxBulkBytes = Math.max(stats.maxBulkBytes, chunkBytes);
    const task = (async () => {
      const start = performance.now();
      try {
        await elasticSearchClient.bulkCreate(index, chunk);
        stats.documentsWritten += chunk.length;
        console.log(`Sendte Elasticsearch-dokumenter: ${stats.documentsWritten} (${stats.bulkRequests} bulk requests)`);
      } catch (error) {
        failure ??= error;
      } finally {
        stats.sendMs += performance.now() - start;
        retainedDocuments -= chunk.length;
        retainedBytes -= chunkBytes;
        sampleMemory(stats);
      }
    })();
    active.add(task);
    stats.maxInFlight = Math.max(stats.maxInFlight, active.size);
    task.then(() => {
      active.delete(task);
      const release = capacityAvailable;
      capacityAvailable = null;
      release?.();
    });
    // One producer waiter, rather than repeatedly subscribing Promise.race to
    // a slow request while other requests complete.
    if (active.size >= concurrency) await new Promise(resolve => { capacityAvailable = resolve; });
    if (failure !== null) throw failure;
  };
  try {
    while (failure === null) {
      const start = performance.now();
      const next = iterator.next();
      stats.buildMs += performance.now() - start;
      if (next.done === true) break;
      const document = next.value;
      const documentBytes = Buffer.byteLength(JSON.stringify({ index: { _id: document.id } })) +
        Buffer.byteLength(JSON.stringify(document.data)) + 2;
      stats.documentsBuilt += 1;
      retainedDocuments += 1;
      retainedBytes += documentBytes;
      observe();
      if (documentBytes > bulkBytes) {
        throw new Error(`Elasticsearch-dokument ${document.id} fylder ${documentBytes} bytes; øg KALLIOPE_ELASTICSEARCH_BULK_BYTES (nu ${bulkBytes}).`);
      }
      if (bytes + documentBytes > bulkBytes) await flush();
      buffer.push(document);
      bytes += documentBytes;
      if (stats.documentsBuilt % 500 === 0) {
        console.log(`Opbyggede Elasticsearch-dokumenter: ${stats.documentsBuilt}`);
        sampleMemory(stats);
      }
      if (buffer.length >= bulkSize) await flush();
    }
    if (failure !== null) throw failure;
    await flush();
  } finally {
    iterator.return?.();
    // Rejected requests are captured above; drain everything before any retry.
    await Promise.all(active);
  }
  if (failure !== null) throw failure;
};

export { createIndexingStats, finishIndexingStats, writeElasticsearchStream };
