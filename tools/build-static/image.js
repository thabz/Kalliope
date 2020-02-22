const jimp = require('jimp');
const plimit = require('p-limit');
const { fileExists } = require('../libs/helpers.js');
const {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
} = require('../libs/caching.js');

let collected_imagesizes = new Map(
  loadCachedJSON('collected.imagesizes') || []
);

const imageSizeAsync = async filename => {
  return new Promise((resolve, reject) => {
    if (!fileExists(filename)) {
      reject(`image size failed for file: ${filename}`);
    } else {
      const cached = collected_imagesizes.get(filename);
      if (cached != null && !isFileModified(filename)) {
        resolve(cached);
      } else {
        jimp
          .read(filename)
          .then(image => {
            const size = {
              width: image.bitmap.width,
              height: image.bitmap.height,
            };
            collected_imagesizes.set(filename, size);
            resolve(size);
          })
          .catch(e => {
            reject(`${filename}: ${e}`);
          });
      }
    }
  });
};
const limit = plimit(5);
const imageSizeSync = async filename => {
  return limit(() => {
    console.log('imageSizeAsync start ' + filename);
    const x = imageSizeAsync(filename);
    console.log('imageSizeAsync slut' + filename);
    return x;
  });
};

const flushImageSizeCache = () => {
  writeCachedJSON('collected.imagesizes', Array.from(collected_imagesizes));
};

module.exports = {
  flushImageSizeCache,
  imageSizeSync,
};
