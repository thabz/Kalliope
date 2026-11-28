import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import pLimit from 'p-limit';
import sharp from 'sharp';
import { resizeImage } from './resize-image.js';
import * as CommonData from '../../common/commondata.js';
import * as ImagePaths from '../../common/imagepaths.js';
import { createProgressReporter } from '../build-static/progress.js';

const configuredConcurrency = Number.parseInt(process.env.KALLIOPE_THUMBNAIL_CONCURRENCY, 10);
const thumbnailConcurrency = Number.isFinite(configuredConcurrency)
  ? Math.max(1, configuredConcurrency) : 1;
// Shared across roots: images and kunst together respect the configured limit.
const limit = pLimit(thumbnailConcurrency);
const stateVersion = 1;
const digest = data => createHash('sha256').update(data).digest('hex');
const isHash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const isRecord = value => value !== null && typeof value === 'object' && Array.isArray(value) === false;

const defaultThumbnailOutputPath = (filename, width, ext) =>
  `public${ImagePaths.thumbnailSrc(filename.replace(/^public/, ''), width, ext)}`;

// Nanoseconds and file identity matter: size + mtime alone misses same-size edits
// with a restored mtime. Unknown identity deliberately disables metadata reuse.
const fingerprint = stats => stats.dev > 0n && stats.ino > 0n &&
    typeof stats.mtimeNs === 'bigint' && typeof stats.ctimeNs === 'bigint'
  ? [stats.dev, stats.ino, stats.size, stats.mtimeNs, stats.ctimeNs].join(':')
  : null;
const fileFingerprint = filename => {
  try {
    const stats = fs.statSync(filename, { bigint: true });
    return stats.isFile() === true ? fingerprint(stats) : null;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return null;
  }
};
const validEntry = entry => isRecord(entry) === true && isHash(entry.hash) === true &&
  (entry.fingerprint === null || (typeof entry.fingerprint === 'string' &&
    /^\d+:\d+:\d+:-?\d+:-?\d+$/.test(entry.fingerprint)));

const atomicJSON = (filename, value) => {
  const temporary = `${filename}.tmp-${process.pid}-${randomUUID()}`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(value));
    fs.renameSync(temporary, filename);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
};

