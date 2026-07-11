import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import plimit from 'p-limit';
import { safeMkdir, buildThumbnails } from './libs/helpers.js';

const execFileAsync = promisify(execFile);

const loadEnvFile = filename => {
  if (!fs.existsSync(filename)) {
    return;
  }

  fs
    .readFileSync(filename, 'utf8')
    .split(/\r?\n/)
    .forEach(line => {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) {
        return;
      }
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return;
      }
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (process.env[key] == null) {
        process.env[key] = value;
      }
    });
};

loadEnvFile('.env');

const facsimilesDir = process.env.KALLIOPE_FACSIMILE_DIR || 'facsimiles';
const extractConcurrency = Math.max(
  1,
  parseInt(process.env.KALLIOPE_FACSIMILE_EXTRACT_CONCURRENCY, 10) || 2
);
const commands = new Set(['extract', 'reextract', 'thumbnails', 'sync', 'all']);

const usage = () => {
  console.error(
    'Brug: npm run build-facsimiles -- <extract|reextract|thumbnails|sync|all>'
  );
};

const facsimileThumbnailOutputPath = (fullFilename, width, ext) => {
  return fullFilename
    .replace(/\.jpg$/, `-w${width}.${ext}`)
    .replace(/\/([^/]+)$/, '/t/$1');
};

const pageNumber = filename => {
  const match = filename.match(/(\d+)(?=\.jpg$)/);
  return match == null ? 0 : parseInt(match[1], 10);
};

// pdftoppm names files from its output prefix. Rename to Kalliopes stable
// page format: 000.jpg, 001.jpg, ...
const renameImages = imagesDir => {
  fs
    .readdirSync(imagesDir)
    .filter(f => f.endsWith('.jpg'))
    .sort((a, b) => pageNumber(a) - pageNumber(b))
    .forEach((srcFilename, i) => {
      const destFilename =
        i.toLocaleString('en-US', {
          minimumIntegerDigits: 3,
          useGrouping: false,
        }) + '.jpg';
      fs.renameSync(
        path.join(imagesDir, srcFilename),
        path.join(imagesDir, destFilename)
      );
    });
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
            imagesPrefix: path.join(poetDir, workId, workId),
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
    fs.rmSync(task.imagesDir, { recursive: true, force: true });
  }

  safeMkdir(task.imagesDir);
  console.log(`Extracting from ${task.fullFilename}`);
  try {
    await execFileAsync('pdftoppm', [
      '-jpeg',
      '-r',
      '300',
      task.fullFilename,
      task.imagesPrefix,
    ]);
    renameImages(task.imagesDir);
  } catch (err) {
    console.error(`Kunne ikke udtrække ${task.fullFilename}`);
    console.error("Installer poppler/pdftoppm, fx via facsimile-containeren.");
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

const isRemoteTargetWithoutUser = target => {
  return /^[^/@\s:]+:/.test(target);
};

const sync = async () => {
  const target = process.env.KALLIOPE_FACSIMILE_RSYNC_TARGET;
  if (!target) {
    throw new Error('KALLIOPE_FACSIMILE_RSYNC_TARGET mangler.');
  }
  if (isRemoteTargetWithoutUser(target)) {
    throw new Error(
      'KALLIOPE_FACSIMILE_RSYNC_TARGET skal angive remote-bruger, fx jec@10.0.0.5:/Volumes/Alma/Faksimiler.'
    );
  }
  if (!fs.existsSync(facsimilesDir)) {
    throw new Error(`${facsimilesDir} findes ikke.`);
  }

  console.log(`Synkroniserer ${facsimilesDir}/ til ${target}.`);
  await execFileAsync('rsync', ['-rva', `${facsimilesDir}/`, target]);
};

const run = async command => {
  console.log(`Kører build-facsimiles ${command}.`);
  if (command === 'extract') {
    await extract(false);
  } else if (command === 'reextract') {
    await extract(true);
  } else if (command === 'thumbnails') {
    await thumbnails();
  } else if (command === 'sync') {
    await sync();
  } else if (command === 'all') {
    await extract(false);
    await thumbnails();
    await sync();
  }
};

const command = process.argv[2] || 'all';

if (!commands.has(command)) {
  usage();
  process.exit(1);
}

run(command).catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
