#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import sharp from 'sharp';

const maxAnalysisDimension = 1200;
const maximumRotation = 3;
const maximumCropPerEdge = 0.05;
const cropSafetyInset = 0.005;
const maximumDarkEdgeFraction = 0.2;
const coarseAngleStep = 0.1;
const fineAngleStep = 0.02;

const usage = () => {
  console.error(`Brug:
  titlepage.js analyze INPUT --out-dir DIR
  titlepage.js render INPUT OUTPUT --angle GRADER --crop LEFT,TOP,WIDTH,HEIGHT
  titlepage.js qa INPUT CANDIDATE --report REPORT.json [--promote OUTPUT]`);
};

const sha256 = filename => {
  return crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
};

const parseOptions = args => {
  const options = new Map();
  const positionals = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith('--') === false) {
      positionals.push(arg);
      continue;
    }

    const value = args[index + 1];
    if (value == null || value.startsWith('--') === true) {
      throw new Error(`Mangler værdi efter ${arg}.`);
    }
    options.set(arg.slice(2), value);
    index += 1;
  }

  return { options, positionals };
};

const requiredOption = (options, name) => {
  const value = options.get(name);
  if (value == null) {
    throw new Error(`Mangler --${name}.`);
  }
  return value;
};

const parseNumber = (value, label) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) === false) {
    throw new Error(`${label} skal være et tal.`);
  }
  return parsed;
};

const parseCrop = value => {
  const values = value.split(',').map((part, index) => {
    return Math.round(parseNumber(part.trim(), `Crop-værdi ${index + 1}`));
  });
  if (values.length !== 4) {
    throw new Error('--crop skal være LEFT,TOP,WIDTH,HEIGHT.');
  }
  const [left, top, width, height] = values;
  if (left < 0 || top < 0 || width < 1 || height < 1) {
    throw new Error('Crop-værdier skal have positiv bredde og højde.');
  }
  return { left, top, width, height };
};

const percentile = (values, fraction) => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round((sorted.length - 1) * fraction))
  );
  return sorted[index];
};

const median = values => percentile(values, 0.5);

const luminance = (red, green, blue) => {
  return Math.round(0.2126 * red + 0.7152 * green + 0.0722 * blue);
};

const orientedDimensions = metadata => {
  const orientation = metadata.orientation ?? 1;
  const swapsAxes = [5, 6, 7, 8].includes(orientation);
  return {
    width: swapsAxes ? metadata.height : metadata.width,
    height: swapsAxes ? metadata.width : metadata.height,
  };
};

const rotatedDimensions = (width, height, angle) => {
  const radians = Math.abs(angle) * Math.PI / 180;
  return {
    width: Math.ceil(width * Math.cos(radians) + height * Math.sin(radians)),
    height: Math.ceil(width * Math.sin(radians) + height * Math.cos(radians)),
  };
};

