import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadXMLDoc, getChildByTagName, safeGetText } from './build-static/xml.js';
import { applyLifeDataToXml } from './enrich-hidden-dfl-life-data.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultResolutionFile = path.join(
  rootDir,
  'tools',
  'data',
  'indsamling',
  'register',
  'author-resolution.json'
);
const defaultWorksFile = path.join(
  rootDir,
  'tools',
  'data',
  'indsamling',
  'register',
  'works.json'
);
const defaultDuplicateMergesFile = path.join(
  rootDir,
  'docs',
  'indsamling',
  'dfl',
  'duplicate-merges.json'
);
const defaultLifeDataFile = path.join(
  rootDir,
  'docs',
  'indsamling',
  'dfl',
  'livsdata',
  'resolved.json'
);

const htmlEntities = new Map([
  ['aacute', 'á'], ['acirc', 'â'], ['aelig', 'æ'], ['auml', 'ä'], ['aring', 'å'],
  ['AElig', 'Æ'], ['Aring', 'Å'], ['eacute', 'é'], ['egrave', 'è'],
  ['ecirc', 'ê'], ['euml', 'ë'], ['eth', 'ð'], ['iacute', 'í'], ['iuml', 'ï'],
  ['agrave', 'à'], ['laquo', '«'], ['oacute', 'ó'],
  ['ouml', 'ö'], ['oslash', 'ø'], ['Oacute', 'Ó'], ['Oslash', 'Ø'],
  ['raquo', '»'], ['szlig', 'ß'], ['THORN', 'Þ'], ['uacute', 'ú'],
  ['ucirc', 'û'], ['uuml', 'ü'], ['yacute', 'ý'],
  ['amp', '&'], ['quot', '"'], ['apos', "'"],
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
  .replaceAll('>', '&gt;');

const escapeXmlAttribute = value => escapeXml(value).replaceAll('"', '&quot;');

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

const workIdForDflRecord = record => {
  const normalized = record.sourceId
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  if (normalized.length === 0) {
    throw new Error(`DFL-værk-id kan ikke omsættes til et Kalliope-id: ${record.sourceId}`);
  }
  return `dfl-${normalized}`;
};

const workRecordsByDflId = works => {
  const byDflId = new Map();
  works.forEach(work => {
    (work.authors ?? []).forEach(author => {
      if (author.sourceId == null) return;
      const records = byDflId.get(author.sourceId) ?? new Map();
      records.set(work.sourceId, work);
      byDflId.set(author.sourceId, records);
    });
  });
  return new Map(
    [...byDflId].map(([dflId, records]) => [
      dflId,
      [...records.values()].sort((a, b) => a.sourceId.localeCompare(b.sourceId)),
    ])
  );
};

const renderWorkXml = (record, authorId) => {
  const title = escapeXml(decodeHtml(record.title.trim()));
  const year = /^(?:ca\.\s*)?\d{4}(?:-\d{2,4})?$/.test(record.year ?? '')
    ? `\n  <year>${escapeXml(record.year)}</year>`
    : '';
  const sourceUrl = escapeXmlAttribute(record.sourceUrl);
  const workId = workIdForDflRecord(record);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<kalliopework id="${workId}" author="${authorId}" status="incomplete" type="poetry">\n<workhead>\n  <title>${title}</title>${year}\n  <source href="${sourceUrl}">Dansk Forfatterleksikon, bibliografisk registrering som digte.</source>\n</workhead>\n</kalliopework>\n`;
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
          generated: entry.name.startsWith('dfl-') && person.getAttribute('hidden') === 'true',
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

const renderInfoXml = (record, id, workIds = [], lifeData = null) => {
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
  const birthYear = /^\d{4}$/.test(record.page?.birthYear ?? '')
    ? record.page.birthYear
    : null;
  const deathYear = /^\d{4}$/.test(record.page?.deathYear ?? '')
    ? record.page.deathYear
    : null;
  const periodXml = birthYear == null && deathYear == null
    ? ''
    : `  <period>\n${birthYear == null ? '' : `    <born>\n      <date>${birthYear}</date>\n    </born>\n`}${deathYear == null ? '' : `    <dead>\n      <date>${deathYear}</date>\n    </dead>\n`}  </period>\n`;
  const worksXml = workIds.length === 0
    ? ''
    : `  <works>${workIds.join(',')}</works>\n`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<person id="${id}" country="un" lang="da" type="poet" hidden="true">\n  <name>\n${nameXml}\n  </name>\n${periodXml}${worksXml}  <identifiers>\n    <danskforfatterleksikon-dk>${escapeXml(record.sourceId)}</danskforfatterleksikon-dk>\n  </identifiers>\n</person>\n`;
  return lifeData == null ? xml : applyLifeDataToXml(xml, lifeData);
};

const importHiddenDflPoets = ({
  resolutionFile = defaultResolutionFile,
  worksFile = defaultWorksFile,
  duplicateMergesFile = defaultDuplicateMergesFile,
  existingOnly = false,
  lifeDataFile = defaultLifeDataFile,
  dryRun = false,
} = {}) => {
  if (fs.existsSync(resolutionFile) === false) {
    throw new Error(
      `Mangler ${resolutionFile}. Kør først: npm run candidate-register -- --fetch --all-author-pages`
    );
  }
  if (fs.existsSync(worksFile) === false) {
    throw new Error(
      `Mangler ${worksFile}. Kør først: npm run candidate-register -- --fetch --all-author-pages`
    );
  }
  const resolution = JSON.parse(fs.readFileSync(resolutionFile, 'utf8'));
  const works = JSON.parse(fs.readFileSync(worksFile, 'utf8')).works;
  const worksByDflId = workRecordsByDflId(works);
  const lifeDataByPoetId = fs.existsSync(lifeDataFile)
    ? new Map(JSON.parse(fs.readFileSync(lifeDataFile, 'utf8')).records.map(record => [record.poetId, record]))
    : new Map();
  const existingPeople = existingDflPeople();
  const mergedDflIds = fs.existsSync(duplicateMergesFile)
    ? JSON.parse(fs.readFileSync(duplicateMergesFile, 'utf8')).merges
        .map(decision => decision.sourceDflId)
    : [];
  const peopleAndMergeDecisions = [
    ...existingPeople,
    ...mergedDflIds.map(dflId => ({ dflId, generated: false, hidden: false })),
  ];
  const generatedPeople = existingPeople.filter(person => person.generated && person.hidden);
  const recordsByDflId = new Map(
    resolution.records
      .filter(record => record.sourceId != null)
      .map(record => [record.sourceId, record])
  );
  const plan = existingOnly
    ? {
        desiredRecords: generatedPeople
          .map(person => recordsByDflId.get(person.dflId))
          .filter(record => record != null),
        peopleToRemove: [],
        recordsToCreate: [],
      }
    : planHiddenDflSync(resolution.records, peopleAndMergeDecisions);
  const { desiredRecords, peopleToRemove, recordsToCreate } = plan;
  const generatedByDflId = new Map(
    existingPeople
      .filter(person => person.generated && person.hidden)
      .map(person => [person.dflId, person])
  );
  const ids = new Set();
  let updated = 0;
  const updatedIds = [];
  desiredRecords.forEach(record => {
    const person = generatedByDflId.get(record.sourceId);
    if (person == null) return;
    const infoFile = path.join(person.directory, 'info.xml');
    const workIds = (worksByDflId.get(record.sourceId) ?? []).map(workIdForDflRecord);
    const xml = renderInfoXml(record, person.id, workIds, lifeDataByPoetId.get(person.id));
    if (fs.readFileSync(infoFile, 'utf8') === xml) return;
    updated += 1;
    updatedIds.push(person.id);
    if (dryRun === false) fs.writeFileSync(infoFile, xml);
  });
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
      const workIds = (worksByDflId.get(record.sourceId) ?? []).map(workIdForDflRecord);
      fs.writeFileSync(path.join(directory, 'info.xml'), renderInfoXml(record, id, workIds, lifeDataByPoetId.get(id)));
    }
  });
  let worksCreated = 0;
  desiredRecords.forEach(record => {
    const id = poetIdForDflId(record.sourceId);
    const directory = path.join(rootDir, 'fdirs', id);
    (worksByDflId.get(record.sourceId) ?? []).forEach(work => {
      const workFile = path.join(directory, `${workIdForDflRecord(work)}.xml`);
      if (fs.existsSync(workFile)) return;
      worksCreated += 1;
      if (dryRun === false) {
        fs.writeFileSync(workFile, renderWorkXml(work, id));
      }
    });
  });
  peopleToRemove.forEach(person => {
    const files = fs.readdirSync(person.directory);
    const unexpectedFiles = files.filter(file => {
      if (file === 'info.xml') return false;
      if (file.startsWith('dfl-') === false || file.endsWith('.xml') === false) return true;
      const xml = fs.readFileSync(path.join(person.directory, file), 'utf8');
      return xml.includes('status="incomplete"') === false || xml.includes('<workbody>');
    });
    if (unexpectedFiles.length > 0) {
      throw new Error(`Nægter at fjerne ikke-tom genereret mappe: ${person.directory}`);
    }
    if (dryRun === false) {
      files.forEach(file => fs.unlinkSync(path.join(person.directory, file)));
      fs.rmdirSync(person.directory);
    }
  });
  return {
    created: recordsToCreate.length,
    createdIds: recordsToCreate.map(record => record.sourceId).sort(),
    kept: desiredRecords.length - recordsToCreate.length,
    updated,
    updatedIds: updatedIds.sort(),
    worksCreated,
    removed: peopleToRemove.length,
    removedIds: peopleToRemove.map(person => person.dflId).sort(),
    existingOnly,
    unmatchedExisting: existingOnly
      ? generatedPeople.length - desiredRecords.length
      : 0,
    dryRun,
  };
};

const isMainModule =
  process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  const result = importHiddenDflPoets({
    existingOnly: process.argv.includes('--existing-only'),
    dryRun: process.argv.includes('--dry-run'),
  });
  console.log(JSON.stringify(result));
}

export {
  decodeHtml,
  importableRecords,
  importHiddenDflPoets,
  planHiddenDflSync,
  poetIdForDflId,
  renderInfoXml,
  renderWorkXml,
  workIdForDflRecord,
  workRecordsByDflId,
};
