import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import {
  parseWorkTextIds,
  textIdError,
  textIdParts,
} from './libs/text-id.js';

const git = (args, options = {}) => execFileSync('git', args, {
  encoding: options.encoding ?? 'utf8',
  maxBuffer: 512 * 1024 * 1024,
  ...options,
});

const filesAtRef = ref => git([
  'ls-tree',
  '-r',
  '--name-only',
  '-z',
  ref,
  '--',
  'fdirs',
])
  .split('\0')
  .filter(filename => filename.endsWith('.xml') === true);

const readFilesAtRef = (ref, filenames) => {
  if (filenames.length === 0) {
    return new Map();
  }

  const requests = filenames.map(filename => `${ref}:${filename}\n`).join('');
  const output = git(['cat-file', '--batch'], { encoding: null, input: requests });
  const contents = new Map();
  let offset = 0;

  filenames.forEach(filename => {
    const headerEnd = output.indexOf(0x0a, offset);
    if (headerEnd < 0) {
      throw new Error(`Git returnerede intet blob-header for ${filename}.`);
    }
    const header = output.subarray(offset, headerEnd).toString('utf8');
    const match = header.match(/^[0-9a-f]+ blob (\d+)$/);
    if (match == null) {
      throw new Error(`Git kunne ikke læse ${ref}:${filename}: ${header}`);
    }

    const size = Number(match[1]);
    const contentStart = headerEnd + 1;
    const contentEnd = contentStart + size;
    contents.set(filename, output.subarray(contentStart, contentEnd).toString('utf8'));
    offset = contentEnd + 1;
  });

  return contents;
};

export const collectTextIdsAtRef = ref => {
  git(['rev-parse', '--verify', `${ref}^{commit}`]);
  const filenames = filesAtRef(ref);
  const contents = readFilesAtRef(ref, filenames);

  return filenames.flatMap(filename =>
    parseWorkTextIds(contents.get(filename), filename).texts,
  );
};

export const newTextIdErrors = (baseTexts, headTexts) => {
  const errors = [];
  const baseIds = new Set(baseTexts.map(text => text.id));
  const baseCounts = new Map();
  const baseMaximumSequences = new Map();
  const headById = new Map();

  baseTexts.forEach(text => {
    baseCounts.set(text.id, (baseCounts.get(text.id) ?? 0) + 1);
    const parts = textIdParts(text);
    if (parts != null) {
      const key = `${text.poetId}\0${parts.dateStamp}`;
      baseMaximumSequences.set(
        key,
        Math.max(baseMaximumSequences.get(key) ?? 0, parts.sequence),
      );
    }
  });

  headTexts.forEach(text => {
    const locations = headById.get(text.id) ?? [];
    locations.push(text.filename);
    headById.set(text.id, locations);
  });

  headById.forEach((filenames, id) => {
    const baseCount = baseCounts.get(id) ?? 0;
    if (filenames.length > 1 && filenames.length > baseCount) {
      errors.push(`Tekst-id'et ${id} forekommer flere gange: ${filenames.join(', ')}.`);
    }
  });

  headTexts
    .filter(text => baseIds.has(text.id) !== true)
    .forEach(text => {
      const error = textIdError(text);
      if (error != null) {
        errors.push(`${text.filename}: ${error}`);
        return;
      }

      const parts = textIdParts(text);
      const key = `${text.poetId}\0${parts.dateStamp}`;
      const previousMaximum = baseMaximumSequences.get(key) ?? 0;
      if (parts.sequence <= previousMaximum) {
        errors.push(
          `${text.filename}: Tekst-id'et ${text.id} genbruger et løbenummer; ` +
          `det højeste eksisterende nummer for ${text.poetId}${parts.dateStamp} er ${previousMaximum}.`,
        );
      }
    });

  return errors;
};

export const validateRefs = (baseRef, headRef = 'HEAD') => {
  const baseTexts = collectTextIdsAtRef(baseRef);
  const headTexts = collectTextIdsAtRef(headRef);
  const errors = newTextIdErrors(baseTexts, headTexts);
  const baseIds = new Set(baseTexts.map(text => text.id));
  const newCount = headTexts.filter(text => baseIds.has(text.id) !== true).length;

  return { errors, newCount };
};

const isMainModule = process.argv[1] != null &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  const [baseRef, headRef = 'HEAD'] = process.argv.slice(2);
  if (baseRef == null) {
    console.error('Brug: node tools/validate-new-text-ids.js BASE-REF [HEAD-REF]');
    process.exitCode = 1;
  } else {
    try {
      const result = validateRefs(baseRef, headRef);
      if (result.errors.length > 0) {
        result.errors.forEach(error => console.error(error));
        process.exitCode = 1;
      } else {
        console.log(`Validerede ${result.newCount} nye tekst-id'er.`);
      }
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
