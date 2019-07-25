const deasync = require('deasync');
const sharp = require('sharp');
const { fileExists } = require('../libs/helpers.js');
const {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
} = require('../libs/caching.js');

let collected_imagesizes = null;

const imageSizeAsync = (filename, callback) => {
  if (collected_imagesizes == null) {
    collected_imagesizes = new Map(
      loadCachedJSON('collected.imagesizes') || []
    );
  }
  if (!fileExists(filename)) {
    const error = `image size failed for file: ${filename}`;
    throw error;
  }
  const cached = collected_imagesizes.get(filename);
  if (cached != null && !isFileModified(filename)) {
    callback(null, cached);
  } else {
    sharp(filename)
      .metadata()
      .then(metadata => {
        const size = { width: metadata.width, height: metadata.height };
        collected_imagesizes.set(filename, size);
        callback(null, size);
      });
  }
};

const imageSizeSync = deasync(imageSizeAsync);

const flushImageSizeCache = () => {
  writeCachedJSON('collected.imagesizes', Array.from(collected_imagesizes));
};

module.exports = {
  flushImageSizeCache,
  imageSizeSync,
};
