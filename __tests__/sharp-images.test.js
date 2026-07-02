const fs = require('fs');
const os = require('os');
const path = require('path');
const sharp = require('sharp');

const { resizeImage } = require('../tools/libs/helpers.js');
const { imageSizeSync } = require('../tools/build-static/image.js');

describe('sharp image helpers', () => {
  let tmpdir;
  let logSpy;

  beforeEach(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-images-'));
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    fs.rmSync(tmpdir, { recursive: true, force: true });
  });

  const createJpeg = async (filename, width, height) => {
    await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 190, g: 90, b: 40 },
      },
    })
      .jpeg()
      .toFile(filename);
  };

  it('resizes thumbnails to the requested max width', async () => {
    const input = path.join(tmpdir, 'input.jpg');
    const output = path.join(tmpdir, 'output.jpg');

    await createJpeg(input, 320, 180);
    await resizeImage(input, output, 100);

    const metadata = await sharp(output).metadata();
    expect(metadata.width).toBe(100);
    expect(metadata.height).toBe(56);
  });

  it('does not enlarge thumbnails that are already small enough', async () => {
    const input = path.join(tmpdir, 'small.jpg');
    const output = path.join(tmpdir, 'small-output.jpg');

    await createJpeg(input, 80, 50);
    await resizeImage(input, output, 100);

    const metadata = await sharp(output).metadata();
    expect(metadata.width).toBe(80);
    expect(metadata.height).toBe(50);
  });

  it('reads image dimensions through the build-static wrapper', async () => {
    const input = path.join(tmpdir, 'metadata.jpg');

    await createJpeg(input, 123, 45);

    await expect(imageSizeSync(input)).resolves.toEqual({
      width: 123,
      height: 45,
    });
  });
});
