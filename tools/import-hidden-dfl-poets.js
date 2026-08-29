import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadXMLDoc, getChildByTagName, safeGetText } from './build-static/xml.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultResolutionFile = path.join(
  rootDir,
  'tools',
  'data',
  'indsamling',
  'register',
  'author-resolution.json'
);

const htmlEntities = new Map([
  ['aacute', 'á'], ['aelig', 'æ'], ['auml', 'ä'], ['aring', 'å'],
  ['AElig', 'Æ'], ['Aring', 'Å'], ['eacute', 'é'], ['egrave', 'è'],
  ['euml', 'ë'], ['eth', 'ð'], ['iacute', 'í'], ['oacute', 'ó'],
  ['ouml', 'ö'], ['oslash', 'ø'], ['Oacute', 'Ó'], ['Oslash', 'Ø'],
  ['uuml', 'ü'], ['amp', '&'], ['quot', '"'], ['apos', "'"],
  ['lt', '<'], ['gt', '>'], ['nbsp', ' '],
]);

const decodeHtml = value => value.replace(
  /&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi,
  (entity, key) => {
    if (key.startsWith('#x') || key.startsWith('#X')) {
      return String.fromCodePoint(Number.parseInt(key.slice(2), 16));
    }
    if (key.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(key.slice(1), 10));
    }
    return htmlEntities.get(key) ?? entity;
  }
);

const escapeXml = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const poetIdForDflId = sourceId => {
  const normalized = sourceId
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  if (normalized.length === 0) {
    throw new Error(`DFL-id kan ikke omsættes til et Kalliope-id: ${sourceId}`);
  }
  return `dfl-${normalized}`;
};

const existingDflPeople = () => {
  const people = [];
  fs.readdirSync(path.join(rootDir, 'fdirs'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .forEach(entry => {
      const doc = loadXMLDoc(path.join(rootDir, 'fdirs', entry.name, 'info.xml'));
      const person = getChildByTagName(doc, 'person');
      const identifiers = getChildByTagName(person, 'identifiers');
      const dflId = safeGetText(identifiers, 'danskforfatterleksikon-dk');
      if (dflId != null) {
        people.push({
          dflId,
          directory: path.join(rootDir, 'fdirs', entry.name),
          generated: entry.name.startsWith('dfl-') && safeGetText(person, 'works') == null,
          hidden: person.getAttribute('hidden') === 'true',
          id: safeGetText(person, 'id') ?? person.getAttribute('id'),
        });
      }
    });
  return people;
};

const importableRecords = (records, knownDflIds) => records.filter(record => {
  return record.sourceId != null &&
    knownDflIds.has(record.sourceId) === false &&
    record.eligibility?.status === 'eligible' &&
    record.resolution?.status !== 'not-a-person' &&
    record.page?.pageStatus !== 'non-person-placeholder';
});

const planHiddenDflSync = (records, existingPeople) => {
  const existingEditorialIds = new Set(
    existingPeople
      .filter(person => person.generated === false)
      .map(person => person.dflId)
  );
  const desiredRecords = importableRecords(records, existingEditorialIds);
  const desiredDflIds = new Set(
    desiredRecords.map(record => record.sourceId)
  );
  const generatedPeople = existingPeople.filter(
    person => person.generated && person.hidden
  );
  const peopleToRemove = generatedPeople.filter(
    person => desiredDflIds.has(person.dflId) === false
  );
  const existingGeneratedIds = new Set(
    generatedPeople.map(person => person.dflId)
  );
  const recordsToCreate = desiredRecords.filter(
    record => existingGeneratedIds.has(record.sourceId) === false
  );
  return { desiredRecords, peopleToRemove, recordsToCreate };
};

const renderInfoXml = (record, id) => {
  const names = [...new Set(
    record.names
      .map(decodeHtml)
      .map(name => name.trim())
      .filter(name => name.length > 0)
  )];
  if (names.length === 0) {
    throw new Error(`${record.sourceId} mangler en brugbar navneform`);
  }
  const nameXml = [
    `    <fullname>${escapeXml(names[0])}</fullname>`,
    ...names.slice(1).map(name => `    <alternative>${escapeXml(name)}</alternative>`),
  ].join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<person id="${id}" country="un" lang="da" type="poet" hidden="true">\n  <name>\n${nameXml}\n  </name>\n  <identifiers>\n    <danskforfatterleksikon-dk>${escapeXml(record.sourceId)}</danskforfatterleksikon-dk>\n  </identifiers>\n</person>\n`;
};

const importHiddenDflPoets = ({
  resolutionFile = defaultResolutionFile,
  dryRun = false,
} = {}) => {
  if (fs.existsSync(resolutionFile) === false) {
    throw new Error(
      `Mangler ${resolutionFile}. Kør først: npm run candidate-register -- --fetch --all-author-pages`
    );
  }
  const resolution = JSON.parse(fs.readFileSync(resolutionFile, 'utf8'));
  const existingPeople = existingDflPeople();
  const { desiredRecords, peopleToRemove, recordsToCreate } =
    planHiddenDflSync(resolution.records, existingPeople);
  const ids = new Set();
  recordsToCreate.forEach(record => {
    const id = poetIdForDflId(record.sourceId);
    if (ids.has(id)) {
      throw new Error(`Flere DFL-poster giver samme Kalliope-id: ${id}`);
    }
    ids.add(id);
    const directory = path.join(rootDir, 'fdirs', id);
    if (fs.existsSync(directory)) {
      throw new Error(`Import-id findes allerede uden det registrerede DFL-id: ${id}`);
    }
    if (dryRun === false) {
      fs.mkdirSync(directory);
      fs.writeFileSync(path.join(directory, 'info.xml'), renderInfoXml(record, id));
    }
  });
  peopleToRemove.forEach(person => {
    const files = fs.readdirSync(person.directory);
    if (files.length !== 1 || files[0] !== 'info.xml') {
      throw new Error(`Nægter at fjerne ikke-tom genereret mappe: ${person.directory}`);
    }
    if (dryRun === false) {
      fs.rmSync(path.join(person.directory, 'info.xml'));
      fs.rmdirSync(person.directory);
    }
  });
  return {
    created: recordsToCreate.length,
    createdIds: recordsToCreate.map(record => record.sourceId).sort(),
    kept: desiredRecords.length - recordsToCreate.length,
    removed: peopleToRemove.length,
    removedIds: peopleToRemove.map(person => person.dflId).sort(),
    dryRun,
  };
};

const isMainModule =
  process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  const result = importHiddenDflPoets({ dryRun: process.argv.includes('--dry-run') });
  console.log(JSON.stringify(result));
}

export {
  decodeHtml,
  importableRecords,
  importHiddenDflPoets,
  planHiddenDflSync,
  poetIdForDflId,
  renderInfoXml,
};
