#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

import sharp from 'sharp';

const contractVersion = 1;
const defaultDpi = 300;
const defaultSampleSize = 5;
const minimumDenseCharacters = 500;
const maximumSkew = 3;
const supportedImageExtensions = new Set([
  '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.tif', '.tiff', '.webp',
]);

const usage = () => {
  console.error(`Brug:
  fraktur-ocr.js prepare SOURCE --out-dir DIR [--dpi 300]
  fraktur-ocr.js sample --out-dir DIR [--sample-size 5]
  fraktur-ocr.js recognize --out-dir DIR [--scope sample|all] [--include-binarized]
  fraktur-ocr.js compare --out-dir DIR [--ground-truth DIR]
  fraktur-ocr.js verify --out-dir DIR
  fraktur-ocr.js run SOURCE --out-dir DIR [--ground-truth DIR]`);
};

const parseArguments = args => {
  const positionals = [];
  const options = new Map();
  const booleanOptions = new Set(['include-binarized']);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith('--') === false) {
      positionals.push(arg);
      continue;
    }
    const name = arg.slice(2);
    if (booleanOptions.has(name)) {
      options.set(name, true);
      continue;
    }
    const value = args[index + 1];
    if (value == null || value.startsWith('--') === true) {
      throw new Error(`Mangler værdi efter ${arg}.`);
    }
    options.set(name, value);
    index += 1;
  }
  return { options, positionals };
};

const requiredOption = (options, name) => {
  const value = options.get(name);
  if (value == null) throw new Error(`Mangler --${name}.`);
  return value;
};

const parsePositiveInteger = (value, label) => {
  const parsed = Number(value);
  if (Number.isInteger(parsed) === false || parsed < 1) {
    throw new Error(`${label} skal være et positivt heltal.`);
  }
  return parsed;
};

const ensureDirectory = directory => fs.mkdirSync(directory, { recursive: true });

const sha256Buffer = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const sha256File = filename => sha256Buffer(fs.readFileSync(filename));

const writeJson = (filename, value) => {
  ensureDirectory(path.dirname(filename));
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`);
};

const writeJsonLines = (filename, values) => {
  ensureDirectory(path.dirname(filename));
  const body = values.map(value => JSON.stringify(value)).join('\n');
  fs.writeFileSync(filename, body.length > 0 ? `${body}\n` : '');
};

const readJson = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));
const readJsonLines = filename => fs.readFileSync(filename, 'utf8')
  .split(/\r?\n/u)
  .filter(line => line.trim().length > 0)
  .map(line => JSON.parse(line));

const groupBy = (values, keyForValue) => {
  const grouped = new Map();
  for (const value of values) {
    const key = keyForValue(value);
    const group = grouped.get(key) ?? [];
    group.push(value);
    grouped.set(key, group);
  }
  return grouped;
};

const relativePath = (root, filename) => path.relative(root, filename).split(path.sep).join('/');
const resolveBundlePath = (root, filename) => path.resolve(root, filename);

const runCommand = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: options.encoding ?? 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error != null) throw result.error;
  if (result.status !== 0 && options.allowFailure !== true) {
    const detail = `${result.stderr ?? ''}`.trim();
    throw new Error(`${command} fejlede (${result.status})${detail.length > 0 ? `: ${detail}` : ''}`);
  }
  return result;
};

const commandAvailable = command => {
  const result = spawnSync(command, ['--version'], { encoding: 'utf8' });
  return result.error == null;
};

const commandVersion = command => {
  const result = runCommand(command, ['--version'], { allowFailure: true });
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`
    .split(/\r?\n/u)
    .map(line => line.trim())
    .find(line => line.length > 0) ?? '';
};

const installedTesseractLanguages = () => {
  const result = runCommand('tesseract', ['--list-langs']);
  return new Set(`${result.stdout}\n${result.stderr}`.split(/\r?\n/u).map(line => line.trim()));
};

const checkDependencies = ({ pdf = false, recognition = true } = {}) => {
  const required = ['tesseract'];
  if (pdf === true) required.push('pdftoppm');
  const missing = required.filter(command => commandAvailable(command) === false);
  if (missing.length > 0) throw new Error(`Manglende kommando(er): ${missing.join(', ')}`);

  if (recognition === true) {
    const installed = installedTesseractLanguages();
    const requiredLanguages = ['dan', 'frk', 'osd', 'script/Fraktur'];
    const missingLanguages = requiredLanguages.filter(language => installed.has(language) === false);
    if (missingLanguages.length > 0) {
      throw new Error(`Manglende Tesseract-model(ler): ${missingLanguages.join(', ')}`);
    }
  }
};

