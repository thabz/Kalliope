const thumbnailSrc = (src, width, ext) => {
  return src
    .replace(/^\//, '/generated/')
    .replace(/\.jpg$/, `-w${width}.${ext}`)
    .replace(/\/([^/]+)$/, '/t/$1');
};

const fallbackThumbnailSrc = (src, postfix) => {
  return src
    .replace(/^\//, '/generated/')
    .replace(/\/([^/]+)\.jpg$/, `/t/$1${postfix}`);
};

module.exports = { thumbnailSrc, fallbackThumbnailSrc };
