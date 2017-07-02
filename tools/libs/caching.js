const { loadJSON, loadFile, writeJSON, safeMkdir } = require('./helpers.js');
const crypto = require('crypto');

// Load caches
const old_sha = loadJSON('./caches/files-sha.json') || {};
let new_sha = {};
let is_unmodified = {};

safeMkdir(`caches`);

const isFileModified = filename => {
  if (new_sha[filename]) {
    return true;
  }
  if (is_unmodified[filename]) {
    return false;
  }
  const shasum = crypto.createHash('sha1');
  const data = loadFile(filename);
  shasum.update(data);
  const digest = shasum.digest('hex');
  if (digest != old_sha[filename]) {
    new_sha[filename] = digest;
    return true;
  } else {
    is_unmodified[filename] = true;
    return false;
  }
};

const refreshFilesModifiedCache = () => {
  // Iterate all files in the has_new_sha and
  // update 'files-sha.json'.
  // Call this function after each complete import run.
  Object.assign(old_sha, new_sha);
  writeJSON('./caches/files-sha.json', old_sha);
};

// Use this for caching the data from a first pass
const loadCachedJSON = key => {
  return loadJSON(`caches/${key}.json`);
};

const writeCachedJSON = (key, data) => {
  writeJSON(`caches/${key}.json`, data);
};

module.exports = {
  isFileModified,
  refreshFilesModifiedCache,
  loadCachedJSON,
  writeCachedJSON,
};