const percentile = (values, fraction) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.round((sorted.length - 1) * fraction)));
  return sorted[index];
};

const projectionScore = (points, width, height, angle) => {
  const radians = angle * Math.PI / 180;
  const sine = Math.sin(radians);
  const cosine = Math.cos(radians);
  const centerX = width / 2;
  const centerY = height / 2;
  const bins = new Uint32Array(Math.ceil(Math.hypot(width, height)) + 4);
  const offset = bins.length / 2;
  for (const [x, y] of points) {
    const rotatedY = -(x - centerX) * sine + (y - centerY) * cosine;
    const bin = Math.round(rotatedY + offset);
    if (bin >= 0 && bin < bins.length) bins[bin] += 1;
  }
  let sumSquares = 0;
  for (const count of bins) sumSquares += count * count;
  return sumSquares / Math.max(1, points.length);
};

const angleRange = (from, to, step) => {
  const values = [];
  for (let angle = from; angle <= to + step / 2; angle += step) {
    values.push(Number(angle.toFixed(3)));
  }
  return values;
};

const analyzePixels = async input => {
  const { data, info } = await sharp(input)
    .grayscale()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { gray: data, height: info.height, width: info.width };
};

const estimateSkew = pixels => {
  const { gray, height, width } = pixels;
  const samples = [];
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) samples.push(gray[y * width + x]);
  }
  const paper = percentile(samples, 0.7);
  const inkThreshold = Math.max(25, paper - 50);
  const points = [];
  const insetX = Math.round(width * 0.05);
  const insetY = Math.round(height * 0.05);
  for (let y = insetY + 1; y < height - insetY - 1; y += 1) {
    for (let x = insetX; x < width - insetX; x += 2) {
      const value = gray[y * width + x];
      const above = gray[(y - 1) * width + x];
      const below = gray[(y + 1) * width + x];
      if (value < inkThreshold && (above >= inkThreshold || below >= inkThreshold)) {
        points.push([x, y]);
      }
    }
  }
  if (points.length < 120) {
    return { angle: 0, confidence: 0, status: 'manual_review', point_count: points.length };
  }
  const coarse = angleRange(-maximumSkew, maximumSkew, 0.2)
    .map(angle => ({ angle, score: projectionScore(points, width, height, angle) }))
    .sort((left, right) => right.score - left.score);
  const coarseBest = coarse[0];
  const fine = angleRange(
    Math.max(-maximumSkew, coarseBest.angle - 0.2),
    Math.min(maximumSkew, coarseBest.angle + 0.2),
    0.05,
  ).map(angle => ({ angle, score: projectionScore(points, width, height, angle) }))
    .sort((left, right) => right.score - left.score);
  const best = fine[0];
  const zeroScore = projectionScore(points, width, height, 0);
  const improvement = (best.score - zeroScore) / Math.max(1, zeroScore);
  const correction = Math.abs(best.angle) < 0.08 || improvement < 0.004
    ? 0
    : Number((-best.angle).toFixed(2));
  return {
    angle: correction,
    confidence: Number(Math.max(0, improvement).toFixed(4)),
    status: Math.abs(correction) >= maximumSkew ? 'manual_review' : 'candidate',
    point_count: points.length,
  };
};

const darkFraction = (pixels, axis, index, threshold = 85) => {
  const { gray, height, width } = pixels;
  let dark = 0;
  const length = axis === 'row' ? width : height;
  for (let offset = 0; offset < length; offset += 1) {
    const value = axis === 'row'
      ? gray[index * width + offset]
      : gray[offset * width + index];
    if (value < threshold) dark += 1;
  }
  return dark / Math.max(1, length);
};

const continuousDarkBand = (pixels, edge) => {
  const horizontal = edge === 'top' || edge === 'bottom';
  const length = horizontal ? pixels.height : pixels.width;
  const maximum = Math.floor(length * 0.08);
  let band = 0;
  for (let offset = 0; offset < maximum; offset += 1) {
    const index = edge === 'bottom' || edge === 'right' ? length - 1 - offset : offset;
    const fraction = darkFraction(pixels, horizontal ? 'row' : 'column', index);
    if (fraction < 0.55) break;
    band += 1;
  }
  return band;
};

const detectScannerCrop = pixels => ({
  bottom: continuousDarkBand(pixels, 'bottom'),
  left: continuousDarkBand(pixels, 'left'),
  right: continuousDarkBand(pixels, 'right'),
  top: continuousDarkBand(pixels, 'top'),
});

