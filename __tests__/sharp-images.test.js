const fs = require('fs');
const os = require('os');
const path = require('path');
const sharp = require('sharp');

const { buildThumbnails, resizeImage } = require('../tools/libs/helpers.js');
const { imageSizeSync } = require('../tools/build-static/image.js');
const ImagePaths = require('../common/imagepaths.js');

describe('sharp image helpers', () => {
  let tmpdir;
  let cwd;
  let logSpy;

  beforeEach(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-images-'));
    cwd = process.cwd();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(cwd);
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

  it('keeps existing thumbnails when the source mtime changes without content changes', async () => {
    process.chdir(tmpdir);
    fs.mkdirSync('public/images/poet', { recursive: true });
    await createJpeg('public/images/poet/p1.jpg', 320, 180);

    await buildThumbnails('public/images', () => true);

    const output = `public${ImagePaths.thumbnailSrc(
      '/images/poet/p1.jpg',
      100,
      'jpg'
    )}`;
    const outputMtime = fs.statSync(output).mtimeMs;
    const future = new Date(Date.now() + 60000);
    fs.utimesSync('public/images/poet/p1.jpg', future, future);

    await buildThumbnails('public/images', () => false);

    expect(fs.statSync(output).mtimeMs).toBe(outputMtime);
  });

  it('creates missing thumbnails even when the source content is unchanged', async () => {
    process.chdir(tmpdir);
    fs.mkdirSync('public/images/poet', { recursive: true });
    await createJpeg('public/images/poet/p1.jpg', 320, 180);

    await buildThumbnails('public/images', () => true);

    const missingOutput = `public${ImagePaths.thumbnailSrc(
      '/images/poet/p1.jpg',
      100,
      'jpg'
    )}`;
    const existingOutput = `public${ImagePaths.thumbnailSrc(
      '/images/poet/p1.jpg',
      150,
      'jpg'
    )}`;
    const existingOutputMtime = fs.statSync(existingOutput).mtimeMs;
    fs.unlinkSync(missingOutput);
    const future = new Date(Date.now() + 60000);
    fs.utimesSync('public/images/poet/p1.jpg', future, future);

    await buildThumbnails('public/images', () => false);

    expect(fs.existsSync(missingOutput)).toBe(true);
    expect(fs.statSync(existingOutput).mtimeMs).toBe(existingOutputMtime);
  });
});
