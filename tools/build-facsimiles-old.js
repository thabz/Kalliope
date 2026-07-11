import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import plimit from 'p-limit';
import { safeMkdir, buildThumbnails } from './libs/helpers.js';

const execAsync = promisify(exec);
const dirname = 'public/facsimiles';
const limit = plimit(2);

// Place pdf-files in public/facsimiles/<poetname>/<workid>.pdf
// For each pdf file this script creates a folder public/facsimiles/<poetname>/<workid>
// containing jpg-files for each page in the pdf-file, named <workid>-<pagenumber>.jpg
// where <pagenumber> is 000, 001, 002, etc.


// I can't control the output format of 'pdftoppm', so I'll just rename
// all files into the wanted filename-format: 000.jpg, 001.jpg, ...
const pageNumber = filename => {
  const match = filename.match(/(\d+)(?=\.jpg$)/);
  return match == null ? 0 : parseInt(match[1], 10);
};

const renameImages = imagesDir => {
  fs
    .readdirSync(imagesDir)
    .filter(f => f.endsWith('.jpg'))
    .sort((a, b) => pageNumber(a) - pageNumber(b))
    .forEach((srcFilename, i) => {
      const destFilename = i.toLocaleString('en-US',{minimumIntegerDigits:3, useGrouping:false}) + '.jpg';
      fs.renameSync(path.join(imagesDir,srcFilename), path.join(imagesDir,destFilename));
    });
};

const extractPdfImages = async task => {
  console.log(`Extracting from ${task.fullFilename}`);
  await execAsync(`pdfimages -j ${task.fullFilename} ${task.imagesPrefix}`);
  renameImages(task.imagesDir);
};

const tasks = [];
const poetDirs = fs
  .readdirSync(dirname)
  .map(f => path.join(dirname, f))
  .filter(f => {
    return fs.statSync(f).isDirectory();
  });
poetDirs.forEach(poetDir => {
  fs
    .readdirSync(poetDir)
    .filter(f => f.endsWith('pdf'))
    .forEach(pdfFilename => {
      const fullFilename = path.join(poetDir, pdfFilename);
      const parts = fullFilename.split('/');
      const workId = parts[parts.length - 1].replace('.pdf', '');
      const imagesDir = path.join(poetDir, workId);
      // Skip if imagesDir exists
      if (!fs.existsSync(imagesDir)) {
        safeMkdir(imagesDir);
        const imagesPrefix = path.join(imagesDir, workId);
        // Extract pages
        tasks.push({ fullFilename, imagesPrefix, imagesDir });
      }
    });
});

Promise.all(tasks.map(task => limit(() => extractPdfImages(task)))).then(
  async () => {
    await buildThumbnails('public/facsimiles');
    exec(
      'rsync -rva public/facsimiles/* 10.0.0.5:Sites/kalliope/public/facsimiles'
    );
  }
).catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
