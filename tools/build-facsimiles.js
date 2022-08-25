const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const async = require('async');
const { safeMkdir, buildThumbnails } = require('./libs/helpers.js');

const dirname = 'static/facsimiles';

// First `brew install poppler`
//
// Then
//
// Place pdf-files in static/facsimiles/<poetname>/<workid>.pdf
// For each pdf file this script creates a folder static/facsimiles/<poetname>/<workid>
// containing jpg-files for each page in the pdf-file, named <workid>-<pagenumber>.jpg
// where <pagenumber> is 000, 001, 002, etc.

// I can't control the output format of 'pdftoppm', so I'll just rename
// all files into the wanted filename-format: 000.jpg, 001.jpg, ...
const renameImages = imagesDir => {
  fs
    .readdirSync(imagesDir)
    .filter(f => f.endsWith('.jpg'))
    .sort()
    .forEach((srcFilename, i) => {
      const destFilename = i.toLocaleString('en-US',{minimumIntegerDigits:3, useGrouping:false}) + '.jpg';
      fs.renameSync(path.join(imagesDir,srcFilename), path.join(imagesDir,destFilename));
    });
};

// Extract all pages from the pdf into separate jpeg files.
let extractPdfImagesQueue = async.queue((task, callback) => {
  console.log(`Extracting from ${task.fullFilename}`);
  exec(`pdftoppm -jpeg -r 300  ${task.fullFilename} ${task.imagesPrefix}`, (error) => {
      if (error) {
        console.error(`Exec error: ${error}`);
        console.error("Run 'brew install poppler' to get the pdftoppm tool");
      } else {
        callback();
      }
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
        // Extract pages
        extractPdfImagesQueue.push({ fullFilename, imagesPrefix }, () => {
          renameImages(imagesDir);
        });
      }
    });
});

extractPdfImagesQueue.drain = function() {
  buildThumbnails('static/facsimiles');
  exec(
    'rsync -rva static/facsimiles/* 10.0.0.5:Sites/kalliope/static/facsimiles'
  );
};

