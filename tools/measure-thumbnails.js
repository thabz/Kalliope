// Run in a separate process against a prepared scratch root. This also accepts
// the pre-change helpers module, so both revisions use identical instrumentation.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';

const args = process.argv.slice(2);
if (args.length < 1 || args.includes('--help') === true) {
  console.log('Brug: node tools/measure-thumbnails.js SCRATCH-ROOT [HELPERS-MODULE]');
  console.log('Bygger public/images og public/kunst i SCRATCH-ROOT; eksisterende output/cache genbruges.');
  process.exit(args.includes('--help') === true ? 0 : 1);
}
const root = fs.realpathSync(path.resolve(args[0]));
const helperUrl = args[1] == null ? new URL('./libs/helpers.js', import.meta.url)
  : pathToFileURL(path.resolve(args[1]));
const { buildThumbnails } = await import(helperUrl);
for (const folder of ['public/images', 'public/kunst']) {
  if (fs.statSync(path.join(root, folder)).isDirectory() === false) {
    throw new Error(`Mangler billedmappe: ${folder}`);
  }
}
process.chdir(root);
const counters = {
  sourceReads: 0, sourceBytes: 0, outputReads: 0, outputBytes: 0,
  receiptReads: 0, receiptBytes: 0, manifestReads: 0, manifestBytes: 0,
  generatedOutputs: 0,
};
const read = fs.readFileSync;
const rename = fs.renameSync;
// Counts successful JS payload reads, including their returned byte lengths.
// Sharp's native input reads on an encoding miss are outside these counters.
fs.readFileSync = (filename, ...rest) => {
  const data = read(filename, ...rest);
  const name = String(filename);
  const kind = name.startsWith('public/generated/') === true ? 'output'
    : /^public\/(images|kunst)\//.test(name) === true ? 'source'
    : /^caches\/thumbnails\/.*\.json$/.test(name) === true ? 'receipt'
    : name.startsWith('caches/thumbnail-state/') === true ? 'manifest' : null;
  if (kind !== null) {
    counters[`${kind}Reads`] += 1;
    counters[`${kind}Bytes`] += Buffer.byteLength(data);
  }
  return data;
};
fs.renameSync = (from, to) => {
  const result = rename(from, to);
  if (String(to).startsWith('public/generated/') === true) counters.generatedOutputs += 1;
  return result;
};
let result;
const start = performance.now();
try {
  result = await Promise.all(['public/images', 'public/kunst'].map(folder => buildThumbnails(folder, null)));
} finally {
  fs.readFileSync = read;
  fs.renameSync = rename;
}
const elapsedMs = performance.now() - start;
console.log(JSON.stringify({
  root, helpers: helperUrl.href, node: process.version, platform: process.platform,
  arch: process.arch, cpu: os.cpus()[0]?.model, totalMemoryBytes: os.totalmem(),
  concurrency: process.env.KALLIOPE_THUMBNAIL_CONCURRENCY ?? '1',
  elapsedMs, peakRssBytes: process.resourceUsage().maxRSS * 1024,
  ...counters,
  readBytes: counters.sourceBytes + counters.outputBytes + counters.receiptBytes + counters.manifestBytes,
  result,
}));
