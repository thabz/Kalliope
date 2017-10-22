const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const { safeMkdir } = require('./libs/helpers.js');

const dirname = 'static/facsimiles';

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
      safeMkdir(imagesDir);
      const imagesPrefix = path.join(imagesDir, workId);
      console.log(`Extracting from ${fullFilename}`);
      exec(`pdfimages -jp2 ${fullFilename} ${imagesPrefix}`);
    });
});
