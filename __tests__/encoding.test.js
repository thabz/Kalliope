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
  const invalidUtf8 = [];
  const invalidXmlEntities = [];
  const unnormalized = [];

  beforeAll(() => {
    gitFiles().forEach(filename => {
      if (binaryExtensions.has(path.extname(filename).toLowerCase())) {
        return;
      }

      const buffer = fs.readFileSync(filename);
      if (looksBinary(buffer)) {
        return;
      }

      try {
        const text = decoder.decode(buffer);

        if (filename.endsWith('.xml')) {
          const entities = text.matchAll(/&([A-Za-z][A-Za-z0-9]+);/g);

          for (const entity of entities) {
            if (!xmlEntities.has(entity[1])) {
              invalidXmlEntities.push(`${filename}: &${entity[1]};`);
            }
          }
        }

        if (text.normalize('NFC') !== text) {
          unnormalized.push(filename);
        }
      } catch (error) {
        invalidUtf8.push(filename);
      }
    });
  });

  it('keeps tracked text files encoded as UTF-8', () => {
    expect(invalidUtf8).toEqual([]);
  });

  it('keeps XML files free of SGML/HTML named entities', () => {
    expect(invalidXmlEntities).toEqual([]);
  });

  it('keeps tracked text files Unicode-normalized as NFC', () => {
    // NFC stores characters in their composed Unicode form where possible,
    // for example "å" as one code point instead of "a" plus a combining ring.
    expect(unnormalized).toEqual([]);
  });
});