const scaleCrop = (bands, analysis, metadata) => {
  const scaleX = metadata.width / analysis.width;
  const scaleY = metadata.height / analysis.height;
  const left = Math.max(0, Math.floor(bands.left * scaleX));
  const right = Math.max(0, Math.floor(bands.right * scaleX));
  const top = Math.max(0, Math.floor(bands.top * scaleY));
  const bottom = Math.max(0, Math.floor(bands.bottom * scaleY));
  return {
    left,
    top,
    width: metadata.width - left - right,
    height: metadata.height - top - bottom,
    removed: { bottom, left, right, top },
  };
};

const imageDarkPixelFraction = async input => {
  const { data, info } = await sharp(input)
    .grayscale()
    .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let dark = 0;
  for (const value of data) {
    if (value < 128) dark += 1;
  }
  return Number((dark / Math.max(1, info.width * info.height)).toFixed(6));
};

const parseOrientation = output => {
  const rotation = /Rotate:\s*(0|90|180|270)/u.exec(output);
  const confidence = /Orientation confidence:\s*([0-9.]+)/u.exec(output);
  return {
    confidence: confidence == null ? 0 : Number(confidence[1]),
    rotation: rotation == null ? 0 : Number(rotation[1]),
  };
};

const detectCoarseOrientation = input => {
  const result = runCommand('tesseract', [input, 'stdout', '--psm', '0', '-l', 'osd'], {
    allowFailure: true,
  });
  const parsed = parseOrientation(`${result.stdout ?? ''}\n${result.stderr ?? ''}`);
  return {
    ...parsed,
    applied_rotation: parsed.confidence >= 5 ? parsed.rotation : 0,
    status: result.status === 0 && parsed.confidence >= 5 ? 'candidate' : 'manual_review',
  };
};

const describeVariant = async (root, filename, transformations) => {
  const metadata = await sharp(filename).metadata();
  return {
    path: relativePath(root, filename),
    sha256: sha256File(filename),
    width: metadata.width,
    height: metadata.height,
    dark_pixel_fraction: await imageDarkPixelFraction(filename),
    transformations,
  };
};

const preparePageImage = async (input, root, pageId, options = {}) => {
  const originalFile = path.join(root, 'images', 'original', `${pageId}.png`);
  const cleanedFile = path.join(root, 'images', 'cleaned', `${pageId}.png`);
  const binarizedFile = path.join(root, 'images', 'binarized', `${pageId}.png`);
  ensureDirectory(path.dirname(originalFile));
  ensureDirectory(path.dirname(cleanedFile));
  ensureDirectory(path.dirname(binarizedFile));

  await sharp(input)
    .autoOrient()
    .flatten({ background: '#ffffff' })
    .png()
    .withMetadata({ density: options.dpi ?? defaultDpi })
    .toFile(originalFile);

  const orientation = options.orientation ?? detectCoarseOrientation(originalFile);
  const oriented = await sharp(originalFile)
    .rotate(orientation.applied_rotation ?? 0, { background: '#ffffff' })
    .png()
    .toBuffer();
  const analysis = await analyzePixels(oriented);
  const metadata = await sharp(oriented).metadata();
  const crop = scaleCrop(detectScannerCrop(analysis), analysis, metadata);
  if (crop.width < 1 || crop.height < 1) throw new Error(`Ugyldig beskæring af ${pageId}.`);
  const cropped = await sharp(oriented)
    .extract({ left: crop.left, top: crop.top, width: crop.width, height: crop.height })
    .png()
    .toBuffer();
  const skew = options.skew ?? estimateSkew(await analyzePixels(cropped));
  const deskewed = await sharp(cropped)
    .rotate(skew.angle, { background: '#ffffff' })
    .png()
    .toBuffer();

  await sharp(deskewed)
    .grayscale()
    .normalize()
    .extend({ top: 10, bottom: 10, left: 10, right: 10, background: '#ffffff' })
    .png()
    .withMetadata({ density: options.dpi ?? defaultDpi })
    .toFile(cleanedFile);
  await sharp(cleanedFile).threshold(180).png().toFile(binarizedFile);

  const original = await describeVariant(root, originalFile, ['auto_orient', 'flatten_alpha']);
  const cleaned = await describeVariant(root, cleanedFile, [
    'coarse_orientation', 'deskew', 'scanner_edge_crop', 'grayscale', 'normalize', 'white_border',
  ]);
  const binarized = await describeVariant(root, binarizedFile, ['threshold_180']);
  const excessiveLoss = crop.removed.left > metadata.width * 0.08
    || crop.removed.right > metadata.width * 0.08
    || crop.removed.top > metadata.height * 0.08
    || crop.removed.bottom > metadata.height * 0.08;
  const status = excessiveLoss === true
    || skew.status === 'manual_review'
    || orientation.status === 'manual_review'
    ? 'manual_review'
    : 'candidate';

  return {
    page_id: pageId,
    source_file: path.resolve(input),
    source_sha256: sha256File(input),
    dpi: options.dpi ?? defaultDpi,
    orientation,
    deskew: skew,
    crop,
    status,
    variants: { binarized, cleaned, original },
  };
};

