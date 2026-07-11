import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import plimit from 'p-limit';
import { buildThumbnails } from './libs/helpers.js';

const execFileAsync = promisify(execFile);

const facsimilesDir = process.env.KALLIOPE_FACSIMILE_DIR || 'facsimiles';
const extractor = process.env.KALLIOPE_FACSIMILE_EXTRACTOR || 'auto';
const renderDpi =
  parseInt(process.env.KALLIOPE_FACSIMILE_RENDER_DPI, 10) || 300;
const safeImageMinDimension =
  parseInt(process.env.KALLIOPE_FACSIMILE_MIN_IMAGE_DIMENSION, 10) || 1000;
const extractConcurrency = Math.max(
  1,
  parseInt(process.env.KALLIOPE_FACSIMILE_EXTRACT_CONCURRENCY, 10) || 2
);
const commands = new Set(['extract', 'reextract', 'thumbnails', 'all']);
const extractors = new Set(['auto', 'pdftoppm', 'pdfimages']);

const usage = () => {
  console.error(
    'Brug: npm run build-facsimiles -- <extract|reextract|thumbnails|all>'
  );
};

const facsimileThumbnailOutputPath = (fullFilename, width, ext) => {
  return fullFilename
    .replace(/\.jpg$/, `-w${width}.${ext}`)
    .replace(/\/([^/]+)$/, '/t/$1');
};

const pageFilename = pageIndex => {
  return (
    pageIndex.toLocaleString('en-US', {
      minimumIntegerDigits: 3,
      useGrouping: false,
    }) + '.jpg'
  );
};

const stablePagePath = (imagesDir, page) => {
  return path.join(imagesDir, pageFilename(page - 1));
};

const parsePdfInfoPageCount = stdout => {
  const match = stdout.match(/^Pages:\s+(\d+)\s*$/m);
  if (match == null) {
    throw new Error('Kunne ikke læse sidetal fra pdfinfo.');
  }
  return parseInt(match[1], 10);
};

const parsePdfImagesList = stdout => {
  return stdout
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line !== '' && /^\d+\s+/.test(line))
    .map(line => {
      const parts = line.split(/\s+/);
      return {
        page: parseInt(parts[0], 10),
        type: parts[2],
        width: parseInt(parts[3], 10),
        height: parseInt(parts[4], 10),
        encoding: parts[8],
      };
    })
    .filter(image => {
      return (
        Number.isInteger(image.page) &&
        Number.isInteger(image.width) &&
        Number.isInteger(image.height)
      );
    });
};

const safePdfImagePages = (images, pageCount, minDimension) => {
  const pages = new Set();
  for (let page = 1; page <= pageCount; page++) {
    const largeJpegs = images.filter(image => {
      return (
        image.page === page &&
        image.type === 'image' &&
        image.encoding === 'jpeg' &&
        image.width >= minDimension &&
        image.height >= minDimension
      );
    });
    if (largeJpegs.length === 1) {
      pages.add(page);
    }
  }
  return pages;
};

const pdfImagesPageNumber = filename => {
  const match = path.basename(filename).match(/-(\d+)-\d+\.jpg$/);
  return match == null ? null : parseInt(match[1], 10);
};

const validateExtractedPages = (imagesDir, pageCount) => {
  const jpgs = fs
    .readdirSync(imagesDir)
    .filter(filename => filename.toLowerCase().endsWith('.jpg'))
    .sort();

  if (jpgs.length !== pageCount) {
    throw new Error(
      `${imagesDir} har ${jpgs.length} jpg-filer, men PDF'en har ${pageCount} sider.`
    );
  }

  for (let page = 1; page <= pageCount; page++) {
    const filename = pageFilename(page - 1);
    if (!fs.existsSync(path.join(imagesDir, filename))) {
      throw new Error(`${imagesDir} mangler ${filename}.`);
    }
  }
};

const getPageCount = async (fullFilename, command = execFileAsync) => {
  const { stdout } = await command('pdfinfo', [fullFilename]);
  return parsePdfInfoPageCount(stdout);
};

