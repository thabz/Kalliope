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
    // Change the actual generator identity, including when the manifest matches.
    const read = fs.readFileSync;
    const generatorSpy = jest.spyOn(fs, 'readFileSync').mockImplementation((file, ...args) =>
      String(file).endsWith('/resize-image.js')
        ? Buffer.concat([read(file, ...args), Buffer.from('\n// changed generator')])
        : read(file, ...args));
    const oldTime = new Date('2000-01-01');
    fs.utimesSync(output, oldTime, oldTime);
    try {
      const result = await buildThumbnails('public/images', () => false);
      expect(result.generatedOutputs).toBe(9);
      expect(fs.statSync(output).mtimeMs).toBeGreaterThan(oldTime.getTime());
    } finally {
      generatorSpy.mockRestore();
    }
  });

  const setupCachedImage = async () => {
    process.chdir(tmpdir);
    fs.mkdirSync('public/images/poet', { recursive: true });
    await createJpeg('public/images/poet/p1.jpg', 320, 180);
    await buildThumbnails('public/images', null);
    return `public${ImagePaths.thumbnailSrc('/images/poet/p1.jpg', 100, 'jpg')}`;
  };

  it('persists cache hits without reading any image or individual receipt', async () => {
    await setupCachedImage();
    const read = fs.readFileSync;
    const readSpy = jest.spyOn(fs, 'readFileSync').mockImplementation((file, ...args) => {
      if (String(file).endsWith('.jpg') === true || String(file).startsWith('caches/thumbnails/') === true) {
        throw new Error(`Unexpected image/receipt read: ${file}`);
      }
      return read(file, ...args);
    });
    const writeSpy = jest.spyOn(fs, 'writeFileSync');
    try {
      const result = await buildThumbnails('public/images', null);
      expect(result).toMatchObject({
        mode: 'metadata', sourceFiles: 1, checkedOutputs: 9, cacheHits: 9,
        generatedOutputs: 0, hashReads: 0, hashBytes: 0, receiptReads: 0, manifestReads: 1,
      });
      expect(result.manifestBytes).toBeGreaterThan(0);
      expect(writeSpy).not.toHaveBeenCalled();
      expect(logSpy.mock.calls.some(([line]) => line.startsWith('Kontrollerede thumbnails'))).toBe(true);
    } finally {
      readSpy.mockRestore();
      writeSpy.mockRestore();
    }
  });

  it.each(['missing', 'old', 'broken', 'invalid entries'])(
    'verifies legacy receipts and migrates a %s manifest without re-encoding', async state => {
      const output = await setupCachedImage();
      const originalTime = fs.statSync(output).mtimeMs;
      const manifest = `caches/thumbnail-state/${fs.readdirSync('caches/thumbnail-state')[0]}`;
      if (state === 'missing') fs.unlinkSync(manifest);
      if (state === 'old') fs.writeFileSync(manifest, JSON.stringify({ version: 0, files: {} }));
      if (state === 'broken') fs.writeFileSync(manifest, '{partial JSON');
      if (state === 'invalid entries') {
        const value = JSON.parse(fs.readFileSync(manifest));
        for (const key of Object.keys(value.files)) value.files[key] = { hash: 'invalid' };
        fs.writeFileSync(manifest, JSON.stringify(value));
      }
      const result = await buildThumbnails('public/images', null);
      expect(result).toMatchObject({ cacheHits: 9, generatedOutputs: 0,
        sourceHashReads: 1, outputHashReads: 9, receiptReads: 9 });
      expect(fs.statSync(output).mtimeMs).toBe(originalTime);
      expect((await buildThumbnails('public/images', null)).hashReads).toBe(0);
    }
  );

  it('repairs an unreadable receipt when the manifest is unavailable', async () => {
    await setupCachedImage();
    fs.rmSync('caches/thumbnail-state', { recursive: true });
    const receipt = `caches/thumbnails/${fs.readdirSync('caches/thumbnails')[0]}`;
    fs.writeFileSync(receipt, '{interrupted');
    const result = await buildThumbnails('public/images', null);
    expect(result).toMatchObject({ cacheHits: 8, generatedOutputs: 1 });
    expect((await buildThumbnails('public/images', null)).cacheHits).toBe(9);
  });

  it('detects a same-size source edit with the original mtime restored', async () => {
    await setupCachedImage();
    const source = 'public/images/poet/p1.jpg';
    const fixedTime = new Date('2020-01-01');
    fs.utimesSync(source, fixedTime, fixedTime);
    await buildThumbnails('public/images', null);
    const before = fs.statSync(source, { bigint: true });
    const jpeg = fs.readFileSync(source);
    // Change a JPEG quantization-table entry without changing length or validity.
    expect(jpeg.readUInt16BE(2)).toBe(0xffdb);
    jpeg[7] += 1;
    fs.writeFileSync(source, jpeg);
    fs.utimesSync(source, Number(before.atimeNs) / 1e9, Number(before.mtimeNs) / 1e9);
    const result = await buildThumbnails('public/images', null);
    expect(result).toMatchObject({ sourceHashReads: 1, generatedOutputs: 9, cacheHits: 0 });
    expect(fs.statSync(source).size).toBe(Number(before.size));
    expect(fs.statSync(source, { bigint: true }).mtimeNs).toBe(before.mtimeNs);
  });

  it('rehashes changed output metadata and repairs same-size damage with a restored mtime', async () => {
    const output = await setupCachedImage();
    const original = fs.readFileSync(output);
    const fixedTime = new Date('2020-01-01');
    fs.utimesSync(output, fixedTime, fixedTime);
    await buildThumbnails('public/images', null);
    const before = fs.statSync(output);
    const damaged = Buffer.from(original);
    damaged[damaged.length - 1] ^= 1;
    fs.writeFileSync(output, damaged);
    fs.utimesSync(output, before.atime, before.mtime);
    const result = await buildThumbnails('public/images', null);
    expect(result).toMatchObject({ cacheHits: 8, generatedOutputs: 1, repairedOutputs: 1, sourceHashReads: 0 });
    expect(fs.readFileSync(output)).toEqual(original);
  });

  it('fully verifies and repairs even damage hidden from metadata checks', async () => {
    const output = await setupCachedImage();
    const original = fs.readFileSync(output);
    fs.writeFileSync(output, Buffer.alloc(original.length));
    // Simulate storage corruption with unchanged metadata by updating the fixture's
    // stored fingerprint, while retaining the previously verified content hash.
    const manifest = `caches/thumbnail-state/${fs.readdirSync('caches/thumbnail-state')[0]}`;
    const value = JSON.parse(fs.readFileSync(manifest));
    const current = fs.statSync(output, { bigint: true });
    value.files[path.resolve(output)].fingerprint =
      [current.dev, current.ino, current.size, current.mtimeNs, current.ctimeNs].join(':');
    fs.writeFileSync(manifest, JSON.stringify(value));
    const quick = await buildThumbnails('public/images', null);
    expect(quick).toMatchObject({ cacheHits: 9, hashReads: 0 });
    const full = await buildThumbnails('public/images', null, { verify: true });
    expect(full).toMatchObject({ mode: 'verify', sourceHashReads: 1, cacheHits: 8,
      outputHashReads: 10, generatedOutputs: 1, repairedOutputs: 1 });
    expect(fs.readFileSync(output)).toEqual(original);
  });

  it('does not reuse a fingerprint with uncertain file identity', async () => {
    await setupCachedImage();
    const stat = fs.statSync;
    const statSpy = jest.spyOn(fs, 'statSync').mockImplementation((file, ...args) => {
      const result = stat(file, ...args);
      if (args[0]?.bigint === true) result.ino = 0n;
      return result;
    });
    try {
      expect(await buildThumbnails('public/images', null)).toMatchObject({
        cacheHits: 9, sourceHashReads: 1, outputHashReads: 9, generatedOutputs: 0,
      });
    } finally {
      statSpy.mockRestore();
    }
  });

  it('keeps a bounded number of jobs and drains workers after an encoding failure', async () => {
    await setupCachedImage();
    const output = `public${ImagePaths.thumbnailSrc('/images/poet/p1.jpg', 150, 'jpg')}`;
    fs.unlinkSync(output);
    const rename = fs.renameSync;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
      if (to === output) throw new Error('Simulated interrupted publication');
      return rename(from, to);
    });
    try {
      await expect(buildThumbnails('public/images', null)).rejects.toThrow('Simulated interrupted publication');
    } finally {
      renameSpy.mockRestore();
    }
    const result = await buildThumbnails('public/images', null);
    expect(result).toMatchObject({ cacheHits: 8, generatedOutputs: 1, repairedOutputs: 1 });
    expect(result.maxInFlight).toBeLessThanOrEqual(
      Number.parseInt(process.env.KALLIOPE_THUMBNAIL_CONCURRENCY ?? '1', 10));
    expect(fs.readdirSync(path.dirname(output)).every(name => name.includes('.tmp-') === false)).toBe(true);
  });

  it('reuses newer receipts after interruption with an older manifest still present', async () => {
    const helpersUrl = pathToFileURL(path.join(cwd, 'tools/libs/helpers.js')).href;
    await setupCachedImage();
    await createJpeg('public/images/poet/p1.jpg', 320, 320);
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
      await buildThumbnails('public/images', null);
    `], { cwd: tmpdir, env: { ...process.env, KALLIOPE_THUMBNAIL_CONCURRENCY: '1' } });
    expect(child.signal).toBe('SIGKILL');
    const complete = `public${ImagePaths.thumbnailSrc('/images/poet/p1.jpg', 100, 'jpg')}`;
    const mtime = fs.statSync(complete).mtimeMs;
    const result = await buildThumbnails('public/images', null);
    expect(result).toMatchObject({ cacheHits: 1, generatedOutputs: 8 });
    expect(fs.statSync(complete).mtimeMs).toBe(mtime);
    expect((await sharp(complete).metadata()).height).toBe(100);
  });

  it('produces jobs lazily instead of preparing the entire output queue', async () => {
    process.chdir(tmpdir);
    fs.mkdirSync('public/images/poet', { recursive: true });
    for (let index = 0; index < 20; index += 1) {
      await createJpeg(`public/images/poet/p${index}.jpg`, 80, 50);
    }
    let visited = 0;
    let visitedAtFirstOutput = null;
    const rename = fs.renameSync;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
      if (to.endsWith('.jpg') === true) visitedAtFirstOutput ??= visited;
      return rename(from, to);
    });
    try {
      const result = await buildThumbnails('public/images', null, {
        thumbnailOutputPath: (filename, width, ext) => {
          visited += 1;
          return `public${ImagePaths.thumbnailSrc(filename.replace(/^public/, ''), width, ext)}`;
        },
      });
      const concurrency = Number.parseInt(process.env.KALLIOPE_THUMBNAIL_CONCURRENCY ?? '1', 10);
      expect(result.generatedOutputs).toBe(180);
      expect(result.maxInFlight).toBeLessThanOrEqual(concurrency);
      expect(visitedAtFirstOutput).toBeLessThanOrEqual(concurrency);
    } finally {
      renameSpy.mockRestore();
    }
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