const numericSuffix = filename => Number(/(\d+)(?=\.[^.]+$)/u.exec(filename)?.[1] ?? 0);

const sourceImages = (source, root, dpi) => {
  const stat = fs.statSync(source);
  if (stat.isDirectory() === true) {
    return fs.readdirSync(source)
      .filter(filename => supportedImageExtensions.has(path.extname(filename).toLowerCase()))
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
      .map(filename => path.join(source, filename));
  }
  if (path.extname(source).toLowerCase() !== '.pdf') {
    throw new Error('SOURCE skal være en PDF eller en mappe med billeder.');
  }
  const renderDirectory = path.join(root, '.render');
  ensureDirectory(renderDirectory);
  const prefix = path.join(renderDirectory, 'page');
  runCommand('pdftoppm', ['-r', String(dpi), '-png', source, prefix]);
  return fs.readdirSync(renderDirectory)
    .filter(filename => /^page-\d+\.png$/u.test(filename))
    .sort((left, right) => numericSuffix(left) - numericSuffix(right))
    .map(filename => path.join(renderDirectory, filename));
};

const sourceIdentity = (source, inputs) => {
  const records = inputs.map(filename => ({ file: path.resolve(filename), sha256: sha256File(filename) }));
  const sourceIsFile = fs.statSync(source).isFile() === true;
  return {
    kind: sourceIsFile ? 'file' : 'image_directory',
    path: path.resolve(source),
    sha256: sourceIsFile
      ? sha256File(source)
      : sha256Buffer(Buffer.from(records.map(record => `${record.file}:${record.sha256}`).join('\n'))),
    files: records,
  };
};

const prepareBundle = async (source, root, options = {}) => {
  const resolvedSource = path.resolve(source);
  const resolvedRoot = path.resolve(root);
  if (fs.existsSync(resolvedSource) === false) throw new Error(`Kilden findes ikke: ${resolvedSource}`);
  if (fs.existsSync(path.join(resolvedRoot, 'bundle.json'))) {
    throw new Error(`Outputmappen indeholder allerede bundle.json: ${resolvedRoot}`);
  }
  const isPdf = fs.statSync(resolvedSource).isFile() === true
    && path.extname(resolvedSource).toLowerCase() === '.pdf';
  checkDependencies({ pdf: isPdf, recognition: true });
  ensureDirectory(resolvedRoot);
  const dpi = options.dpi ?? defaultDpi;
  const inputs = sourceImages(resolvedSource, resolvedRoot, dpi);
  if (inputs.length === 0) throw new Error('Kilden indeholder ingen understøttede sidebilleder.');

  const pages = [];
  for (let index = 0; index < inputs.length; index += 1) {
    const pageId = `page-${String(index + 1).padStart(4, '0')}`;
    pages.push({
      ...(await preparePageImage(inputs[index], resolvedRoot, pageId, { dpi })),
      pdf_page: index + 1,
    });
  }
  writeJsonLines(path.join(resolvedRoot, 'pages.jsonl'), pages);
  const bundle = {
    contract_version: contractVersion,
    created_at: new Date().toISOString(),
    source: sourceIdentity(resolvedSource, inputs),
    page_count: pages.length,
    dpi,
    tools: {
      node: process.version,
      sharp: sharp.versions.sharp,
      tesseract: commandVersion('tesseract'),
      pdftoppm: isPdf ? commandVersion('pdftoppm') : null,
    },
    stages: { compare: 'pending', prepare: 'complete', recognize: 'pending', sample: 'pending', verify: 'pending' },
  };
  writeJson(path.join(resolvedRoot, 'bundle.json'), bundle);
  return { bundle, pages };
};

