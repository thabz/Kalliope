const deasync = require('deasync');
const jimp = require('jimp');
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
  if (!fileExists(filename)) {
    const error = `image size failed for file: ${filename}`;
    throw error;
  }
  const cached = collected_imagesizes.get(filename);
  if (cached != null && !isFileModified(filename)) {
    return cached;
  } else {
    const image = await jimp.read(filename);
    const size = { width: image.bitmap.width, height: image.bitmap.height };
    collected_imagesizes.set(filename, size);
    return size;
  }
};

const imageSizeCallback = (filename, callback) => {
  const size = imageSizeAsync(f).then(size => {
    callback(null, size);
  });
};

const imageSizeSync = deasync(imageSizeCallback);

const flushImageSizeCache = () => {
  writeCachedJSON('collected.imagesizes', Array.from(collected_imagesizes));
};

module.exports = {
  flushImageSizeCache,
  imageSizeSync,
};