const renderPageWithPdftoppm = async (
  fullFilename,
  imagesDir,
  page,
  command = execFileAsync
) => {
  const outputPrefix = path.join(imagesDir, `pdftoppm-page-${page}`);
  try {
    await command('pdftoppm', [
      '-jpeg',
      '-f',
      String(page),
      '-l',
      String(page),
      '-singlefile',
      '-r',
      String(renderDpi),
      fullFilename,
      outputPrefix,
    ]);
  } catch (err) {
    throw new Error(
      `Kunne ikke rendere ${fullFilename} side ${page} med pdftoppm: ${
        err.message || err
      }`
    );
  }

  const outputFilename = `${outputPrefix}.jpg`;
  if (!fs.existsSync(outputFilename)) {
    throw new Error(
      `pdftoppm oprettede ikke ${outputFilename} for ${fullFilename} side ${page}.`
    );
  }
  fs.renameSync(outputFilename, stablePagePath(imagesDir, page));
};

const extractWithPdftoppm = async (task, imagesDir, command = execFileAsync) => {
  const pageCount = await getPageCount(task.fullFilename, command);
  for (let page = 1; page <= pageCount; page++) {
    await renderPageWithPdftoppm(task.fullFilename, imagesDir, page, command);
  }
  validateExtractedPages(imagesDir, pageCount);
};

const extractPdfImages = async (
  task,
  tempDir,
  safePages,
  command = execFileAsync
) => {
  const prefix = path.join(tempDir, 'pdfimages');
  await command('pdfimages', [
    '-j',
    '-p',
    task.fullFilename,
    prefix,
  ]);

  const extracted = new Map();
  fs
    .readdirSync(tempDir)
    .map(filename => path.join(tempDir, filename))
    .filter(line => line.toLowerCase().endsWith('.jpg'))
    .forEach(filename => {
      const page = pdfImagesPageNumber(filename);
      if (page == null || !safePages.has(page)) {
        return;
      }
      if (!extracted.has(page)) {
        extracted.set(page, []);
      }
      extracted.get(page).push(filename);
    });

  return extracted;
};

const extractWithAuto = async (
  task,
  imagesDir,
  { pdfimagesOnly = false, command = execFileAsync } = {}
) => {
  const pageCount = await getPageCount(task.fullFilename, command);
  let safePages = new Set();
  try {
    const { stdout } = await command('pdfimages', [
      '-list',
      task.fullFilename,
    ]);
    safePages = safePdfImagePages(
      parsePdfImagesList(stdout),
      pageCount,
      safeImageMinDimension
    );
  } catch (err) {
    if (pdfimagesOnly) {
      throw err;
    }
    console.warn(
      `pdfimages -list fejlede for ${task.fullFilename}, bruger pdftoppm for alle sider.`
    );
  }
  const pdfImagesTempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'kalliope-pdfimages-')
  );

  try {
    let extractedPages = new Map();
    if (safePages.size > 0) {
      try {
        extractedPages = await extractPdfImages(
          task,
          pdfImagesTempDir,
          safePages,
          command
        );
      } catch (err) {
        if (pdfimagesOnly) {
          throw err;
        }
        console.warn(
          `pdfimages fejlede for ${task.fullFilename}, bruger pdftoppm for alle sider.`
        );
      }
    }

    for (let page = 1; page <= pageCount; page++) {
      const candidates = extractedPages.get(page) || [];
      if (safePages.has(page) && candidates.length === 1) {
        fs.copyFileSync(candidates[0], stablePagePath(imagesDir, page));
      } else if (pdfimagesOnly) {
        throw new Error(
          `pdfimages kunne ikke levere én sikker JPEG for ${task.fullFilename} side ${page}.`
        );
      } else {
        await renderPageWithPdftoppm(
          task.fullFilename,
          imagesDir,
          page,
          command
        );
      }
    }
  } finally {
    fs.rmSync(pdfImagesTempDir, { recursive: true, force: true });
  }

  validateExtractedPages(imagesDir, pageCount);
};

