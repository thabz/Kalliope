const crypto = require('crypto');

const textFolder = id => {
  const hash = crypto.createHash('md5');
  hash.update(id);
  const md5 = hash.digest('hex');
  return `static/api/texts/${md5[0]}/${md5[1]}${md5[2]}`;
};

const textPath = id => {
  const folder = textFolder(id);
  return `${folder}/${id}.json`;
};

const Paths = { textFolder, textPath };

module.exports.textFolder = textFolder;
module.exports.textPath = textPath;