const analysisPixels = async input => {
  const metadata = await sharp(input).metadata();
  if (metadata.width == null || metadata.height == null) {
    throw new Error(`Kan ikke læse billedmål fra ${input}.`);
  }

  const { data, info } = await sharp(input)
    .autoOrient()
    .removeAlpha()
    .resize({
      width: maxAnalysisDimension,
      height: maxAnalysisDimension,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const gray = new Uint8Array(info.width * info.height);
  const lightSamples = [];
  for (let pixel = 0; pixel < gray.length; pixel += 1) {
    const offset = pixel * info.channels;
    const value = luminance(data[offset], data[offset + 1], data[offset + 2]);
    gray[pixel] = value;
    lightSamples.push(value);
  }

  const lightThreshold = percentile(lightSamples, 0.7);
  const reds = [];
  const greens = [];
  const blues = [];
  for (let pixel = 0; pixel < gray.length; pixel += 1) {
    if (gray[pixel] < lightThreshold) {
      continue;
    }
    const offset = pixel * info.channels;
    reds.push(data[offset]);
    greens.push(data[offset + 1]);
    blues.push(data[offset + 2]);
  }

  return {
    colorData: data,
    gray,
    height: info.height,
    metadata,
    paperColor: {
      r: median(reds),
      g: median(greens),
      b: median(blues),
    },
    width: info.width,
  };
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
    if (bin >= 0 && bin < bins.length) {
      bins[bin] += 1;
    }
  }

  let sumSquares = 0;
  for (const count of bins) {
    sumSquares += count * count;
  }
  return sumSquares / Math.max(1, points.length);
};

const angleRange = (from, to, step) => {
  const values = [];
  for (let angle = from; angle <= to + step / 2; angle += step) {
    values.push(Number(angle.toFixed(4)));
  }
  return values;
};

const estimateRotation = ({ gray, height, width }, region = null) => {
  const bounds = region ?? { left: 0, top: 0, width, height };
  const insetX = Math.round(bounds.width * 0.06);
  const insetY = Math.round(bounds.height * 0.06);
  const fromX = Math.max(0, bounds.left + insetX);
  const toX = Math.min(width, bounds.left + bounds.width - insetX);
  const fromY = Math.max(0, bounds.top + insetY);
  const toY = Math.min(height, bounds.top + bounds.height - insetY);
  const interior = [];
  for (let y = fromY; y < toY; y += 3) {
    for (let x = fromX; x < toX; x += 3) {
      interior.push(gray[y * width + x]);
    }
  }
  const paper = percentile(interior, 0.7);
  const inkThreshold = Math.max(25, paper - 45);
  const points = [];
  for (let y = fromY + 1; y < toY - 1; y += 1) {
    for (let x = fromX; x < toX; x += 2) {
      const value = gray[y * width + x];
      const above = gray[(y - 1) * width + x];
      const below = gray[(y + 1) * width + x];
      const isHorizontalInkEdge =
        value < inkThreshold &&
        (above >= inkThreshold || below >= inkThreshold);
      if (isHorizontalInkEdge) {
        points.push([x, y]);
      }
    }
  }

  if (points.length < 120) {
    return {
      confidence: 0,
      darkPointCount: points.length,
      recommendedAngle: 0,
      status: 'manual-review',
    };
  }

  const coarse = angleRange(-maximumRotation, maximumRotation, coarseAngleStep)
    .map(angle => ({ angle, score: projectionScore(points, width, height, angle) }));
  coarse.sort((left, right) => right.score - left.score);
  const coarseBest = coarse[0];
  const fine = angleRange(
    Math.max(-maximumRotation, coarseBest.angle - coarseAngleStep),
    Math.min(maximumRotation, coarseBest.angle + coarseAngleStep),
    fineAngleStep
  ).map(angle => ({ angle, score: projectionScore(points, width, height, angle) }));
  fine.sort((left, right) => right.score - left.score);
  const best = fine[0];
  const zeroScore = projectionScore(points, width, height, 0);
  const medianScore = median(coarse.map(candidate => candidate.score));
  const confidence = medianScore === 0 ? 0 : best.score / medianScore - 1;
  const improvementOverZero = zeroScore === 0 ? 0 : best.score / zeroScore - 1;
  const recommendedAngle =
    Math.abs(best.angle) < 0.08 || improvementOverZero < 0.005
      ? 0
      : Number((-best.angle).toFixed(2));

  return {
    candidates: coarse.slice(0, 5).map(candidate => ({
      angle: Number((-candidate.angle).toFixed(2)),
      score: Number(candidate.score.toFixed(4)),
    })),
    confidence: Number(confidence.toFixed(4)),
    darkPointCount: points.length,
    improvementOverZero: Number(improvementOverZero.toFixed(4)),
    rawBestAngle: Number((-best.angle).toFixed(2)),
    recommendedAngle,
    status: confidence >= 0.015 ? 'candidate' : 'manual-review',
  };
};

const detectPageCrop = ({ data, height, width }) => {
  const gray = new Uint8Array(width * height);
  const centerValues = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3;
      const value = luminance(data[offset], data[offset + 1], data[offset + 2]);
      gray[y * width + x] = value;
      if (
        x >= width * 0.2 && x <= width * 0.8 &&
        y >= height * 0.2 && y <= height * 0.8
      ) {
        centerValues.push(value);
      }
    }
  }

  const paper = percentile(centerValues, 0.65);
  const pageThreshold = Math.max(45, paper - 70);
  const columnFractions = [];
  const rowFractions = [];

  for (let x = 0; x < width; x += 1) {
    let count = 0;
    for (let y = 0; y < height; y += 2) {
      if (gray[y * width + x] > pageThreshold) {
        count += 1;
      }
    }
    columnFractions.push(count / Math.ceil(height / 2));
  }
  for (let y = 0; y < height; y += 1) {
    let count = 0;
    for (let x = 0; x < width; x += 2) {
      if (gray[y * width + x] > pageThreshold) {
        count += 1;
      }
    }
    rowFractions.push(count / Math.ceil(width / 2));
  }

  const firstAbove = (values, threshold) => {
    const index = values.findIndex(value => value >= threshold);
    return index === -1 ? 0 : index;
  };
  const lastAbove = (values, threshold) => {
    for (let index = values.length - 1; index >= 0; index -= 1) {
      if (values[index] >= threshold) {
        return index;
      }
    }
    return values.length - 1;
  };

  const paddingX = Math.max(2, Math.round(width * 0.002));
  const paddingY = Math.max(2, Math.round(height * 0.002));
  const left = Math.max(0, firstAbove(columnFractions, 0.55) - paddingX);
  const right = Math.min(width - 1, lastAbove(columnFractions, 0.55) + paddingX);
  const top = Math.max(0, firstAbove(rowFractions, 0.55) - paddingY);
  const bottom = Math.min(height - 1, lastAbove(rowFractions, 0.55) + paddingY);
  const crop = {
    left,
    top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
  const removedFraction = 1 - crop.width * crop.height / (width * height);
  const edgeValues = [
    ...gray.slice(0, width),
    ...gray.slice((height - 1) * width),
  ];
  for (let y = 0; y < height; y += 1) {
    edgeValues.push(gray[y * width], gray[y * width + width - 1]);
  }
  const contrast = Math.max(0, paper - median(edgeValues));
  const confidence = Math.min(1, contrast / 90 + removedFraction);

  return {
    confidence: Number(confidence.toFixed(4)),
    crop,
    pageThreshold,
    removedFraction: Number(removedFraction.toFixed(4)),
  };
};

