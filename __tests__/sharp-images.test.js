import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';
import { spawnSync } from 'child_process';
import { pathToFileURL } from 'url';

import { buildThumbnails, resizeImage } from '../tools/libs/helpers.js';
import { imageSizeSync } from '../tools/build-static/image.js';
import * as ImagePaths from '../common/imagepaths.js';

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

  it('does not enlarge square cover images that are already small enough', async () => {
    const input = path.join(tmpdir, 'small-square.jpg');
    const output = path.join(tmpdir, 'small-square-output.jpg');

    await createJpeg(input, 80, 50);
    await resizeImage(input, output, 100, { fit: 'cover' });

    const metadata = await sharp(output).metadata();
    expect(metadata.width).toBe(50);
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

  it('explains how to fix a missing image file', async () => {
    const input = path.join(tmpdir, 'missing.jpg');

    await expect(imageSizeSync(input)).rejects.toThrow(
      `Billedfilen findes ikke: ${input}\n` +
        'Tilføj filen, eller ret billedreferencen i XML-kilden.'
    );
  });

  it('starts writing thumbnails before reading the next source image', async () => {
    process.chdir(tmpdir);
    fs.mkdirSync('public/images/poet', { recursive: true });
    const first = 'public/images/poet/first.jpg';
    const second = 'public/images/poet/second.jpg';
    await createJpeg(first, 320, 180);
    await createJpeg(second, 320, 180);
    fs.utimesSync(second, new Date('2000-01-01'), new Date('2000-01-01'));
    const events = [];
    const read = fs.readFileSync;
    const rename = fs.renameSync;
    const readSpy = jest.spyOn(fs, 'readFileSync').mockImplementation((file, ...args) => {
      if (file === first || file === second) {
        events.push(file);
      }
      return read(file, ...args);
    });
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
      if (to.endsWith('.jpg')) {
        events.push('output');
      }
      return rename(from, to);
    });
    try {
      await buildThumbnails('public/images', () => true);
      expect(events.indexOf('output')).toBeLessThan(events.indexOf(second));
      expect(events.filter(event => event === first)).toHaveLength(1);
      expect(events.filter(event => event === second)).toHaveLength(1);
    } finally {
      readSpy.mockRestore();
      renameSpy.mockRestore();
    }
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

  it('reuses completed thumbnails after the generating process is killed', async () => {
    const helpersUrl = pathToFileURL(path.join(cwd, 'tools/libs/helpers.js')).href;
    process.chdir(tmpdir);
    fs.mkdirSync('public/images/poet', { recursive: true });
    await createJpeg('public/images/poet/p1.jpg', 320, 180);
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import fs from 'fs';
      import { buildThumbnails } from ${JSON.stringify(helpersUrl)};
      const rename = fs.renameSync;
      fs.renameSync = (from, to) => {
        rename(from, to);
        if (to.startsWith('caches/thumbnails/') && to.endsWith('.json')) {
          process.kill(process.pid, 'SIGKILL');
        }
      };
      await buildThumbnails('public/images', () => true);
    `], { cwd: tmpdir, env: { ...process.env, KALLIOPE_THUMBNAIL_CONCURRENCY: '1' } });
    expect(child.signal).toBe('SIGKILL');
    expect(fs.readdirSync('caches/thumbnails').filter(name => name.endsWith('.json'))).toHaveLength(1);
    const complete = `public${ImagePaths.thumbnailSrc('/images/poet/p1.jpg', 100, 'jpg')}`;
    const mtime = fs.statSync(complete).mtimeMs;
    await buildThumbnails('public/images', () => true);
    expect(fs.statSync(complete).mtimeMs).toBe(mtime);
    const last = `public${ImagePaths.thumbnailSrc('/images/poet/p1.jpg', 800, 'jpg')}`;
    expect(fs.existsSync(last)).toBe(true);
  });

  it('resumes with a stale global cache and repairs partial outputs', async () => {
    process.chdir(tmpdir);
    fs.mkdirSync('public/images/poet', { recursive: true });
    await createJpeg('public/images/poet/p1.jpg', 320, 180);
    await buildThumbnails('public/images', () => true);
    const output = width => `public${ImagePaths.thumbnailSrc('/images/poet/p1.jpg', width, 'jpg')}`;
    const completeTime = fs.statSync(output(100)).mtimeMs;
    fs.writeFileSync(output(150), 'partial JPEG');
    fs.unlinkSync(output(200));
    // The global cache was never saved before interruption: still reports dirty.
    await buildThumbnails('public/images', () => true);
    expect(fs.statSync(output(100)).mtimeMs).toBe(completeTime);
    expect((await sharp(output(150)).metadata()).width).toBe(150);
    expect((await sharp(output(200)).metadata()).width).toBe(200);
  });

  it('invalidates receipts for changed source content and generator settings', async () => {
    process.chdir(tmpdir);
    fs.mkdirSync('public/images/poet', { recursive: true });
    const source = 'public/images/poet/p1.jpg';
    await createJpeg(source, 320, 180);
    await buildThumbnails('public/images', () => false);
    const output = `public${ImagePaths.thumbnailSrc('/images/poet/p1.jpg', 100, 'jpg')}`;
    const original = fs.readFileSync(output);
    const sourceTime = fs.statSync(source).mtime;
    await createJpeg(source, 320, 320);
    fs.utimesSync(source, sourceTime, sourceTime);
    await buildThumbnails('public/images', () => false);
    expect(fs.readFileSync(output).equals(original)).toBe(false);
    expect((await sharp(output).metadata()).height).toBe(100);
    // Simulate receipts made by a different generator version/settings.
    for (const filename of fs.readdirSync('caches/thumbnails')) {
      const receiptPath = `caches/thumbnails/${filename}`;
      const receipt = JSON.parse(fs.readFileSync(receiptPath));
      receipt.key = 'previous-generator';
      fs.writeFileSync(receiptPath, JSON.stringify(receipt));
    }
    const oldTime = new Date('2000-01-01');
    fs.utimesSync(output, oldTime, oldTime);
    await buildThumbnails('public/images', () => false);
    expect(fs.statSync(output).mtimeMs).toBeGreaterThan(oldTime.getTime());
  });

  it('supports custom thumbnail output paths', async () => {
    process.chdir(tmpdir);
    fs.mkdirSync('facsimiles/poet/work', { recursive: true });
    await createJpeg('facsimiles/poet/work/000.jpg', 320, 180);

    await buildThumbnails('facsimiles', null, {
      thumbnailOutputPath: (fullFilename, width, ext) => {
        return fullFilename
          .replace(/\.jpg$/, `-w${width}.${ext}`)
          .replace(/\/([^/]+)$/, '/t/$1');
      },
    });

    expect(fs.existsSync('facsimiles/poet/work/t/000-w100.jpg')).toBe(true);
    expect(fs.existsSync('public/generated/facsimiles')).toBe(false);
  });

  it('processes recently modified source images first', async () => {
    process.chdir(tmpdir);
    fs.mkdirSync('public/images/poet', { recursive: true });
    await createJpeg('public/images/poet/older.jpg', 320, 180);
    await createJpeg('public/images/poet/newer.jpg', 320, 180);
    fs.utimesSync(
      'public/images/poet/older.jpg',
      new Date('2020-01-01'),
      new Date('2020-01-01')
    );
    fs.utimesSync(
      'public/images/poet/newer.jpg',
      new Date('2021-01-01'),
      new Date('2021-01-01')
    );

    const visited = [];
    await buildThumbnails('public/images', null, {
      thumbnailOutputPath: (fullFilename, width, ext) => {
        visited.push(path.basename(fullFilename));
        return `public/images/poet/t/${path.basename(fullFilename, '.jpg')}-w${width}.${ext}`;
      },
    });

    expect([...new Set(visited)]).toEqual(['newer.jpg', 'older.jpg']);
    expect(visited.slice(visited.indexOf('older.jpg'))).not.toContain('newer.jpg');
  });
});