const parseTsvMetrics = tsv => {
  const rows = tsv.split(/\r?\n/u).slice(1).map(line => line.split('\t'));
  const words = rows.filter(columns => columns.length >= 12 && columns[11].trim().length > 0);
  const text = words.map(columns => columns[11]).join(' ');
  const confidences = words
    .map(columns => Number(columns[10]))
    .filter(value => Number.isFinite(value) && value >= 0);
  const lineKeys = new Set(words.map(columns => columns.slice(1, 5).join(':')));
  return {
    character_count: text.replace(/\s/gu, '').length,
    word_count: words.length,
    line_count: lineKeys.size,
    mean_confidence: confidences.length === 0
      ? null
      : Number((confidences.reduce((sum, value) => sum + value, 0) / confidences.length).toFixed(3)),
  };
};

const scoutPage = (input, output) => {
  const result = runCommand('tesseract', [input, 'stdout', '-l', 'frk', '--oem', '1', '--psm', '3', 'tsv'], {
    allowFailure: true,
  });
  ensureDirectory(path.dirname(output));
  fs.writeFileSync(output, result.stdout ?? '');
  if (result.status !== 0) throw new Error(`Spejder-OCR fejlede for ${path.basename(input)}.`);
  return parseTsvMetrics(result.stdout ?? '');
};

const selectDensePages = (pages, sampleSize = defaultSampleSize) => {
  const eligible = pages.filter(page => page.pdf_page > 5);
  const count = Math.min(sampleSize, eligible.length);
  if (count === 0) return { selected: [], status: 'insufficient_sample' };
  const selected = [];
  for (let interval = 0; interval < count; interval += 1) {
    const start = Math.floor(interval * eligible.length / count);
    const end = Math.floor((interval + 1) * eligible.length / count);
    const candidates = eligible.slice(start, Math.max(start + 1, end));
    const winner = [...candidates].sort((left, right) => {
      const difference = (right.scout?.character_count ?? 0) - (left.scout?.character_count ?? 0);
      return difference !== 0 ? difference : left.pdf_page - right.pdf_page;
    })[0];
    selected.push({
      page_id: winner.page_id,
      pdf_page: winner.pdf_page,
      interval: interval + 1,
      character_count: winner.scout?.character_count ?? 0,
      density_status: (winner.scout?.character_count ?? 0) >= minimumDenseCharacters
        ? 'dense'
        : 'low_density',
    });
  }
  return {
    selected,
    status: eligible.length < sampleSize ? 'insufficient_sample' : 'complete',
  };
};

const sampleBundle = (root, options = {}) => {
  const resolvedRoot = path.resolve(root);
  const bundleFile = path.join(resolvedRoot, 'bundle.json');
  const pagesFile = path.join(resolvedRoot, 'pages.jsonl');
  const bundle = readJson(bundleFile);
  const pages = readJsonLines(pagesFile);
  checkDependencies({ recognition: true });
  for (const page of pages) {
    if (page.pdf_page <= 5) continue;
    const input = resolveBundlePath(resolvedRoot, page.variants.original.path);
    const output = path.join(resolvedRoot, 'scout', `${page.page_id}.tsv`);
    page.scout = { ...scoutPage(input, output), path: relativePath(resolvedRoot, output), sha256: sha256File(output) };
  }
  const sample = selectDensePages(pages, options.sampleSize ?? defaultSampleSize);
  const selectedById = new Map(sample.selected.map(record => [record.page_id, record]));
  for (const page of pages) page.sample = selectedById.get(page.page_id) ?? { selected: false };
  for (const selected of sample.selected) selectedById.get(selected.page_id).selected = true;
  writeJsonLines(pagesFile, pages);
  bundle.sample = sample;
  bundle.stages.sample = sample.status;
  writeJson(bundleFile, bundle);
  return sample;
};

const balancedConfigurations = ({ includeBinarized = false } = {}) => {
  const configurations = [];
  for (const variant of ['original', 'cleaned']) {
    for (const psm of [3, 4, 6]) configurations.push({ language: 'frk', psm, variant });
  }
  configurations.push({ language: 'script/Fraktur', psm: 3, variant: 'cleaned' });
  configurations.push({ language: 'dan', psm: 3, variant: 'cleaned' });
  if (includeBinarized === true) configurations.push({ language: 'frk', psm: 3, variant: 'binarized' });
  return configurations.map(configuration => ({
    ...configuration,
    configuration_id: `${configuration.language.replaceAll('/', '-')}-psm${configuration.psm}-${configuration.variant}`,
  }));
};

