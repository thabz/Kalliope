import fs from 'fs';
import path from 'path';
import { DOMParser } from '@xmldom/xmldom';

const repositoryRoot = path.resolve(__dirname, '..');

const collectXmlFiles = directory => {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue;
    }
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectXmlFiles(filename));
    } else if (entry.isFile() && entry.name.endsWith('.xml')) {
      files.push(filename);
    }
  }
  return files;
};

describe('XML syntax', () => {
  it('parses every XML file in the repository', () => {
    const errors = [];
    for (const filename of collectXmlFiles(repositoryRoot)) {
      try {
        new DOMParser().parseFromString(
          fs.readFileSync(filename, 'utf8'),
          'text/xml'
        );
      } catch (error) {
        errors.push(`${path.relative(repositoryRoot, filename)}: ${error}`);
      }
    }
    expect(errors).toEqual([]);
  });
});
