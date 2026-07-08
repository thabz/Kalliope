import plimit from 'p-limit';
import sharp from 'sharp';
import { fileExists } from '../libs/helpers.js';
import {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
} from '../libs/caching.js';

let collected_imagesizes = new Map(
  loadCachedJSON('collected.imagesizes') || []
);

const readImageSize = async filename => {
  if (!fileExists(filename)) {
    throw `image size failed for missing file: ${filename}`;
  }
  const cached = collected_imagesizes.get(filename);
  if (cached != null && !isFileModified(filename)) {
    return cached;
  }
  try {
    const metadata = await sharp(filename).metadata();
    const size = {
      width: metadata.width,
      height: metadata.height,
    };
    collected_imagesizes.set(filename, size);
    return size;
  } catch (e) {
    throw `${filename}: ${e}`;
  }
};

const limit = plimit(5);
const imageSizeSync = async filename => {
  return limit(() => {
    return readImageSize(filename);
  });
};

const flushImageSizeCache = () => {
  writeCachedJSON('collected.imagesizes', Array.from(collected_imagesizes));
};

export {
  flushImageSizeCache,
  imageSizeSync,
};
