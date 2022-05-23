const sizeOf = require('image-size');
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

const slowImageSize = async filename => {
  return new Promise((resolve, reject) => {
    if (!fileExists(filename)) {
      reject(`image size failed for missing file: ${filename}`);
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

const fastImageSize = async filename => {
  return new Promise((resolve, reject) => {
    if (!fileExists(filename)) {
      reject(`image size failed for missing file: ${filename}`);
    } else {
      const cached = collected_imagesizes.get(filename);
      if (cached != null && !isFileModified(filename)) {
        resolve(cached);
      } else {
        try {
          const size = sizeOf(filename); // returns {width, height}
          collected_imagesizes.set(filename, size);
          resolve(size);
        } catch (e) {
          // Filen er korrupt iflg. image-size biblioteket.
          // Det sker tit. Brug det langsommere jimp bibliotek i stedet.
          slowImageSize(filename).then(size => {
            resolve(size);
          });
        }
      }
    }
  });
};

const limit = plimit(5);
const imageSizeSync = async filename => {
  return limit(() => {
    return fastImageSize(filename);
  });
};

const flushImageSizeCache = () => {
  writeCachedJSON('collected.imagesizes', Array.from(collected_imagesizes));
};

module.exports = {
  flushImageSizeCache,
  imageSizeSync,
};
