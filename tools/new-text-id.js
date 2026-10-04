import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  copenhagenDateStamp,
  nextTextId,
  normalizeDateStamp,
  parseWorkTextIds,
} from './libs/text-id.js';

const xmlFilesBelow = directory => fs.readdirSync(directory, { withFileTypes: true })
  .flatMap(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory() === true) {
      return xmlFilesBelow(filename);
    }
    return entry.isFile() === true && entry.name.endsWith('.xml') === true
      ? [filename]
      : [];
  });

const parseArguments = args => {
  const options = { author: null, dateStamp: copenhagenDateStamp(), filename: null };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--author' || argument === '--date') {
      const value = args[index + 1];
      if (value == null) {
        throw new Error(`Der mangler en værdi efter ${argument}.`);
      }
      if (argument === '--author') {
        options.author = value;
      } else {
        options.dateStamp = normalizeDateStamp(value);
      }
      index += 1;
    } else if (argument.startsWith('--author=') === true) {
      options.author = argument.slice('--author='.length);
    } else if (argument.startsWith('--date=') === true) {
      options.dateStamp = normalizeDateStamp(argument.slice('--date='.length));
    } else if (argument.startsWith('--') === true) {
      throw new Error(`Ukendt argument: ${argument}`);
    } else if (options.filename == null) {
      options.filename = argument;
    } else {
      throw new Error(`Uventet argument: ${argument}`);
    }
  }

  if (options.filename == null) {
    throw new Error('Brug: node tools/new-text-id.js VÆRKFIL [--author DIGTER-ID] [--date YYYY-MM-DD]');
  }
  return options;
};

export const generateTextId = ({
  author = null,
  corpusDirectory = 'fdirs',
  dateStamp = copenhagenDateStamp(),
  filename,
}) => {
  if (fs.existsSync(filename) !== true) {
    throw new Error(`Værkfilen findes ikke: ${filename}`);
  }
  if (fs.existsSync(corpusDirectory) !== true) {
    throw new Error(`Korpusmappen findes ikke: ${corpusDirectory}`);
  }

  const work = parseWorkTextIds(fs.readFileSync(filename, 'utf8'), filename);
  const poetId = author ?? work.author;
  if (poetId == null || poetId.length === 0) {
    throw new Error('Værket har intet author-attribut; angiv --author DIGTER-ID.');
  }

  const existingIds = xmlFilesBelow(corpusDirectory)
    .flatMap(xmlFilename => parseWorkTextIds(
      fs.readFileSync(xmlFilename, 'utf8'),
      xmlFilename,
    ).texts)
    .map(text => text.id);

  return nextTextId({ poetId, dateStamp, existingIds });
};

const isMainModule = process.argv[1] != null &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  try {
    const options = parseArguments(process.argv.slice(2));
    console.log(generateTextId(options));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
