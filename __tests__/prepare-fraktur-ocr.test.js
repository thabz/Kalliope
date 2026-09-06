import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

import sharp from 'sharp';

import {
  balancedConfigurations,
  comparisonNormalize,
  errorRate,
  estimateSkew,
  parseOrientation,
  parseTsvMetrics,
  preparePageImage,
  runPipeline,
  selectDensePages,
  verifyBundle,
  wordErrorRate,
} from '../.codex/skills/prepare-fraktur-ocr/scripts/fraktur-ocr.js';

describe('prepare-fraktur-ocr image processing', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'fraktur-ocr-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  const createPage = async (filename, angle = 0) => {
    const lines = Array.from({ length: 12 }, (_, index) => {
      const y = 35 + index * 15;
      return `<rect x="35" y="${y}" width="180" height="4" fill="#111"/>`;
    }).join('');
    const svg = Buffer.from(`<svg width="250" height="230" xmlns="http://www.w3.org/2000/svg">
      <rect width="250" height="230" fill="#000" fill-opacity="0.75"/>
      <rect x="10" y="10" width="230" height="210" fill="#eee8d8"/>
      ${lines}
    </svg>`);
    await sharp(svg)
      .rotate(angle, { background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(filename);
  };

  it('runs real rotation, deskew, edge cleanup, grayscale and binarization', async () => {
    const source = path.join(root, 'source.png');
    await createPage(source);

    const page = await preparePageImage(source, root, 'page-0006', {
      dpi: 300,
      orientation: {
        applied_rotation: 90,
        confidence: 12,
        rotation: 90,
        status: 'candidate',
      },
      skew: { angle: -0.75, confidence: 0.2, point_count: 400, status: 'candidate' },
    });

    const original = await sharp(path.join(root, page.variants.original.path)).metadata();
    const cleaned = await sharp(path.join(root, page.variants.cleaned.path)).metadata();
    const binarized = await sharp(path.join(root, page.variants.binarized.path))
      .raw()
      .toBuffer();

    expect(original.hasAlpha).toBe(false);
    expect(cleaned.hasAlpha).toBe(false);
    expect(page.orientation.applied_rotation).toBe(90);
    expect(page.deskew.angle).toBe(-0.75);
    expect(Object.values(page.crop.removed).some(value => value > 0)).toBe(true);
    expect(new Set(binarized).size).toBeLessThanOrEqual(2);
    expect(page.variants.cleaned.transformations).toEqual(expect.arrayContaining([
      'deskew', 'scanner_edge_crop', 'normalize',
    ]));
  });

  it('estimates a small skew from repeated text-like horizontal strokes', async () => {
    const source = path.join(root, 'skewed.png');
    await createPage(source, 1.2);
    const { data, info } = await sharp(source)
      .flatten({ background: '#ffffff' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const result = estimateSkew({ gray: data, height: info.height, width: info.width });

    expect(result.status).toBe('candidate');
    expect(Math.abs(result.angle)).toBeGreaterThan(0.5);
    expect(Math.abs(result.angle)).toBeLessThanOrEqual(1.8);
  });
});

const tesseractLanguages = (() => {
  const result = spawnSync('tesseract', ['--list-langs'], { encoding: 'utf8' });
  return result.error == null ? new Set(`${result.stdout}\n${result.stderr}`.split(/\r?\n/u)) : new Set();
})();
const hasFrakturIntegration = ['dan', 'frk', 'osd', 'script/Fraktur']
  .every(language => tesseractLanguages.has(language));

(hasFrakturIntegration ? it : it.skip)('runs the complete real cleaning and Tesseract pipeline when models exist', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fraktur-ocr-integration-'));
  const source = path.join(root, 'source');
  const bundle = path.join(root, 'bundle');
  fs.mkdirSync(source);
  try {
    const textLines = Array.from({ length: 14 }, (_, index) => {
      return `<text x="30" y="${35 + index * 17}" font-size="14" fill="#111">Historisk dansk Fraktur tekstlinje ${index + 1}</text>`;
    }).join('');
    const svg = Buffer.from(`<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#eee8d8"/>${textLines}
    </svg>`);
    for (let page = 1; page <= 6; page += 1) {
      await sharp(svg).png().toFile(path.join(source, `page-${page}.png`));
    }

    const result = await runPipeline(source, bundle);
    const runs = fs.readFileSync(path.join(bundle, 'runs.jsonl'), 'utf8').trim().split('\n');

    expect(result.status).toBe('valid');
    expect(runs).toHaveLength(8);
    const cleanedPage = path.join(bundle, 'images', 'cleaned', 'page-0006.png');
    expect(fs.existsSync(cleanedPage)).toBe(true);

    fs.appendFileSync(cleanedPage, 'changed');
    expect(() => verifyBundle(bundle)).toThrow('forkert hash');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}, 60000);

describe('prepare-fraktur-ocr sampling and OCR contract', () => {
  it('never samples the first five pages and chooses dense pages across the book', () => {
    const pages = Array.from({ length: 25 }, (_, index) => ({
      page_id: `page-${String(index + 1).padStart(4, '0')}`,
      pdf_page: index + 1,
      scout: { character_count: (index + 1) * 10 },
    }));
    pages[7].scout.character_count = 900;
    pages[11].scout.character_count = 1000;
    pages[15].scout.character_count = 1100;
    pages[19].scout.character_count = 1200;
    pages[24].scout.character_count = 1300;

    const sample = selectDensePages(pages, 5);

    expect(sample.selected.map(page => page.pdf_page)).toEqual([8, 12, 16, 20, 25]);
    expect(sample.selected.every(page => page.pdf_page > 5)).toBe(true);
    expect(sample.selected.every(page => page.density_status === 'dense')).toBe(true);
  });

  it('marks short publications and text-poor selections explicitly', () => {
    const pages = Array.from({ length: 8 }, (_, index) => ({
      page_id: `page-${index + 1}`,
      pdf_page: index + 1,
      scout: { character_count: 20 + index },
    }));

    const sample = selectDensePages(pages, 5);

    expect(sample.status).toBe('insufficient_sample');
    expect(sample.selected).toHaveLength(3);
    expect(sample.selected.every(page => page.density_status === 'low_density')).toBe(true);
  });

  it('defines eight balanced default recognition passes', () => {
    const configurations = balancedConfigurations();

    expect(configurations).toHaveLength(8);
    expect(new Set(configurations.map(configuration => configuration.language))).toEqual(
      new Set(['frk', 'script/Fraktur', 'dan']),
    );
    expect(configurations).toContainEqual(expect.objectContaining({ language: 'frk', psm: 6, variant: 'cleaned' }));
    expect(balancedConfigurations({ includeBinarized: true })).toHaveLength(9);
  });

  it('parses orientation and TSV density without treating headers as text', () => {
    const tsv = [
      'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext',
      '5\t1\t1\t1\t1\t1\t0\t0\t10\t10\t90.5\tFørste',
      '5\t1\t1\t1\t1\t2\t0\t0\t10\t10\t80.5\tLinje',
      '5\t1\t1\t1\t2\t1\t0\t0\t10\t10\t70\tAnden',
    ].join('\n');

    expect(parseOrientation('Orientation confidence: 8.2\nRotate: 270')).toEqual({
      confidence: 8.2,
      rotation: 270,
    });
    expect(parseTsvMetrics(tsv)).toEqual({
      character_count: 16,
      line_count: 2,
      mean_confidence: 80.333,
      word_count: 3,
    });
  });

  it('keeps exact and comparison normalization separate', () => {
    expect(comparisonNormalize('“Høi”\n  Sang')).toBe('"Høi" Sang');
    expect(errorRate('abc', 'adc')).toBeCloseTo(1 / 3, 5);
    expect(wordErrorRate('en gammel bog', 'en anden bog')).toBeCloseTo(1 / 3, 5);
  });
});
