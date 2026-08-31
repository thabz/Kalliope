import fs from 'fs';
import os from 'os';
import path from 'path';

import sharp from 'sharp';

import {
  analyzeTitlePage,
  parseCrop,
  qaTitlePage,
  refineDarkCropEdges,
  renderTitlePage,
  titlePageChecksPassed,
} from '../.codex/skills/prepare-kalliope-titlepage/scripts/titlepage.js';

describe('prepare Kalliope title page', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-titlepage-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  const createSource = async (filename, angle = 1) => {
    const page = Buffer.from(`<svg width="800" height="1100" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="1100" fill="#eee6d2"/>
      <g fill="#191919">
        <rect x="180" y="260" width="440" height="18"/>
        <rect x="245" y="350" width="310" height="13"/>
        <rect x="205" y="570" width="390" height="11"/>
        <rect x="275" y="760" width="250" height="12"/>
        <rect x="225" y="850" width="350" height="10"/>
      </g>
    </svg>`);
    await sharp(page)
      .rotate(angle, { background: '#161616' })
      .extend({
        top: 60,
        bottom: 60,
        left: 60,
        right: 60,
        background: '#161616',
      })
      .jpeg({ quality: 95 })
      .toFile(filename);
  };

  it('suggests the rotation and complete page crop', async () => {
    const source = path.join(root, 'source.jpg');
    const analysisDir = path.join(root, 'analysis');
    await createSource(source, 1);

    const result = await analyzeTitlePage(source, analysisDir);

    expect(result.report.recommendedAngle).toBeCloseTo(-1, 1);
    expect(result.report.recommendedCrop.left).toBeGreaterThan(0);
    expect(result.report.recommendedCrop.top).toBeGreaterThan(0);
    expect(result.report.cropRemovedFraction).toBeGreaterThan(0.1);
    expect(result.report.status).toBe('candidate');
    expect(fs.existsSync(result.previewPath)).toBe(true);
    expect(fs.existsSync(result.reportPath)).toBe(true);
  });

  it('renders geometry without scaling and records the transformation', async () => {
    const source = path.join(root, 'source.jpg');
    const candidate = path.join(root, 'candidate.jpg');
    await createSource(source, 1);
    const analysis = await analyzeTitlePage(source, path.join(root, 'analysis'));

    const result = await renderTitlePage(source, candidate, {
      angle: analysis.report.recommendedAngle,
      crop: analysis.report.recommendedCrop,
    });
    const metadata = await sharp(candidate).metadata();

    expect(metadata.format).toBe('jpeg');
    expect(metadata.width).toBe(analysis.report.recommendedCrop.width);
    expect(metadata.height).toBe(analysis.report.recommendedCrop.height);
    expect(result.transform.scaled).toBe(false);
    expect(result.transform.operations).toEqual(['autoOrient', 'rotate', 'crop']);
    expect(fs.existsSync(result.transformPath)).toBe(true);
  });

  it('requires visual inspection before promotion', async () => {
    const source = path.join(root, 'source.jpg');
    const candidate = path.join(root, 'candidate.jpg');
    const finalImage = path.join(root, 'public', 'work-p1.jpg');
    await createSource(source, 0);
    await renderTitlePage(source, candidate, {
      angle: 0,
      crop: { left: 45, top: 45, width: 830, height: 1130 },
    });

    const firstQa = await qaTitlePage(source, candidate, {
      comparison: path.join(root, 'compare-before.jpg'),
      report: path.join(root, 'qa-before.json'),
    });
    expect(firstQa.status).toBe('manual-review');
    expect(firstQa.checks.visualReview).toBe(false);
    expect(fs.existsSync(finalImage)).toBe(false);

    const acceptedQa = await qaTitlePage(source, candidate, {
      comparison: path.join(root, 'compare-after.jpg'),
      promote: finalImage,
      report: path.join(root, 'qa-after.json'),
      visualPass: true,
    });
    expect(acceptedQa.status).toBe('pass');
    expect(acceptedQa.promotedTo).toBe(path.resolve(finalImage));
    expect(fs.readFileSync(finalImage)).toEqual(fs.readFileSync(candidate));
  });

  it('rejects an implausibly aggressive crop', async () => {
    const source = path.join(root, 'source.jpg');
    const candidate = path.join(root, 'candidate.jpg');
    await createSource(source, 0);
    await renderTitlePage(source, candidate, {
      angle: 0,
      crop: { left: 100, top: 100, width: 200, height: 200 },
    });

    const qa = await qaTitlePage(source, candidate, {
      comparison: path.join(root, 'compare.jpg'),
      report: path.join(root, 'qa.json'),
      visualPass: true,
    });

    expect(qa.status).toBe('manual-review');
    expect(qa.checks.conservativeCrop).toBe(false);
    expect(qa.checks.edgeCropFractions.left).toBeGreaterThan(0.05);
  });

  it('rejects a candidate changed after deterministic rendering', async () => {
    const source = path.join(root, 'source.jpg');
    const candidate = path.join(root, 'candidate.jpg');
    await createSource(source, 0);
    await renderTitlePage(source, candidate, {
      angle: 0,
      crop: { left: 45, top: 45, width: 830, height: 1130 },
    });
    const changed = await sharp(candidate).modulate({ brightness: 1.02 }).toBuffer();
    fs.writeFileSync(candidate, changed);

    const qa = await qaTitlePage(source, candidate, {
      comparison: path.join(root, 'compare.jpg'),
      report: path.join(root, 'qa.json'),
      visualPass: true,
    });

    expect(qa.status).toBe('manual-review');
    expect(qa.checks.deterministicTransform).toBe(false);
  });

  it('validates explicit crop coordinates', () => {
    expect(parseCrop('10,20,300,400')).toEqual({
      left: 10,
      top: 20,
      width: 300,
      height: 400,
    });
    expect(() => parseCrop('10,20,0,400')).toThrow(
      'Crop-værdier skal have positiv bredde og højde.'
    );
  });

  it('accepts a crop within five percent of every edge', () => {
    expect(titlePageChecksPassed({
      conservativeCrop: true,
      jpegOutput: true,
      deterministicTransform: true,
      noUpscaling: true,
      visualReview: true,
    })).toBe(true);
  });

  it('measures and removes continuous dark edge bands', () => {
    const width = 100;
    const height = 100;
    const data = Buffer.alloc(width * height * 3, 220);
    const darken = (x, y) => {
      const pixel = (y * width + x) * 3;
      data[pixel] = 20;
      data[pixel + 1] = 20;
      data[pixel + 2] = 20;
    };
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < 3; x += 1) darken(x, y);
      for (let x = width - 4; x < width; x += 1) darken(x, y);
    }
    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < 2; y += 1) darken(x, y);
      for (let y = height - 5; y < height; y += 1) darken(x, y);
    }

    const result = refineDarkCropEdges(
      { channels: 3, data, height, width },
      { left: 0, top: 0, width, height },
      { r: 220, g: 220, b: 220 }
    );

    expect(result.crop).toEqual({ left: 3, top: 2, width: 93, height: 93 });
    expect(result.trim).toEqual({ left: 3, right: 4, top: 2, bottom: 5 });
  });

  it('does not treat a localized dark clip as an edge band', () => {
    const width = 100;
    const height = 100;
    const data = Buffer.alloc(width * height * 3, 220);
    for (let x = 45; x < 55; x += 1) {
      const pixel = x * 3;
      data[pixel] = 20;
      data[pixel + 1] = 20;
      data[pixel + 2] = 20;
    }

    const result = refineDarkCropEdges(
      { channels: 3, data, height, width },
      { left: 0, top: 0, width, height },
      { r: 220, g: 220, b: 220 }
    );

    expect(result.trim.top).toBe(0);
  });
});
