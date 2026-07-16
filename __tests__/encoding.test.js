import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { TextDecoder } from 'util';

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

const gitFiles = (...patterns) =>
  execFileSync('git', ['ls-files', ...patterns], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .filter(filename => fs.existsSync(filename));

const xmlEntities = new Set(['amp', 'apos', 'gt', 'lt', 'quot']);

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

  it('keeps XML files free of SGML/HTML named entities', () => {
    const invalid = [];

    gitFiles('*.xml').forEach(filename => {
      const text = fs.readFileSync(filename, 'utf8');
      const entities = text.matchAll(/&([A-Za-z][A-Za-z0-9]+);/g);

      for (const entity of entities) {
        if (!xmlEntities.has(entity[1])) {
          invalid.push(`${filename}: &${entity[1]};`);
        }
      }
    });

    expect(invalid).toEqual([]);
  });

  it('keeps tracked text files Unicode-normalized as NFC', () => {
    // NFC stores characters in their composed Unicode form where possible,
    // for example "å" as one code point instead of "a" plus a combining ring.
    const unnormalized = [];

    gitFiles().forEach(filename => {
      if (binaryExtensions.has(path.extname(filename).toLowerCase())) {
        return;
      }

      const buffer = fs.readFileSync(filename);
      if (looksBinary(buffer)) {
        return;
      }

      let text;
      try {
        text = decoder.decode(buffer);
      } catch (error) {
        return;
      }

      if (text.normalize('NFC') !== text) {
        unnormalized.push(filename);
      }
    });

    expect(unnormalized).toEqual([]);
  });
});
