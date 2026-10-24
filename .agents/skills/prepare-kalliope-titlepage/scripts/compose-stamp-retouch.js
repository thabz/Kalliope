#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const sha256 = filename => crypto.createHash('sha256')
  .update(fs.readFileSync(filename)).digest('hex');

const decodeRgb = filename => sharp(filename).rotate().removeAlpha()
  .toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });

export const composeStampRetouch = async ({
  source, generated, mask, output, report, kbSourceUrl,
}) => {
  const sourceUrl = new URL(kbSourceUrl);
  if (sourceUrl.protocol !== 'https:' ||
      (sourceUrl.hostname !== 'kb.dk' && sourceUrl.hostname.endsWith('.kb.dk') !== true)) {
    throw new Error('Stempelfjernelse kræver en HTTPS-kilde fra kb.dk.');
  }
  if (path.extname(output).toLowerCase() !== '.png') {
    throw new Error('Arbejdsbilledet skal gemmes tabsfrit som PNG.');
  }
  const inputs = [source, generated, mask].map(filename => fs.realpathSync(filename));
  const outputs = [output, report].map(filename => path.resolve(filename));
  if (new Set(outputs).size !== outputs.length ||
      outputs.some(filename => inputs.includes(filename) === true || fs.existsSync(filename) === true)) {
    throw new Error('Brug nye, forskellige filnavne til billede og rapport; input må ikke overskrives.');
  }

  const [original, edited, maskImage] = await Promise.all([
    decodeRgb(source), decodeRgb(generated),
    sharp(mask).rotate().flatten({ background: '#000000' }).greyscale().raw()
      .toBuffer({ resolveWithObject: true }),
  ]);
  const { width, height, channels } = original.info;
  if ([edited, maskImage].some(image =>
    image.info.width !== width || image.info.height !== height)) {
    throw new Error('Original, forslag og maske skal have samme dimensioner; ingen automatisk skalering.');
  }
  if (channels !== 3 || edited.info.channels !== 3 || maskImage.info.channels !== 1) {
    throw new Error('Kun RGB-billeder og en gråtonemaske understøttes.');
  }

  const pixels = Buffer.from(original.data);
  let maskedPixelCount = 0;
  let changedPixelCount = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const weight = maskImage.data[pixel];
    if (weight === 0) continue;
    maskedPixelCount += 1;
    let changed = false;
    for (let channel = 0; channel < 3; channel += 1) {
      const offset = pixel * 3 + channel;
      pixels[offset] = Math.round(
        original.data[offset] + (edited.data[offset] - original.data[offset]) * weight / 255,
      );
      if (pixels[offset] !== original.data[offset]) changed = true;
    }
    if (changed === true) {
      changedPixelCount += 1;
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  if (maskedPixelCount === 0 || maskedPixelCount === width * height) {
    throw new Error('Masken skal afgrænse et lokalt område, ikke være tom eller dække hele siden.');
  }
  if (changedPixelCount === 0) throw new Error('Masken gav ingen ændringer.');

  const encoded = await sharp(pixels, { raw: { width, height, channels: 3 } })
    .png().toBuffer();
  const decoded = await sharp(encoded).removeAlpha().toColourspace('srgb').raw().toBuffer();
  let outsideMaskChangedPixels = 0;
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    if (maskImage.data[pixel] !== 0) continue;
    const offset = pixel * 3;
    if ([0, 1, 2].some(channel => decoded[offset + channel] !== original.data[offset + channel])) {
      outsideMaskChangedPixels += 1;
    }
  }
  if (outsideMaskChangedPixels !== 0) {
    throw new Error('PNG-kontrollen fandt ændringer uden for masken.');
  }
  const result = {
    kbSourceUrl: sourceUrl.href,
    source: { path: path.resolve(source), sha256: sha256(source) },
    generated: { path: path.resolve(generated), sha256: sha256(generated) },
    mask: { path: path.resolve(mask), sha256: sha256(mask) },
    output: {
      path: path.resolve(output),
      sha256: crypto.createHash('sha256').update(encoded).digest('hex'),
    },
    width, height, maskedPixelCount, changedPixelCount, outsideMaskChangedPixels,
    changedBounds: { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
  };
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.mkdirSync(path.dirname(report), { recursive: true });
  fs.writeFileSync(output, encoded, { flag: 'wx' });
  fs.writeFileSync(report, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  return result;
};

const runCli = async () => {
  const [source, generated, mask, output, kbSourceUrl, report] = process.argv.slice(2);
  if ([source, generated, mask, output, kbSourceUrl, report].some(value => value == null)) {
    console.error('Brug: compose-stamp-retouch.js ORIGINAL FORSLAG MASKE OUTPUT.png KB-URL RAPPORT.json');
    process.exitCode = 1;
  } else {
    try {
      console.log(JSON.stringify(await composeStampRetouch({
        source, generated, mask, output, kbSourceUrl, report,
      }), null, 2));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
};

if (process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