const moveCompletedImagesDir = (tempImagesDir, imagesDir) => {
  fs.rmSync(imagesDir, { recursive: true, force: true });
  fs.renameSync(tempImagesDir, imagesDir);
};

const findPdfTasks = () => {
  if (!fs.existsSync(facsimilesDir)) {
    console.log(`${facsimilesDir} findes ikke, så der er ingen PDF'er.`);
    return [];
  }

  return fs
    .readdirSync(facsimilesDir)
    .map(f => path.join(facsimilesDir, f))
    .filter(f => fs.statSync(f).isDirectory())
    .flatMap(poetDir => {
      return fs
        .readdirSync(poetDir)
        .filter(f => f.toLowerCase().endsWith('.pdf'))
        .map(pdfFilename => {
          const fullFilename = path.join(poetDir, pdfFilename);
          const workId = path.basename(pdfFilename).replace(/\.pdf$/i, '');
          return {
            fullFilename,
            imagesDir: path.join(poetDir, workId),
          };
        });
    });
};

const extractPdf = async (task, force) => {
  if (fs.existsSync(task.imagesDir)) {
    if (!force) {
      console.log(`${task.imagesDir} findes allerede, springer over.`);
      return;
    }
  }

  const tempImagesDir = fs.mkdtempSync(
    path.join(path.dirname(task.imagesDir), `.${path.basename(task.imagesDir)}-`)
  );
  console.log(`Extracting from ${task.fullFilename}`);
  try {
    if (extractor === 'pdftoppm') {
      await extractWithPdftoppm(task, tempImagesDir);
    } else if (extractor === 'pdfimages') {
      await extractWithAuto(task, tempImagesDir, { pdfimagesOnly: true });
    } else {
      await extractWithAuto(task, tempImagesDir);
    }
    moveCompletedImagesDir(tempImagesDir, task.imagesDir);
  } catch (err) {
    fs.rmSync(tempImagesDir, { recursive: true, force: true });
    console.error(`Kunne ikke udtrække ${task.fullFilename}`);
    console.error(
      'Installer poppler-utils med pdfinfo, pdfimages og pdftoppm, fx via facsimile-containeren.'
    );
    throw err;
  }
};

const extract = async force => {
  const limit = plimit(extractConcurrency);
  const tasks = findPdfTasks();
  console.log(
    `${force ? 'Genudtrækker' : 'Udtrækker'} facsimile-sider fra ${
      tasks.length
    } PDF'er.`
  );
  await Promise.all(tasks.map(task => limit(() => extractPdf(task, force))));
};

const thumbnails = async () => {
  console.log(`Genererer thumbnails i ${facsimilesDir}.`);
  await buildThumbnails(facsimilesDir, null, {
    thumbnailOutputPath: facsimileThumbnailOutputPath,
  });
};

const printSyncCommand = () => {
  console.log('');
  console.log('Facsimilerne er genereret lokalt.');
  console.log(
    'Kør derefter ./tools/sync-facsimiler.sh for at synkronisere faksimiler til webserveren.'
  );
};

const run = async command => {
  console.log(`Kører build-facsimiles ${command}.`);
  if (command === 'extract') {
    await extract(false);
  } else if (command === 'reextract') {
    await extract(true);
  } else if (command === 'thumbnails') {
    await thumbnails();
  } else if (command === 'all') {
    await extract(false);
    await thumbnails();
    printSyncCommand();
  }
};

const command = process.argv[2] || 'all';

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!commands.has(command)) {
    usage();
    process.exit(1);
  }

  if (!extractors.has(extractor)) {
    console.error(
      `Ukendt KALLIOPE_FACSIMILE_EXTRACTOR=${extractor}. Brug auto, pdftoppm eller pdfimages.`
    );
    process.exit(1);
  }

  run(command).catch(err => {
    console.error(err.message || err);
    process.exit(1);
  });
}

export {
  parsePdfInfoPageCount,
  parsePdfImagesList,
  safePdfImagePages,
  extractWithAuto,
  validateExtractedPages,
};
