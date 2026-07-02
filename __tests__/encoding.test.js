const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { TextDecoder } = require('util');

const decoder = new TextDecoder('utf-8', { fatal: true });

const binaryExtensions = new Set([
  '.ai',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.pdf',
  '.png',
  '.tga',
  '.traineddata',
  '.ttf',
  '.webp',
  '.woff',
  '.woff2',
]);

const gitFiles = () =>
  execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

const looksBinary = buffer => {
  const scanLength = Math.min(buffer.length, 8000);
  for (let i = 0; i < scanLength; i++) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
};

describe('source encodings', () => {
  it('keeps tracked text files encoded as UTF-8', () => {
    const invalid = [];

    gitFiles().forEach(filename => {
      if (binaryExtensions.has(path.extname(filename).toLowerCase())) {
        return;
      }

      const buffer = fs.readFileSync(filename);
      if (looksBinary(buffer)) {
        return;
      }

      try {
        decoder.decode(buffer);
      } catch (error) {
        invalid.push(filename);
      }
    });

    expect(invalid).toEqual([]);
  });
});
