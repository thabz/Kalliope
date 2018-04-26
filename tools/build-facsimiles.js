const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const async = require('async');
const { safeMkdir, buildThumbnails } = require('./libs/helpers.js');

const dirname = 'static/facsimiles';

// Place pdf-files in static/facsimiles/<poetname>/<workid>.pdf
// For each pdf file this script creates a folder static/facsimiles/<poetname>/<workid>
// containing jpg-files for each page in the pdf-file, named <workid>-<pagenumber>.jpg
// where <pagenumber> is 000, 001, 002, etc.

// Queue for converting image with concurrency 2.
let convertImageQueue = async.queue((task, callback) => {
  const destPath = task.srcPath
    .replace(/.pbm/, '.jpg')
    .replace(/.ppm/, '.jpg')
    .replace(/.*?-(\d*)\.jpg/, task.imagesDir + '/$1.jpg');
  console.log(destPath);
  exec(`convert "${task.srcPath}" "${destPath}"`, () => {
    fs.unlinkSync(task.srcPath);
    callback();
  });
}, 2);

// Convert all ppm- and pbm-files in a folder to jpg
const folderToJpeg = imagesDir => {
  console.log(`Converting ${imagesDir} to jpeg`);
  fs
    .readdirSync(imagesDir)
    .filter(f => f.endsWith('.pbm') || f.endsWith('.ppm'))
    .forEach(srcFilename => {
      const srcPath = path.join(imagesDir, srcFilename);
      convertImageQueue.push({ srcPath, imagesDir });
    });
};

let extractPdfImagesQueue = async.queue((task, callback) => {
  console.log(`Extracting from ${task.fullFilename}`);
  exec(`pdfimages -jp2 ${task.fullFilename} ${task.imagesPrefix}`, () => {
    callback();
  });
}, 2);

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
        // Extract ppm-files
        extractPdfImagesQueue.push({ fullFilename, imagesPrefix }, () => {
          folderToJpeg(imagesDir);
        });
      }
    });
});

extractPdfImagesQueue.drain = function() {
  console.log('All PDF images are extracted.');
};
convertImageQueue.drain = function() {
  console.log('All image files are converted to jpeg');
  buildThumbnails('static/facsimiles');
  exec(
    'rsync -rva static/facsimiles/* 10.0.0.5:Sites/kalliope/static/facsimiles'
  );
};

// rsync -rva static/facsimiles/* 10.0.0.5:Sites/kalliope/static/facsimiles