const runRecognition = (root, page, configuration) => {
  const started = Date.now();
  const runDirectory = path.join(root, 'ocr', configuration.configuration_id);
  ensureDirectory(runDirectory);
  const input = resolveBundlePath(root, page.variants[configuration.variant].path);
  const outputBase = path.join(runDirectory, page.page_id);
  const args = [
    input, outputBase, '-l', configuration.language, '--oem', '1', '--psm', String(configuration.psm),
    '-c', 'preserve_interword_spaces=1', '-c', 'tessedit_write_images=true', 'txt', 'tsv',
  ];
  const result = runCommand('tesseract', args, { allowFailure: true, cwd: runDirectory });
  const textFile = `${outputBase}.txt`;
  const tsvFile = `${outputBase}.tsv`;
  const processedCandidates = [`${outputBase}.processed.tif`, path.join(runDirectory, 'tessinput.tif')];
  const processedFile = processedCandidates.find(filename => fs.existsSync(filename));
  const succeeded = result.status === 0 && fs.existsSync(textFile) && fs.existsSync(tsvFile);
  return {
    page_id: page.page_id,
    pdf_page: page.pdf_page,
    ...configuration,
    command: ['tesseract', ...args],
    duration_ms: Date.now() - started,
    status: succeeded ? 'complete' : 'failed',
    stderr: `${result.stderr ?? ''}`.trim(),
    outputs: {
      processed: processedFile == null ? null : { path: relativePath(root, processedFile), sha256: sha256File(processedFile) },
      text: fs.existsSync(textFile) ? { path: relativePath(root, textFile), sha256: sha256File(textFile) } : null,
      tsv: fs.existsSync(tsvFile) ? { path: relativePath(root, tsvFile), sha256: sha256File(tsvFile) } : null,
    },
    metrics: fs.existsSync(tsvFile) ? parseTsvMetrics(fs.readFileSync(tsvFile, 'utf8')) : null,
  };
};

const recognizeBundle = (root, options = {}) => {
  const resolvedRoot = path.resolve(root);
  const bundleFile = path.join(resolvedRoot, 'bundle.json');
  const bundle = readJson(bundleFile);
  const pages = readJsonLines(path.join(resolvedRoot, 'pages.jsonl'));
  checkDependencies({ recognition: true });
  const scope = options.scope ?? 'sample';
  if (scope !== 'sample' && scope !== 'all') throw new Error('--scope skal være sample eller all.');
  const selectedPages = scope === 'all' ? pages : pages.filter(page => page.sample?.selected === true);
  if (selectedPages.length === 0) throw new Error('Ingen sider er valgt til OCR. Kør sample først.');
  const configurations = balancedConfigurations({ includeBinarized: options.includeBinarized === true });
  const runs = [];
  for (const configuration of configurations) {
    for (const page of selectedPages) runs.push(runRecognition(resolvedRoot, page, configuration));
  }
  writeJsonLines(path.join(resolvedRoot, 'runs.jsonl'), runs);
  bundle.recognition = { configuration_count: configurations.length, run_count: runs.length, scope };
  bundle.stages.recognize = runs.every(run => run.status === 'complete') ? 'complete' : 'failed';
  writeJson(bundleFile, bundle);
  return runs;
};

const exactNormalize = text => text.normalize('NFC').replaceAll('\r\n', '\n').replaceAll('\r', '\n').replace(/\n$/u, '');
const comparisonNormalize = text => exactNormalize(text)
  .replace(/[‘’]/gu, "'")
  .replace(/[“”«»]/gu, '"')
  .replace(/\s+/gu, ' ')
  .trim();

const levenshtein = (left, right) => {
  const leftItems = [...left];
  const rightItems = [...right];
  let previous = Array.from({ length: rightItems.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= leftItems.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= rightItems.length; rightIndex += 1) {
      const substitution = previous[rightIndex - 1] + (leftItems[leftIndex - 1] === rightItems[rightIndex - 1] ? 0 : 1);
      current[rightIndex] = Math.min(previous[rightIndex] + 1, current[rightIndex - 1] + 1, substitution);
    }
    previous = current;
  }
  return previous[rightItems.length];
};

const errorRate = (actual, expected) => Number((levenshtein(actual, expected) / Math.max(1, [...expected].length)).toFixed(6));
const wordErrorRate = (actual, expected) => errorRate(
  actual.split(/\s+/u).filter(word => word.length > 0),
  expected.split(/\s+/u).filter(word => word.length > 0),
);

