const {
  loadJSON,
  loadFile,
  writeJSON,
  safeMkdir,
  fileExists,
  fileModifiedTime,
} = require('./helpers.js');
const crypto = require('crypto');

// Load caches
const old_sha = loadJSON('./caches/files-sha.json') || {};
let new_sha = {};
let unmodified_files = new Set();
let deleted_files = new Set();
safeMkdir(`caches`);

const isFileModified = (...filenames) => {
  const _isFileModified = filename => {
    // For now remove the :id part of the filename
    filename = filename.split(':')[0];
    if (new_sha[filename]) {
      return true;
    }
    if (unmodified_files.has(filename)) {
      return false;
    }
    if (!fileExists(filename)) {
      if (old_sha[filename] != null) {
        deleted_files.add(filename);
        return true;
      } else {
        return false;
      }
    }

    const mtime = fileModifiedTime(filename);
    if (old_sha[filename] != null && mtime === old_sha[filename].mtime) {
      unmodified_files.add(filename);
      return false;
    }

    const shasum = crypto.createHash('sha1');
    const data = loadFile(filename);
    let digest = null;
    if (data != null) {
      shasum.update(data);
      digest = shasum.digest('hex');
    } else {
      digest = 'NO-DATA';
    }

    if (
      old_sha[filename] == null ||
      digest !== old_sha[filename].sha ||
      mtime !== old_sha[filename].mtime
    ) {
      new_sha[filename] = { sha: digest, mtime: mtime };
      return true;
    } else {
      unmodified_files.add(filename);
      return false;
    }
  };
  let result = false;
  for (let i = 0; i < filenames.length; i++) {
    result = _isFileModified(filenames[i]) || result;
  }
  return result;
};

const refreshFilesModifiedCache = () => {
  // Iterate all files in the has_new_sha and
  // update 'files-sha.json'.
  // Call this function after each complete import run.
  Object.assign(old_sha, new_sha);
  deleted_files.forEach(filename => {
    delete old_sha[filename];
  });
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