const darkFractionAtEdge = (image, crop, edge, threshold) => {
  const horizontal = edge === 'top' || edge === 'bottom';
  const length = horizontal ? crop.width : crop.height;
  const inset = Math.round(length * 0.08);
  const from = inset;
  const to = Math.max(from + 1, length - inset);
  let dark = 0;
  let sampled = 0;
  for (let offset = from; offset < to; offset += 1) {
    const x = horizontal
      ? crop.left + offset
      : edge === 'left'
        ? crop.left
        : crop.left + crop.width - 1;
    const y = horizontal
      ? edge === 'top'
        ? crop.top
        : crop.top + crop.height - 1
      : crop.top + offset;
    const pixel = (y * image.width + x) * image.channels;
    const value = luminance(
      image.data[pixel],
      image.data[pixel + 1],
      image.data[pixel + 2]
    );
    if (value < threshold) {
      dark += 1;
    }
    sampled += 1;
  }
  return sampled === 0 ? 0 : dark / sampled;
};

const refineDarkCropEdges = (image, initialCrop, paperColor) => {
  const crop = { ...initialCrop };
  const trim = { left: 0, right: 0, top: 0, bottom: 0 };
  const paper = luminance(paperColor.r, paperColor.g, paperColor.b);
  const threshold = Math.max(25, paper - 40);
  for (const edge of ['left', 'right', 'top', 'bottom']) {
    const horizontal = edge === 'top' || edge === 'bottom';
    const dimension = horizontal ? image.height : image.width;
    const maximumMargin = Math.floor(dimension * maximumCropPerEdge);
    const currentMargin =
      edge === 'left'
        ? crop.left
        : edge === 'right'
          ? image.width - crop.left - crop.width
          : edge === 'top'
            ? crop.top
            : image.height - crop.top - crop.height;
    const maximumTrim = Math.max(0, maximumMargin - currentMargin);
    while (
      trim[edge] < maximumTrim &&
      crop.width > 1 &&
      crop.height > 1 &&
      darkFractionAtEdge(image, crop, edge, threshold) >
        maximumDarkEdgeFraction
    ) {
      if (edge === 'left') {
        crop.left += 1;
        crop.width -= 1;
      } else if (edge === 'right') {
        crop.width -= 1;
      } else if (edge === 'top') {
        crop.top += 1;
        crop.height -= 1;
      } else {
        crop.height -= 1;
      }
      trim[edge] += 1;
    }
  }
  return {
    crop,
    threshold,
    trim,
  };
};

