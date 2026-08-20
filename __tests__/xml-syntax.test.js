import fs from 'fs';
import { execFileSync } from 'child_process';
import { DOMParser } from '@xmldom/xmldom';

const sourceXmlFilenames = () =>
  execFileSync(
    'git',
    [
      'ls-files',
      '-z',
      '--',
      ':(glob)fdirs/**/*.xml',
      ':(glob)content/**/*.xml',
    ],
    { encoding: 'utf8' },
  )
    .split('\0')
    .filter(filename => filename.length > 0);

const parseXmlErrors = xml => {
  const errors = [];
  try {
    new DOMParser({
      onError(level, message) {
        if (level !== 'warning') {
          errors.push(message);
        }
      },
    }).parseFromString(xml, 'text/xml');
  } catch (error) {
    errors.push(error.message);
  }
  return errors;
};

describe('XML syntax', () => {
  it('reports recoverable XML parser errors', () => {
    expect(parseXmlErrors('<root>&unknown;</root>')).toEqual([
      'entity not found:&unknown;',
    ]);
  });

  it('parses every tracked Kalliope source XML file', () => {
    const errors = [];
    const filenames = sourceXmlFilenames();

    expect(filenames.length).toBeGreaterThan(0);

    for (const filename of filenames) {
      for (const error of parseXmlErrors(fs.readFileSync(filename, 'utf8'))) {
        errors.push(`${filename}: ${error}`);
      }
    }
    expect(errors).toEqual([]);
  });
});
