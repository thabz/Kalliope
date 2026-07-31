import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMParser } from '@xmldom/xmldom';

const statusFilename = 'tools/data/salmonsen-biography-status.json';
const validStatus = 'not_found';

const normalizedText = node =>
  (node?.textContent ?? '').replace(/\s+/g, ' ').trim();

const parsePerson = (filename, xml) => {
  const errors = [];
  let document;

  try {
    document = new DOMParser({
      onError: (level, message) => {
        if (level !== 'warning') {
          errors.push(message);
        }
      },
    }).parseFromString(xml, 'application/xml');
  } catch (error) {
    throw new Error(`Ugyldig person-XML: ${filename}: ${error.message}`);
  }
  const person = document.documentElement;

  if (
    errors.length > 0 ||
    person == null ||
    person.tagName !== 'person'
  ) {
    throw new Error(`Ugyldig person-XML: ${filename}`);
  }

  const name = person.getElementsByTagName('name')[0];
  return {
    id: person.getAttribute('id'),
    country: person.getAttribute('country'),
    type: person.getAttribute('type'),
    name: normalizedText(name),
  };
};

const loadPoets = (rootDir = process.cwd()) => {
  const fdirs = path.join(rootDir, 'fdirs');
  const poets = new Map();

  for (const entry of fs.readdirSync(fdirs, { withFileTypes: true })) {
    if (entry.isDirectory() !== true) {
      continue;
    }

    const infoFilename = path.join(fdirs, entry.name, 'info.xml');
    if (fs.existsSync(infoFilename) !== true) {
      continue;
    }

    const person = parsePerson(
      path.relative(rootDir, infoFilename),
      fs.readFileSync(infoFilename, 'utf8')
    );
    const poet = { ...person, id: entry.name };
    poet.hasBiography = fs.existsSync(
      path.join(fdirs, entry.name, 'bio.xml')
    );
    poets.set(poet.id, poet);
  }

  return poets;
};

const loadStatus = (rootDir = process.cwd()) => {
  const filename = path.join(rootDir, statusFilename);
  let status;

  try {
    status = JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch (error) {
    throw new Error(
      `Kunne ikke læse ${statusFilename}: ${error.message}`
    );
  }

  return status;
};

const validIsoDate = value => {
  if (typeof value !== 'string' || /^\d{4}-\d{2}-\d{2}$/.test(value) !== true) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) !== true &&
    date.toISOString().slice(0, 10) === value;
};

const validateStatus = (status, poets) => {
  if (status?.version !== 1 || Array.isArray(status.entries) !== true) {
    throw new Error('Salmonsen-status skal have version 1 og en entries-liste.');
  }

  const entries = new Map();
  let previousPoetId = null;

  for (const entry of status.entries) {
    const poetId = entry?.poet_id;
    if (typeof poetId !== 'string' || poetId.length === 0) {
      throw new Error('Alle Salmonsen-poster skal have et poet_id.');
    }
    if (entries.has(poetId)) {
      throw new Error(`Salmonsen-status har dublet for ${poetId}.`);
    }
    if (previousPoetId != null && previousPoetId.localeCompare(poetId) >= 0) {
      throw new Error('Salmonsen-posterne skal være sorteret efter poet_id.');
    }
    if (entry.status !== validStatus) {
      throw new Error(`Ugyldig Salmonsen-status for ${poetId}: ${entry.status}`);
    }
    if (
      Array.isArray(entry.editions_checked) !== true ||
      entry.editions_checked.length !== 2 ||
      entry.editions_checked[0] !== 2 ||
      entry.editions_checked[1] !== 4
    ) {
      throw new Error(
        `${poetId} skal være kontrolleret i Salmonsens 2. og 4. udgave.`
      );
    }
    if (validIsoDate(entry.checked_on) !== true) {
      throw new Error(`Ugyldig checked_on for ${poetId}.`);
    }
    if (typeof entry.note !== 'string' || entry.note.trim().length === 0) {
      throw new Error(`${poetId} skal have en note om det negative fund.`);
    }

    const poet = poets.get(poetId);
    if (poet == null) {
      throw new Error(`Ukendt digter-id i Salmonsen-status: ${poetId}`);
    }
    if (poet.type !== 'poet' || poet.country === 'dk') {
      throw new Error(
        `${poetId} er ikke en udenlandsk digter og må ikke stå i Salmonsen-status.`
      );
    }
    if (poet.hasBiography === true) {
      throw new Error(
        `${poetId} er markeret som ikke fundet, men har nu bio.xml.`
      );
    }

    entries.set(poetId, entry);
    previousPoetId = poetId;
  }

  return entries;
};

const comparePoets = (a, b) =>
  a.id.localeCompare(b.id) || a.name.localeCompare(b.name);

const buildReport = ({ poets, status }) => {
  const negativeEntries = validateStatus(status, poets);
  const foreignPoets = Array.from(poets.values())
    .filter(poet => poet.type === 'poet' && poet.country !== 'dk')
    .sort(comparePoets);

  return {
    withBiography: foreignPoets.filter(poet => poet.hasBiography === true),
    notFound: foreignPoets.filter(poet => negativeEntries.has(poet.id)),
    pending: foreignPoets.filter(
      poet =>
        poet.hasBiography !== true && negativeEntries.has(poet.id) !== true
    ),
  };
};

const formatPoet = poet => [poet.id, poet.name, poet.country].join('\t');

const parseArgs = args => {
  if (args.length === 0) {
    return { command: 'report' };
  }
  if (args.length === 1 && args[0] === '--check') {
    return { command: 'check' };
  }
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) {
    return { command: 'help' };
  }
  if (args.length === 2 && args[0] === '--next') {
    const count = Number(args[1]);
    if (Number.isInteger(count) === true && count > 0) {
      return { command: 'next', count };
    }
  }

  throw new Error('Ugyldige argumenter. Brug --help for hjælp.');
};

const usage = () => {
  console.log(
    'Brug: node tools/report-salmonsen-biographies.js [--check | --next ANTAL]'
  );
};

const printSummary = report => {
  console.log(`Udenlandske digtere med bio.xml: ${report.withBiography.length}`);
  console.log(`Ikke fundet i Salmonsen: ${report.notFound.length}`);
  console.log(`Resterende kandidater: ${report.pending.length}`);
};

const main = () => {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.command === 'help') {
      usage();
      return;
    }

    const rootDir = process.cwd();
    const poets = loadPoets(rootDir);
    const status = loadStatus(rootDir);
    const report = buildReport({ poets, status });

    if (args.command === 'check') {
      console.log(
        `Salmonsen-status er gyldig: ${report.notFound.length} negative fund.`
      );
      return;
    }
    if (args.command === 'next') {
      report.pending.slice(0, args.count).forEach(poet => {
        console.log(formatPoet(poet));
      });
      return;
    }

    printSummary(report);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
};

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}

export {
  buildReport,
  formatPoet,
  loadPoets,
  loadStatus,
  parseArgs,
  parsePerson,
  validIsoDate,
  validateStatus,
};