const createAnalysisPreview = async (input, output, angle, crop, paperColor) => {
  const { data, info } = await sharp(input)
    .autoOrient()
    .resize({
      width: maxAnalysisDimension,
      height: maxAnalysisDimension,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .rotate(angle, { background: paperColor })
    .jpeg({ quality: 90 })
    .toBuffer({ resolveWithObject: true });
  const scaleX = info.width / crop.analysisWidth;
  const scaleY = info.height / crop.analysisHeight;
  const previewCrop = {
    left: Math.round(crop.left * scaleX),
    top: Math.round(crop.top * scaleY),
    width: Math.round(crop.width * scaleX),
    height: Math.round(crop.height * scaleY),
  };
  const guideLines = [0.2, 0.4, 0.6, 0.8]
    .map(fraction => {
      const y = Math.round(info.height * fraction);
      return `<line x1="0" y1="${y}" x2="${info.width}" y2="${y}" stroke="#ff3344" stroke-width="2" opacity="0.65"/>`;
    })
    .join('');
  const overlay = Buffer.from(`<svg width="${info.width}" height="${info.height}" xmlns="http://www.w3.org/2000/svg">
    ${guideLines}
    <rect x="${previewCrop.left}" y="${previewCrop.top}" width="${previewCrop.width}" height="${previewCrop.height}" fill="none" stroke="#00bcd4" stroke-width="5"/>
  </svg>`);

  await sharp(data)
    .composite([{ input: overlay }])
    .jpeg({ quality: 92 })
    .toFile(output);
};

const analyzeTitlePage = async (input, outDir) => {
  if (fs.existsSync(input) === false) {
    throw new Error(`Input findes ikke: ${input}`);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const pixels = await analysisPixels(input);
  const roughCrop = detectPageCrop({
    data: pixels.colorData,
    height: pixels.height,
    width: pixels.width,
  });
  const rotation = estimateRotation(pixels, roughCrop.crop);
  const rotated = await sharp(pixels.colorData, {
    raw: { width: pixels.width, height: pixels.height, channels: 3 },
  })
    .rotate(rotation.recommendedAngle, { background: { r: 0, g: 0, b: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const cropAnalysis = detectPageCrop({
    data: rotated.data,
    height: rotated.info.height,
    width: rotated.info.width,
  });
  const sourceDimensions = orientedDimensions(pixels.metadata);
  const fullRotated = rotatedDimensions(
    sourceDimensions.width,
    sourceDimensions.height,
    rotation.recommendedAngle
  );
  const normalizedCrop = {
    left: cropAnalysis.crop.left / rotated.info.width,
    top: cropAnalysis.crop.top / rotated.info.height,
    width: cropAnalysis.crop.width / rotated.info.width,
    height: cropAnalysis.crop.height / rotated.info.height,
  };
  const detectedCrop = {
    left: Math.max(0, Math.round(normalizedCrop.left * fullRotated.width)),
    top: Math.max(0, Math.round(normalizedCrop.top * fullRotated.height)),
    width: Math.max(1, Math.round(normalizedCrop.width * fullRotated.width)),
    height: Math.max(1, Math.round(normalizedCrop.height * fullRotated.height)),
  };
  detectedCrop.width = Math.min(
    detectedCrop.width,
    fullRotated.width - detectedCrop.left
  );
  detectedCrop.height = Math.min(
    detectedCrop.height,
    fullRotated.height - detectedCrop.top
  );
  const insetX = Math.round(fullRotated.width * cropSafetyInset);
  const insetY = Math.round(fullRotated.height * cropSafetyInset);
  detectedCrop.left += insetX;
  detectedCrop.top += insetY;
  detectedCrop.width = Math.max(1, detectedCrop.width - insetX * 2);
  detectedCrop.height = Math.max(1, detectedCrop.height - insetY * 2);
  const fullImage = await sharp(input)
    .autoOrient()
    .rotate(rotation.recommendedAngle, { background: pixels.paperColor })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const refinedCrop = refineDarkCropEdges(
    {
      channels: fullImage.info.channels,
      data: fullImage.data,
      height: fullImage.info.height,
      width: fullImage.info.width,
    },
    detectedCrop,
    pixels.paperColor
  );
  const recommendedCrop = refinedCrop.crop;

  const report = {
    command: 'analyze',
    source: path.resolve(input),
    sourceSha256: sha256(input),
    sourceDimensions,
    paperColor: pixels.paperColor,
    recommendedAngle: rotation.recommendedAngle,
    angleConfidence: rotation.confidence,
    angleCandidates: rotation.candidates ?? [],
    angleImprovementOverZero: rotation.improvementOverZero ?? 0,
    angleRawBest: rotation.rawBestAngle ?? 0,
    angleStatus: rotation.status,
    darkPointCount: rotation.darkPointCount,
    recommendedCrop,
    darkEdgeTrim: refinedCrop.trim,
    darkEdgeThreshold: refinedCrop.threshold,
    cropConfidence: cropAnalysis.confidence,
    cropRemovedFraction: cropAnalysis.removedFraction,
    status: rotation.status,
    requiresSourceIdentityCheck: true,
  };
  const reportPath = path.join(outDir, 'analysis.json');
  const previewPath = path.join(outDir, 'analysis-preview.jpg');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await createAnalysisPreview(
    input,
    previewPath,
    rotation.recommendedAngle,
    {
      ...recommendedCrop,
      analysisHeight: fullImage.info.height,
      analysisWidth: fullImage.info.width,
    },
    pixels.paperColor
  );
  return { previewPath, report, reportPath };
};

const validateCrop = (crop, width, height) => {
  if (crop.left + crop.width > width || crop.top + crop.height > height) {
    throw new Error(
      `Crop ${crop.left},${crop.top},${crop.width},${crop.height} ligger uden for det roterede billede ${width}x${height}.`
    );
  }
};

const renderTitlePage = async (input, output, { angle, crop }) => {
  if (path.resolve(input) === path.resolve(output)) {
    throw new Error('Render skal skrive til en scratch-kandidat, ikke overskrive kilden.');
  }
  if (Math.abs(angle) > maximumRotation) {
    throw new Error(
      `Automatisk titelbladsbehandling er begrænset til ±${maximumRotation} grader.`
    );
  }
  const pixels = await analysisPixels(input);
  const sourceMetadata = pixels.metadata;
  const oriented = await sharp(input)
    .autoOrient()
    .withMetadata()
    .png()
    .toBuffer();
  const rotated = await sharp(oriented)
    .rotate(angle, { background: pixels.paperColor })
    .png()
    .toBuffer({ resolveWithObject: true });
  validateCrop(crop, rotated.info.width, rotated.info.height);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await sharp(rotated.data)
    .extract(crop)
    .withMetadata({ density: sourceMetadata.density ?? 300 })
    .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(output);
  const outputMetadata = await sharp(output).metadata();
  const transform = {
    command: 'render',
    source: path.resolve(input),
    sourceSha256: sha256(input),
    candidate: path.resolve(output),
    candidateSha256: sha256(output),
    angle,
    crop,
    sourceDimensions: orientedDimensions(sourceMetadata),
    rotatedDimensions: {
      width: rotated.info.width,
      height: rotated.info.height,
    },
    outputDimensions: {
      width: outputMetadata.width,
      height: outputMetadata.height,
    },
    operations: ['autoOrient', 'rotate', 'crop'],
    scaled: false,
  };
  const transformPath = `${output}.transform.json`;
  fs.writeFileSync(transformPath, `${JSON.stringify(transform, null, 2)}\n`);
  return { output, transform, transformPath };
};

const loadTransform = (candidate, source) => {
  const transformPath = `${candidate}.transform.json`;
  if (fs.existsSync(transformPath) === false) {
    return { path: transformPath, valid: false };
  }
  const transform = JSON.parse(fs.readFileSync(transformPath, 'utf8'));
  const valid =
    transform.sourceSha256 === sha256(source) &&
    transform.candidateSha256 === sha256(candidate) &&
    transform.scaled === false &&
    Array.isArray(transform.operations) === true &&
    transform.operations.join(',') === 'autoOrient,rotate,crop';
  return { path: transformPath, transform, valid };
};

const promoteCandidate = (candidate, destination) => {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const temporary = path.join(
    path.dirname(destination),
    `.${path.basename(destination)}.${process.pid}.tmp`
  );
  fs.copyFileSync(candidate, temporary);
  fs.renameSync(temporary, destination);
};

const titlePageChecksPassed = checks => {
  return (
    checks.jpegOutput === true &&
    checks.deterministicTransform === true &&
    checks.noUpscaling === true &&
    checks.conservativeCrop === true
  );
};

const edgeCropFractions = transform => {
  if (transform?.crop == null || transform.rotatedDimensions == null) {
    return null;
  }
  const { crop, rotatedDimensions: dimensions } = transform;
  return {
    left: crop.left / dimensions.width,
    right: (dimensions.width - crop.left - crop.width) / dimensions.width,
    top: crop.top / dimensions.height,
    bottom: (dimensions.height - crop.top - crop.height) / dimensions.height,
  };
};

const qaTitlePage = async (
  source,
  candidate,
  { promote = null, report: reportPath }
) => {
  if (fs.existsSync(source) === false || fs.existsSync(candidate) === false) {
    throw new Error('Kilde og kandidat skal begge findes før QA.');
  }
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const [sourceMetadata, candidateMetadata] = await Promise.all([
    sharp(source).metadata(),
    sharp(candidate).metadata(),
  ]);
  const transform = loadTransform(candidate, source);
  const sourceDimensions = orientedDimensions(sourceMetadata);
  const candidateDimensions = orientedDimensions(candidateMetadata);
  const areaRetention =
    candidateDimensions.width * candidateDimensions.height /
    (sourceDimensions.width * sourceDimensions.height);
  const cropFractions = edgeCropFractions(transform.transform);
  const conservativeCrop =
    cropFractions != null &&
    Object.values(cropFractions).every(
      fraction => fraction >= 0 && fraction <= maximumCropPerEdge
    );
  const checks = {
    conservativeCrop,
    jpegOutput: candidateMetadata.format === 'jpeg',
    deterministicTransform: transform.valid,
    edgeCropFractions:
      cropFractions == null
        ? null
        : Object.fromEntries(
            Object.entries(cropFractions).map(([edge, fraction]) => [
              edge,
              Number(fraction.toFixed(4)),
            ])
          ),
    maximumCropPerEdge,
    noUpscaling: transform.valid && transform.transform.scaled === false,
  };
  const hardChecksPassed = titlePageChecksPassed(checks);
  const status = hardChecksPassed ? 'pass' : 'manual-review';
  const report = {
    command: 'qa',
    source: path.resolve(source),
    sourceSha256: sha256(source),
    candidate: path.resolve(candidate),
    candidateSha256: sha256(candidate),
    sourceDimensions,
    candidateDimensions,
    areaRetention: Number(areaRetention.toFixed(4)),
    transform: transform.transform ?? null,
    checks,
    status,
    promotedTo: null,
  };
  if (promote != null) {
    if (status !== 'pass') {
      fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
      throw new Error('Kandidaten kan ikke promoveres, fordi QA kræver manuel vurdering.');
    }
    promoteCandidate(candidate, promote);
    report.promotedTo = path.resolve(promote);
    report.promotedSha256 = sha256(promote);
  }
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return report;
};

const runCli = async argv => {
  const [command, ...args] = argv;
  if (command == null) {
    usage();
    return 1;
  }
  const { options, positionals } = parseOptions(args);

  if (command === 'analyze') {
    if (positionals.length !== 1) {
      usage();
      return 1;
    }
    const result = await analyzeTitlePage(
      positionals[0],
      requiredOption(options, 'out-dir')
    );
    console.log(JSON.stringify(result.report, null, 2));
    return result.report.status === 'candidate' ? 0 : 2;
  }

  if (command === 'render') {
    if (positionals.length !== 2) {
      usage();
      return 1;
    }
    const result = await renderTitlePage(positionals[0], positionals[1], {
      angle: parseNumber(requiredOption(options, 'angle'), '--angle'),
      crop: parseCrop(requiredOption(options, 'crop')),
    });
    console.log(JSON.stringify(result.transform, null, 2));
    return 0;
  }

  if (command === 'qa') {
    if (positionals.length !== 2) {
      usage();
      return 1;
    }
    const result = await qaTitlePage(positionals[0], positionals[1], {
      promote: options.get('promote') ?? null,
      report: requiredOption(options, 'report'),
    });
    console.log(JSON.stringify(result, null, 2));
    return result.status === 'pass' ? 0 : 2;
  }

  usage();
  return 1;
};

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli(process.argv.slice(2))
    .then(exitCode => {
      process.exitCode = exitCode;
    })
    .catch(error => {
      console.error(error.message ?? error);
      process.exitCode = 1;
    });
}

export {
  analyzeTitlePage,
  detectPageCrop,
  edgeCropFractions,
  estimateRotation,
  parseCrop,
  qaTitlePage,
  refineDarkCropEdges,
  renderTitlePage,
  titlePageChecksPassed,
};
