import path from 'path';
import { fileURLToPath } from 'url';
import { DOMParser } from '@xmldom/xmldom';
import plimit from 'p-limit';
import {
  isWorkFileContent,
  loadTrackedWorkFiles,
} from './libs/work-files.js';
import { checksForWorkXml } from './work-validation.js';

const defaultBaseUrl = 'https://kalliope.org/facsimiles';
const configuredRequestConcurrency = parseInt(
  process.env.KALLIOPE_FACSIMILE_CHECK_CONCURRENCY,
  10,
);
const requestConcurrency =
  Number.isInteger(configuredRequestConcurrency) &&
  configuredRequestConcurrency > 0
    ? configuredRequestConcurrency
    : 12;

const normalizeFacsimileId = facsimile => facsimile.replace(/\.pdf$/i, '');

const facsimilePageUrl = (baseUrl, poetId, facsimile) => {
  const encodedPoetId = encodeURIComponent(poetId);
  const encodedFacsimile = encodeURIComponent(normalizeFacsimileId(facsimile));
  return `${baseUrl.replace(/\/$/, '')}/${encodedPoetId}/${encodedFacsimile}/000.jpg`;
};

const findFacsimileReferences = (workFiles, baseUrl = defaultBaseUrl) => {
  const referencesByUrl = new Map();

  workFiles
    .filter(workFile => checksForWorkXml(workFile.content).facsimiles === true)
    .forEach(({ content, filename }) => {
      const document = new DOMParser().parseFromString(content, 'text/xml');
      const poetId = path.basename(path.dirname(filename));

      Array.from(document.getElementsByTagName('source')).forEach(source => {
        const facsimile = source.getAttribute('facsimile');
        if (facsimile == null || facsimile === '') {
          return;
        }

        const url = facsimilePageUrl(baseUrl, poetId, facsimile);
        if (referencesByUrl.has(url) === false) {
          referencesByUrl.set(url, { filenames: new Set(), url });
        }
        referencesByUrl.get(url).filenames.add(filename);
      });
    });

  return Array.from(referencesByUrl.values()).map(reference => ({
    ...reference,
    filenames: Array.from(reference.filenames),
  }));
};

const checkFacsimileReferences = async (
  references,
  { fetchMethod = fetch, timeoutMs = 10000 } = {},
) => {
  const limit = plimit(requestConcurrency);
  const failures = await Promise.all(
    references.map(reference =>
      limit(async () => {
        try {
          const response = await fetchMethod(reference.url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(timeoutMs),
          });
          if (response.ok === true) {
            return null;
          }
          return { ...reference, reason: `HTTP ${response.status}` };
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          return { ...reference, reason };
        }
      }),
    ),
  );

  return failures.filter(failure => failure != null);
};

const run = async () => {
  const baseUrl =
    process.env.KALLIOPE_FACSIMILE_BASE_URL ?? defaultBaseUrl;
  const references = findFacsimileReferences(loadTrackedWorkFiles(), baseUrl);
  const failures = await checkFacsimileReferences(references);

  if (failures.length > 0) {
    console.error('Følgende facsimiler er ikke genereret og synkroniseret:');
    failures.forEach(({ filenames, reason, url }) => {
      console.error(`- ${filenames.join(', ')}: ${url} (${reason})`);
    });
    process.exitCode = 1;
    return;
  }

  console.log(
    `Kontrollerede ${references.length} genererede og synkroniserede facsimiler.`,
  );
};

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  run();
}

export {
  checkFacsimileReferences,
  facsimilePageUrl,
  findFacsimileReferences,
  isWorkFileContent,
};