const buildThumbnails = async (topFolder, _isFileModifiedMethod, options = {}) => {
  const start = performance.now();
  const verify = options.verify ?? (process.env.KALLIOPE_VERIFY_IMAGE_THUMBNAILS === 'true');
  const stats = {
    mode: verify === true ? 'verify' : 'metadata',
    sourceFiles: 0, checkedOutputs: 0, cacheHits: 0, generatedOutputs: 0, repairedOutputs: 0,
    sourceHashReads: 0, sourceHashBytes: 0, outputHashReads: 0, outputHashBytes: 0,
    receiptReads: 0, receiptBytes: 0, manifestReads: 0, manifestBytes: 0,
    maxInFlight: 0, scanMs: 0, checkMs: 0, encodeMs: 0, checkpointMs: 0,
  };
  const checkedProgress = createProgressReporter(`Kontrollerede thumbnails i ${topFolder}`, 1000);
  const generatedProgress = createProgressReporter(`Genererede thumbnails i ${topFolder}`, 100);
  const thumbnailOutputPath = options.thumbnailOutputPath ?? defaultThumbnailOutputPath;
  const sourceFiles = [];
  const skipRegExp = new RegExp(`-w\\d+\\.(${CommonData.availableImageFormats.join('|')})$`);
  const scan = dirname => {
    if (fs.existsSync(dirname) === false) {
      console.log(`${dirname} mangler, så genererer ingen thumbs deri.`);
      return;
    }
    if (dirname.endsWith('/social') === true) return;
    for (const entry of fs.readdirSync(dirname, { withFileTypes: true })) {
      if (entry.name === 't') continue;
      const filename = path.join(dirname, entry.name);
      const entryStats = entry.isSymbolicLink() === true ? fs.statSync(filename) : entry;
      if (entryStats.isDirectory() === true) {
        scan(filename);
      } else if (entryStats.isFile() === true && entry.name.endsWith('.jpg') === true &&
          skipRegExp.test(entry.name) === false) {
        const sourceStats = fs.statSync(filename, { bigint: true });
        sourceFiles.push({ filename, mtime: sourceStats.mtimeNs, prepared: false });
      }
    }
  };
  scan(topFolder);
  sourceFiles.sort((left, right) => left.mtime === right.mtime
    ? left.filename.localeCompare(right.filename) : left.mtime > right.mtime ? -1 : 1);
  stats.sourceFiles = sourceFiles.length;
  stats.scanMs = performance.now() - start;

  const checkStart = performance.now();
  // Keep this identical to legacy receipts; unrelated helpers do not invalidate images.
  const generator = digest(fs.readFileSync(new URL('./resize-image.js', import.meta.url)) +
    JSON.stringify(sharp.versions));
  fs.mkdirSync('caches/thumbnails', { recursive: true });
  fs.mkdirSync('caches/thumbnail-state', { recursive: true });
  const statePath = `caches/thumbnail-state/${digest(path.resolve(topFolder))}.json`;
  const readJSON = (filename, kind) => {
    stats[`${kind}Reads`] += 1;
    try {
      const data = fs.readFileSync(filename);
      stats[`${kind}Bytes`] += data.length;
      return JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT' && error instanceof SyntaxError === false) throw error;
      return null;
    }
  };
  const loaded = readJSON(statePath, 'manifest');
  const previousFiles = loaded?.version === stateVersion && isRecord(loaded.files) === true
    ? loaded.files : {};
  const files = Object.create(null);
  let stateChanged = loaded?.version !== stateVersion;
  const remember = (filename, entry) => {
    files[filename] = entry;
    const previous = previousFiles[filename];
    if (previous?.hash !== entry.hash || previous?.fingerprint !== entry.fingerprint ||
        previous?.key !== entry.key) stateChanged = true;
  };
  const hashFile = (filename, kind, before) => {
    const data = fs.readFileSync(filename);
    stats[`${kind}HashReads`] += 1;
    stats[`${kind}HashBytes`] += data.length;
    const hash = digest(data);
    if (fileFingerprint(filename) !== before) {
      throw new Error(`Billedfil ændret under kontrol: ${filename}`);
    }
    return hash;
  };
  const prepareSource = source => {
    const filename = path.resolve(source.filename);
    const current = fileFingerprint(source.filename);
    const previous = previousFiles[filename];
    source.fingerprint = current;
    source.hash = verify === false && current !== null && validEntry(previous) === true &&
        previous.fingerprint === current
      ? previous.hash : hashFile(source.filename, 'source', current);
    source.prepared = true;
    remember(filename, { hash: source.hash, fingerprint: current });
  };
  stats.checkMs += performance.now() - checkStart;

  function* jobs() {
    for (const source of sourceFiles) {
      for (const ext of CommonData.availableImageFormats) {
        for (const width of CommonData.availableImageWidths) {
          yield { source, ext, width };
        }
      }
    }
  }
  const processJob = async ({ source, ext, width }) => {
    let checkStart = performance.now();
    if (source.prepared === false) prepareSource(source);
    const outputfile = thumbnailOutputPath(source.filename, width, ext);
    const absoluteOutput = path.resolve(outputfile);
    const receiptPath = `caches/thumbnails/${digest(absoluteOutput)}.json`;
    const key = digest(JSON.stringify({ source: source.hash, generator, width, ext }));
    const previous = previousFiles[absoluteOutput];
    // A completed manifest replaces per-output receipt reads. Receipts remain the
    // fallback checkpoint if a build dies before publishing its new manifest.
    const receipt = validEntry(previous) === true && previous.key === key
      ? { key: previous.key, output: previous.hash } : readJSON(receiptPath, 'receipt');
    const current = fileFingerprint(outputfile);
    let cacheHit = false;
    if (receipt?.key === key && isHash(receipt.output) === true && current !== null) {
      const outputHash = verify === false && validEntry(previous) === true &&
          previous.fingerprint === current
        ? previous.hash : hashFile(outputfile, 'output', current);
      cacheHit = outputHash === receipt.output;
    } else if (receipt?.key === key && isHash(receipt.output) === true && fs.existsSync(outputfile) === true) {
      // Filesystems without reliable identity must still get full content checks.
      cacheHit = hashFile(outputfile, 'output', current) === receipt.output;
    }
    stats.checkMs += performance.now() - checkStart;
    if (cacheHit === true) {
      remember(absoluteOutput, { key, hash: receipt.output, fingerprint: current });
      stats.cacheHits += 1;
    } else {
      fs.mkdirSync(path.dirname(outputfile), { recursive: true });
      const temporary = `${outputfile}.tmp-${process.pid}-${randomUUID()}.${ext}`;
      try {
        const encodeStart = performance.now();
        await resizeImage(source.filename, temporary, width);
        stats.encodeMs += performance.now() - encodeStart;
        checkStart = performance.now();
        if (fileFingerprint(source.filename) !== source.fingerprint) {
          throw new Error(`Kildefil ændret under generering: ${source.filename}`);
        }
        const outputHash = hashFile(temporary, 'output', fileFingerprint(temporary));
        stats.checkMs += performance.now() - checkStart;
        const checkpointStart = performance.now();
        // Publish only complete outputs; never commit a receipt before its image.
        fs.renameSync(temporary, outputfile);
        atomicJSON(receiptPath, { key, output: outputHash });
        remember(absoluteOutput, { key, hash: outputHash, fingerprint: fileFingerprint(outputfile) });
        stats.checkpointMs += performance.now() - checkpointStart;
        stats.generatedOutputs += 1;
        if (receipt?.key === key) stats.repairedOutputs += 1;
        generatedProgress.increment();
      } finally {
        fs.rmSync(temporary, { force: true });
      }
    }
    stats.checkedOutputs += 1;
    checkedProgress.increment();
  };

  const iterator = jobs();
  let failure = null;
  let inFlight = 0;
  const worker = async () => {
    while (failure === null) {
      const job = iterator.next();
      if (job.done === true) return;
      inFlight += 1;
      stats.maxInFlight = Math.max(stats.maxInFlight, inFlight);
      try {
        await limit(async () => {
          if (failure === null) await processJob(job.value);
        });
      } catch (error) {
        failure ??= error;
      } finally {
        inFlight -= 1;
      }
    }
  };
  // Only this fixed number of promises exists, even for millions of outputs.
  // Drain active workers before rejecting, so a retry cannot race old writes.
  await Promise.all(Array.from({ length: thumbnailConcurrency }, worker));
  if (failure !== null) throw failure;
  if (stateChanged === true || Object.keys(files).length !== Object.keys(previousFiles).length) {
    const checkpointStart = performance.now();
    atomicJSON(statePath, { version: stateVersion, files });
    stats.checkpointMs += performance.now() - checkpointStart;
  }
  checkedProgress.finish();
  generatedProgress.finish();
  stats.hashReads = stats.sourceHashReads + stats.outputHashReads;
  stats.hashBytes = stats.sourceHashBytes + stats.outputHashBytes;
  stats.readBytes = stats.hashBytes + stats.receiptBytes + stats.manifestBytes;
  stats.elapsedMs = performance.now() - start;
  return stats;
};

export { buildThumbnails };
