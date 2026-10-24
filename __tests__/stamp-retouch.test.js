import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import { composeStampRetouch } from '../.agents/skills/prepare-kalliope-titlepage/scripts/compose-stamp-retouch.js';

describe('local KB title-page stamp retouch', () => {
  let root;
  let options;
  const image = async (filename, data, width = 3, height = 2, channels = 3) =>
    sharp(Buffer.from(data), { raw: { width, height, channels } }).png().toFile(filename);

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-stamp-'));
    options = Object.fromEntries(['source', 'generated', 'mask', 'output', 'report']
      .map(name => [name, path.join(root, `${name}.${name === 'report' ? 'json' : 'png'}`)]));
    options.kbSourceUrl = 'https://www.kb.dk/e-mat/dod/example-color.pdf';
    await image(options.source, Array(18).fill(80));
    // Simulate a generator changing the whole page, not just the stamp.
    await image(options.generated, Array(18).fill(240));
    // Include a feathered pixel and a protected printed pixel inside the area.
    await image(options.mask, [0, 255, 128, 0, 0, 255], 3, 2, 1);
  });

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('copies original pixels outside the mask and blends only the selected pixels', async () => {
    const result = await composeStampRetouch(options);
    const pixels = await sharp(options.output).raw().toBuffer();
    expect([...pixels]).toEqual([80, 240, 160, 80, 80, 240].flatMap(value => [value, value, value]));
    expect(result.outsideMaskChangedPixels).toBe(0);
    expect(result.changedPixelCount).toBe(3);
    expect(result.changedBounds).toEqual({ left: 1, top: 0, width: 2, height: 2 });
    expect(JSON.parse(fs.readFileSync(options.report, 'utf8'))).toEqual(result);
    expect((await sharp(options.source).raw().toBuffer()).equals(Buffer.alloc(18, 80))).toBe(true);
  });

  it.each(['https://example.org/book.pdf', 'https://kb.dk.example.org/book.pdf', 'http://www.kb.dk/book.pdf'])
    ('rejects non-KB or insecure provenance: %s', async kbSourceUrl => {
      await expect(composeStampRetouch({ ...options, kbSourceUrl })).rejects.toThrow('HTTPS-kilde fra kb.dk');
      expect(fs.existsSync(options.output)).toBe(false);
    });

  it('does not resize a generated result', async () => {
    await image(options.generated, Array(12).fill(240), 2, 2);
    await expect(composeStampRetouch(options)).rejects.toThrow('samme dimensioner');
    expect(fs.existsSync(options.output)).toBe(false);
  });

  it.each([0, 255])('rejects an empty or whole-page mask (%s)', async value => {
    await image(options.mask, Array(6).fill(value), 3, 2, 1);
    await expect(composeStampRetouch(options)).rejects.toThrow('lokalt område');
  });

  it('requires lossless output', async () => {
    await expect(composeStampRetouch({ ...options, output: path.join(root, 'result.jpg') }))
      .rejects.toThrow('tabsfrit som PNG');
  });

  it('preserves existing files, including original inputs', async () => {
    await expect(composeStampRetouch({ ...options, output: options.source })).rejects.toThrow('nye, forskellige');
    await composeStampRetouch(options);
    const output = fs.readFileSync(options.output);
    await expect(composeStampRetouch(options)).rejects.toThrow('nye, forskellige');
    expect(fs.readFileSync(options.output)).toEqual(output);
  });
});
