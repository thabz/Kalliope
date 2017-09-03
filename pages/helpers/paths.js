const hashCode = str => {
  // Javas String.hashCode()
  let hash = 0;
  if (str == null || str.length == 0) return hash;
  for (let i = 0; i < str.length; i++) {
    let char = str.charCodeAt(i);
    hash = (hash << 5) + hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

const textFolder = id => {
  // Hashen bevæger sig mest i de mindst betydende bits, så reverse hex-strengen.
  const hash = hashCode(id).toString(16).split('').reverse().join('');
  return `static/api/texts/${hash[0]}/${hash[1]}${hash[2]}`;
};

const textPath = id => {
  const folder = textFolder(id);
  return `${folder}/${id}.json`;
};

const Paths = { textFolder, textPath };

module.exports.textFolder = textFolder;
module.exports.textPath = textPath;