const compareBundle = (root, options = {}) => {
  const resolvedRoot = path.resolve(root);
  const bundleFile = path.join(resolvedRoot, 'bundle.json');
  const bundle = readJson(bundleFile);
  const runs = readJsonLines(path.join(resolvedRoot, 'runs.jsonl')).filter(run => run.status === 'complete');
  const groundTruth = options.groundTruth == null ? null : path.resolve(options.groundTruth);
  const enriched = runs.map(run => {
    const text = fs.readFileSync(resolveBundlePath(resolvedRoot, run.outputs.text.path), 'utf8');
    const truthFile = groundTruth == null ? null : path.join(groundTruth, `${run.page_id}.txt`);
    const truth = truthFile != null && fs.existsSync(truthFile) ? fs.readFileSync(truthFile, 'utf8') : null;
    return {
      ...run,
      recognized_text: text,
      evaluation: truth == null ? null : {
        exact_cer: errorRate(exactNormalize(text), exactNormalize(truth)),
        normalized_cer: errorRate(comparisonNormalize(text), comparisonNormalize(truth)),
        wer: wordErrorRate(comparisonNormalize(text), comparisonNormalize(truth)),
      },
    };
  });
  const candidates = [];
  const byPage = groupBy(enriched, run => run.page_id);
  for (const [pageId, pageRuns] of byPage) {
    for (let left = 0; left < pageRuns.length; left += 1) {
      for (let right = left + 1; right < pageRuns.length; right += 1) {
        const leftText = comparisonNormalize(pageRuns[left].recognized_text);
        const rightText = comparisonNormalize(pageRuns[right].recognized_text);
        const disagreement = errorRate(leftText, rightText);
        if (disagreement === 0) continue;
        candidates.push({
          page_id: pageId,
          pdf_page: pageRuns[left].pdf_page,
          left_configuration: pageRuns[left].configuration_id,
          right_configuration: pageRuns[right].configuration_id,
          normalized_disagreement: disagreement,
          status: 'candidate',
        });
      }
    }
  }
  const byConfiguration = groupBy(enriched, run => run.configuration_id);
  const configurations = [...byConfiguration.entries()].map(([configurationId, configRuns]) => {
    const evaluated = configRuns.filter(run => run.evaluation != null);
    const confidences = configRuns.map(run => run.metrics?.mean_confidence).filter(value => value != null);
    const average = field => evaluated.length === 0
      ? null
      : Number((evaluated.reduce((sum, run) => sum + run.evaluation[field], 0) / evaluated.length).toFixed(6));
    return {
      configuration_id: configurationId,
      page_count: configRuns.length,
      ground_truth_page_count: evaluated.length,
      mean_confidence: confidences.length === 0
        ? null
        : Number((confidences.reduce((sum, value) => sum + value, 0) / confidences.length).toFixed(3)),
      exact_cer: average('exact_cer'),
      normalized_cer: average('normalized_cer'),
      wer: average('wer'),
    };
  });
  const ranked = configurations.filter(configuration => configuration.exact_cer != null)
    .sort((left, right) => left.exact_cer - right.exact_cer);
  const comparison = {
    ground_truth: groundTruth,
    has_ground_truth: ranked.length > 0,
    recommended_configuration: ranked[0]?.configuration_id ?? null,
    configurations,
    candidate_count: candidates.length,
  };
  const comparisonFile = path.join(resolvedRoot, 'comparison.json');
  const candidatesFile = path.join(resolvedRoot, 'candidates.jsonl');
  writeJson(comparisonFile, comparison);
  writeJsonLines(candidatesFile, candidates);
  bundle.comparison = {
    has_ground_truth: comparison.has_ground_truth,
    recommended_configuration: comparison.recommended_configuration,
    candidate_count: candidates.length,
    files: {
      candidates: { path: relativePath(resolvedRoot, candidatesFile), sha256: sha256File(candidatesFile) },
      comparison: { path: relativePath(resolvedRoot, comparisonFile), sha256: sha256File(comparisonFile) },
    },
  };
  bundle.stages.compare = 'complete';
  writeJson(bundleFile, bundle);
  return comparison;
};

const verifyHashRecord = (root, record, errors, label) => {
  if (record == null) {
    errors.push(`${label} mangler.`);
    return;
  }
  const filename = resolveBundlePath(root, record.path);
  if (fs.existsSync(filename) === false) {
    errors.push(`${label} findes ikke: ${record.path}`);
  } else if (sha256File(filename) !== record.sha256) {
    errors.push(`${label} har forkert hash: ${record.path}`);
  }
};

