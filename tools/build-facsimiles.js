const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const async = require('async');
const { safeMkdir } = require('./libs/helpers.js');
const dirname = 'static/facsimiles';

// Place pdf-files in static/facsimiles/<poetname>/<workid>.pdf
// For each pdf file this script creates a folder static/facsimiles/<poetname>/<workid>
// containing jpg-files for each page in the pdf-file, named <workid>-<pagenumber>.jpg
// where <pagenumber> is 000, 001, 002, etc.

// Convert all ppm- and pbm-files in a folder to jpg
const folderToJpeg = imagesDir => {
  console.log(`Converting ${imagesDir} to jpeg`);
  fs
    .readdirSync(imagesDir)
    .filter(f => f.endsWith('.pbm') || f.endsWith('.ppm'))
    .forEach(srcFilename => {
      const srcPath = path.join(imagesDir, srcFilename);
      const destPath = srcPath
        .replace(/.pbm/, '.jpg')
        .replace(/.ppm/, '.jpg')
        .replace(/.*?-(\d*)\.jpg/, imagesDir + '/$1.jpg');
      console.log(destPath);
      exec(`convert "${srcPath}" "${destPath}"`, () => {
        fs.unlinkSync(srcPath);
      });
    });
};

//exec(`convert -density 300 ${pdfFilename} 1852-%03d.jpg`);

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
        console.log(`Extracting from ${fullFilename}`);
        // Extract ppm-files
        exec(`pdfimages -jp2 ${fullFilename} ${imagesPrefix}`, () => {
          folderToJpeg(imagesDir);
        });
      }
    });
});
