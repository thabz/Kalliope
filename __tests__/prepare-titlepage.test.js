import fs from 'fs';
import os from 'os';
import path from 'path';

import sharp from 'sharp';

import {
  analyzeTitlePage,
  evaluateOcrRetention,
  parseCrop,
  qaTitlePage,
  renderTitlePage,
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

    expect(result.report.recommendedAngle).toBeCloseTo(1, 1);
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
      crop: { left: 60, top: 60, width: 800, height: 1100 },
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
    expect(qa.checks.reasonablePageRetention).toBe(false);
  });

  it('rejects a candidate changed after deterministic rendering', async () => {
    const source = path.join(root, 'source.jpg');
    const candidate = path.join(root, 'candidate.jpg');
    await createSource(source, 0);
    await renderTitlePage(source, candidate, {
      angle: 0,
      crop: { left: 60, top: 60, width: 800, height: 1100 },
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

  it('accepts retained title text when removed scanner noise inflated source OCR', () => {
    const sourceTokens = [
      'erotiske', 'digte', 'rosenberg', 'københavn', 'boghandel',
      'bogtrykkeri', '1896', 'scanner', 'kant', 'støj', 'plet', 'ramme',
    ];
    const candidateTokens = [
      'erotiske', 'digte', 'rosenberg', 'københavn', 'boghandel',
      'bogtrykkeri', '1896',
    ];

    const result = evaluateOcrRetention(sourceTokens, candidateTokens);

    expect(result.recall).toBeLessThan(0.75);
    expect(result.agreement).toBe(1);
    expect(result.cleanupAgreement).toBe(true);
    expect(result.passed).toBe(true);
  });

  it('rejects a small matching OCR fragment after an aggressive crop', () => {
    const sourceTokens = [
      'erotiske', 'digte', 'rosenberg', 'københavn', 'boghandel',
      'bogtrykkeri', '1896', 'forlag', 'titelblad', 'ornament',
    ];

    const result = evaluateOcrRetention(sourceTokens, ['erotiske', 'digte']);

    expect(result.agreement).toBe(1);
    expect(result.tokenRatio).toBe(0.2);
    expect(result.cleanupAgreement).toBe(false);
    expect(result.passed).toBe(false);
  });
});