const verifyBundle = root => {
  const resolvedRoot = path.resolve(root);
  const bundleFile = path.join(resolvedRoot, 'bundle.json');
  const bundle = readJson(bundleFile);
  const pages = readJsonLines(path.join(resolvedRoot, 'pages.jsonl'));
  const runs = readJsonLines(path.join(resolvedRoot, 'runs.jsonl'));
  const errors = [];
  if (bundle.contract_version !== contractVersion) errors.push(`Ukendt kontraktversion: ${bundle.contract_version}`);
  for (const stage of ['prepare', 'recognize', 'compare']) {
    if (bundle.stages[stage] !== 'complete') errors.push(`Stadiet ${stage} er ikke complete.`);
  }
  if (pages.length !== bundle.page_count) errors.push('Sideantallet stemmer ikke med bundle.json.');
  for (const page of pages) {
    for (const variant of ['original', 'cleaned', 'binarized']) {
      verifyHashRecord(resolvedRoot, page.variants[variant], errors, `${page.page_id}/${variant}`);
    }
    if (page.scout != null) verifyHashRecord(resolvedRoot, page.scout, errors, `${page.page_id}/scout`);
  }
  if (runs.length === 0) errors.push('Der findes ingen OCR-kørsler.');
  for (const run of runs) {
    if (run.status !== 'complete') errors.push(`${run.page_id}/${run.configuration_id} fejlede.`);
    verifyHashRecord(resolvedRoot, run.outputs.text, errors, `${run.page_id}/${run.configuration_id}/text`);
    verifyHashRecord(resolvedRoot, run.outputs.tsv, errors, `${run.page_id}/${run.configuration_id}/tsv`);
    if (run.outputs.processed != null) {
      verifyHashRecord(resolvedRoot, run.outputs.processed, errors, `${run.page_id}/${run.configuration_id}/processed`);
    }
  }
  verifyHashRecord(resolvedRoot, bundle.comparison?.files?.comparison, errors, 'comparison.json');
  verifyHashRecord(resolvedRoot, bundle.comparison?.files?.candidates, errors, 'candidates.jsonl');
  const result = { checked_at: new Date().toISOString(), error_count: errors.length, errors, status: errors.length === 0 ? 'valid' : 'invalid' };
  bundle.verification = result;
  bundle.stages.verify = result.status;
  writeJson(bundleFile, bundle);
  if (errors.length > 0) throw new Error(`OCR-bundtet er ugyldigt:\n- ${errors.join('\n- ')}`);
  return result;
};

const runPipeline = async (source, root, options = {}) => {
  await prepareBundle(source, root, { dpi: options.dpi });
  sampleBundle(root, { sampleSize: options.sampleSize });
  recognizeBundle(root, { includeBinarized: options.includeBinarized, scope: 'sample' });
  compareBundle(root, { groundTruth: options.groundTruth });
  return verifyBundle(root);
};

const main = async () => {
  const [command, ...rest] = process.argv.slice(2);
  if (command == null) {
    usage();
    process.exitCode = 2;
    return;
  }
  const { options, positionals } = parseArguments(rest);
  const root = requiredOption(options, 'out-dir');
  if (command === 'prepare') {
    if (positionals[0] == null) throw new Error('Mangler SOURCE.');
    await prepareBundle(positionals[0], root, { dpi: parsePositiveInteger(options.get('dpi') ?? defaultDpi, '--dpi') });
  } else if (command === 'sample') {
    sampleBundle(root, { sampleSize: parsePositiveInteger(options.get('sample-size') ?? defaultSampleSize, '--sample-size') });
  } else if (command === 'recognize') {
    recognizeBundle(root, { includeBinarized: options.get('include-binarized') === true, scope: options.get('scope') ?? 'sample' });
  } else if (command === 'compare') {
    compareBundle(root, { groundTruth: options.get('ground-truth') });
  } else if (command === 'verify') {
    verifyBundle(root);
  } else if (command === 'run') {
    if (positionals[0] == null) throw new Error('Mangler SOURCE.');
    await runPipeline(positionals[0], root, {
      dpi: parsePositiveInteger(options.get('dpi') ?? defaultDpi, '--dpi'),
      groundTruth: options.get('ground-truth'),
      includeBinarized: options.get('include-binarized') === true,
      sampleSize: parsePositiveInteger(options.get('sample-size') ?? defaultSampleSize, '--sample-size'),
    });
  } else {
    usage();
    process.exitCode = 2;
  }
};

export {
  balancedConfigurations,
  compareBundle,
  comparisonNormalize,
  errorRate,
  estimateSkew,
  exactNormalize,
  parseOrientation,
  parseTsvMetrics,
  prepareBundle,
  preparePageImage,
  runPipeline,
  sampleBundle,
  selectDensePages,
  verifyBundle,
  wordErrorRate,
};

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
