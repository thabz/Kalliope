const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const CommonData = require('../pages/helpers/commondata.js');

const resize = (inputfile, outputfile, maxWidth) => {
  sharp(inputfile)
    .resize(maxWidth, 10000)
    .max()
    .withoutEnlargement()
    .toFile(outputfile, function(err) {
      if (err != null) {
        console.log(err);
      }
      console.log(`Created ${outputfile}`);
    });
};

const handleDirRecursive = dirname => {
  fs.readdirSync(dirname).forEach(filename => {
    const fullFilename = path.join(dirname, filename);
    const stats = fs.statSync(fullFilename);
    if (stats.isDirectory()) {
      handleDirRecursive(fullFilename);
    } else if (
      stats.isFile() &&
      filename.endsWith('.jpg') &&
      !filename.match(/-w\d+.jpg$/)
    ) {
      CommonData.availableImageWidths.forEach(width => {
        const outputfile = fullFilename.replace(/.jpg$/, `-w${width}.jpg`);
        if (!fs.existsSync(outputfile)) {
          resize(fullFilename, outputfile, width);
        }
      });
    }
  });
};

handleDirRecursive('static/images');
