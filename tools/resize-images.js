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

const pipeJoinedExts = CommonData.availableImageFormats.join('|');
const skipRegExps = new RegExp(`-w\\d+\\.(${pipeJoinedExts})$`);

const handleDirRecursive = dirname => {
  fs.readdirSync(dirname).forEach(filename => {
    const fullFilename = path.join(dirname, filename);
    const stats = fs.statSync(fullFilename);
    if (stats.isDirectory()) {
      handleDirRecursive(fullFilename);
    } else if (
      stats.isFile() &&
      filename.endsWith('.jpg') &&
      !skipRegExps.test(filename)
    ) {
      CommonData.availableImageFormats.forEach((ext, i) => {
        CommonData.availableImageWidths.forEach(width => {
          const outputfile = fullFilename.replace(
            /\.jpg$/,
            `-w${width}.${ext}`
          );
          if (!fs.existsSync(outputfile)) {
            resize(fullFilename, outputfile, width);
          }
        });
      });
    }
  });
};

handleDirRecursive('static/images');
handleDirRecursive('static/kunst');
