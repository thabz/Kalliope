// A separate process gives comparable peak-RSS measurements for both modules.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { DOMParser } from '@xmldom/xmldom';
import client from './libs/elasticsearch-client.js';

const args = process.argv.slice(2);
if (args.includes('--help') === true) {
  console.log('Brug: node tools/measure-elasticsearch.js [--module FIL] [--cache-dir MAPPE] [--live] [--index kalliope-benchmark-NAVN] [--incremental]');
  console.log('Standard er en drænet modtager uden Elasticsearch-skrivninger; --live genopretter kun det angivne benchmark-indeks.');
  process.exit(0);
}
const argument = (name, fallback) => {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  if (args[index + 1] == null || args[index + 1].startsWith('--') === true) throw new Error(`Mangler værdi til ${name}`);
  return args[index + 1];
};
const modulePath = path.resolve(argument('--module', 'tools/build-static/elastic.js'));
const cacheDirectory = path.resolve(argument('--cache-dir', 'caches'));
const index = argument('--index', 'kalliope-benchmark-measure');
if (/^kalliope-benchmark-[a-z0-9-]+$/.test(index) === false) throw new Error('Måleindekset skal begynde med kalliope-benchmark-.');
const live = args.includes('--live');
const { update_elasticsearch } = await import(pathToFileURL(modulePath));
const collected = {};
for (const key of ['poets', 'works', 'texts', 'keywords']) {
  collected[key] = new Map(JSON.parse(fs.readFileSync(path.join(cacheDirectory, `collected.${key}.json`))));
}
const counters = { domParses: 0, documents: 0, payloadBytes: 0, bulkRequests: 0, maxBulkDocuments: 0, maxBulkBytes: 0 };
const hashes = new Map();
const parse = DOMParser.prototype.parseFromString;
DOMParser.prototype.parseFromString = function (source, ...rest) {
  if (/<kalliopework\b/.test(source) === true) counters.domParses += 1;
  return parse.call(this, source, ...rest);
};
const bulk = client.bulkCreate.bind(client);
client.bulkCreate = async (index, documents) => {
  let bytes = 0;
  for (const document of documents) {
    const json = JSON.stringify(document.data);
    bytes += Buffer.byteLength(JSON.stringify({ index: { _id: document.id } }) + '\n' + json + '\n');
    hashes.set(document.id, createHash('sha256').update(json).digest('hex'));
  }
  counters.documents += documents.length;
  counters.payloadBytes += bytes;
  counters.bulkRequests += 1;
  counters.maxBulkDocuments = Math.max(counters.maxBulkDocuments, documents.length);
  counters.maxBulkBytes = Math.max(counters.maxBulkBytes, bytes);
  if (live === true) return bulk(index, documents);
  await new Promise(resolve => setImmediate(resolve));
  return { errors: false, items: [] };
};
if (live === false) {
  for (const method of ['indexExists', 'createIndex', 'refreshIndex', 'deletePoet', 'deleteWork']) {
    client[method] = async () => method === 'indexExists' ? true : undefined;
  }
}
const before = process.memoryUsage();
const start = performance.now();
await update_elasticsearch(collected, {
  index, forceRebuild: args.includes('--incremental') === false, skipUnavailable: false,
  // A drained receiver must never acknowledge writes to a real index's checkpoint.
  statePath: `caches/elasticsearch/benchmark-${live === true ? 'live' : 'sink'}-${index}.json`,
});
const elapsedMs = performance.now() - start;
const peakRssBytes = process.resourceUsage().maxRSS * 1024;
const digest = createHash('sha256');
for (const [id, hash] of [...hashes].sort(([a], [b]) => a.localeCompare(b))) digest.update(`${id}\n${hash}\n`);
let indexedDocuments = null;
if (live === true) {
  const response = await fetch(`${process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200'}/${index}/_count`, {
    signal: AbortSignal.timeout(60000),
  });
  if (response.ok === false) throw new Error(`Optælling fejlede: ${response.status}`);
  indexedDocuments = (await response.json()).count;
}
console.log(JSON.stringify({
  node: process.version, platform: process.platform, arch: process.arch,
  cpu: os.cpus()[0]?.model, totalMemoryBytes: os.totalmem(),
  module: modulePath, cacheDirectory, mode: live === true ? 'local-elasticsearch' : 'drained-sink', index,
  elapsedMs, before, after: process.memoryUsage(), peakRssBytes,
  ...counters, uniqueDocuments: hashes.size, indexedDocuments, digest: digest.digest('hex'),
}));
