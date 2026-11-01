import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { DOMParser, XMLSerializer, onWarningStopParsing } from '@xmldom/xmldom';

export const parseXml = xml => new DOMParser({ onError: onWarningStopParsing })
  .parseFromString(xml, 'application/xml');
const elements = (node, tag) => Array.from(node.getElementsByTagName(tag));
const readJson = filename => JSON.parse(fs.readFileSync(filename, 'utf8'));
const serialize = node => new XMLSerializer().serializeToString(node);
const normalize = value => value.normalize('NFKC').toLocaleLowerCase('da').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
// Strip editorial wrappers through the DOM so nested typography survives.
export const stripWishMarkers = xml => {
  if (xml.includes('data-wish') === false) return xml;
  const doc = parseXml(`<body>${xml}</body>`);
  for (const marker of elements(doc, 'span').filter(node => node.hasAttribute('data-wish'))) {
    while (marker.firstChild != null) marker.parentNode.insertBefore(marker.firstChild, marker);
    marker.parentNode.removeChild(marker);
  }
  return Array.from(doc.documentElement.childNodes).map(serialize).join('');
};

export const sourceIds = ['dbl1', 'dbl2', 'salmonsen2', 'salmonsen-supplement', 'salmonsen4', 'erslew', 'ehrencron-mueller'];
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isNaN(Date.parse(value)) === false && new Date(value).toISOString().slice(0, 10) === value;
export const hasBiography = doc => doc != null && elements(doc, 'biography')
  .some(entry => entry.getAttribute('hidden') !== 'true' &&
    elements(entry, 'body').some(body => body.textContent.trim().length > 0));

// Source XML is required here: negative research evidence and wish markers are
// deliberately editorial data, not fields in the public bulk dataset.
export const loadPeople = root => fs.readdirSync(path.join(root, 'fdirs'), { withFileTypes: true })
  .filter(entry => entry.isDirectory() === true && fs.existsSync(path.join(root, 'fdirs', entry.name, 'info.xml')))
  .map(entry => {
    const filename = `fdirs/${entry.name}/bio.xml`;
    return { id: entry.name,
      info: parseXml(fs.readFileSync(path.join(root, 'fdirs', entry.name, 'info.xml'), 'utf8')),
      filename,
      bio: fs.existsSync(path.join(root, filename)) ? parseXml(fs.readFileSync(path.join(root, filename), 'utf8')) : null };
  });

export const checkCoverage = (people, baseline) => {
  const errors = [];
  const remaining = [];
  const ids = new Set(people.map(person => person.id));
  if (new Set(baseline).size !== baseline.length) errors.push('Gentaget biografirestance');
  for (const id of baseline) if (ids.has(id) === false) errors.push(`Ukendt biografirestance: ${id}`);
  for (const person of people) {
    if (person.info.documentElement.getAttribute('type') === 'collection') continue;
    const statuses = elements(person.info, 'biography-status');
    const status = statuses[0];
    const hasBio = hasBiography(person.bio);
    if (statuses.length > 1) errors.push(`${person.id}: gentaget biography-status`);
    if (status != null) {
      const sources = elements(status, 'checked-source').map(source => source.getAttribute('id'));
      if (status.getAttribute('status') !== 'not-found' || validDate(status.getAttribute('checked-on')) !== true ||
        sources.length === 0 || sources.some(id => sourceIds.includes(id) === false) ||
        elements(status, 'note').some(note => note.textContent.trim().length > 0) !== true) {
        errors.push(`${person.id}: ugyldig biography-status`);
      }
      if (hasBio === true) errors.push(`${person.id}: biografi og negativ status findes samtidig`);
    }
    if (hasBio === false && status == null) {
      if (baseline.includes(person.id) === true) remaining.push(person.id);
      else errors.push(`${person.id}: mangler biografi eller dokumenteret negativ søgning`);
    } else if (baseline.includes(person.id) === true) errors.push(`${person.id}: fjern afsluttet biografirestance`);
  }
  return { errors, remaining };
};

export async function readTexts(root) {
  const records = [];
  const filename = path.join(root, 'public/api/v1/texts.jsonl.gz');
  const input = fs.createReadStream(filename);
  const gzip = createGunzip();
  input.on('error', error => gzip.destroy(error));
  const lines = createInterface({ input: input.pipe(gzip), crlfDelay: Infinity });
  for await (const line of lines) {
    if (line.trim().length === 0) continue;
    const record = JSON.parse(line);
    // Discard full text and other large payloads while streaming.
    records.push({ id: record.id, poet_id: record.poet_id, title: record.title, firstline: record.firstline });
  }
  return records;
}

export const checkWishes = (people, registry, texts) => {
  const errors = [];
  if (registry.version !== 1 || Array.isArray(registry.entries) !== true) {
    return { errors: ['Ugyldigt ønskeregister: forventede version 1 og entries'], candidates: [] };
  }
  const candidates = [];
  const byId = new Map();
  const textById = new Map(texts.map(text => [text.id, text]));
  for (const wish of registry.entries) {
    if (typeof wish.id !== 'string' || /^[a-z0-9][a-z0-9-]*$/.test(wish.id) !== true || byId.has(wish.id) === true) errors.push(`Ugyldigt eller gentaget ønske-id: ${wish.id}`);
    byId.set(wish.id, wish);
    if (typeof wish.title !== 'string' || wish.title.trim().length === 0 ||
      typeof wish.poetId !== 'string' || people.some(person => person.id === wish.poetId) !== true ||
      Array.isArray(wish.mentions) !== true || wish.mentions.length === 0 ||
      typeof wish.source !== 'string' || wish.source.trim().length === 0 ||
      ['open', 'fulfilled'].includes(wish.status) !== true) errors.push(`${wish.id}: ufuldstændigt ønske`);
    if (wish.targetId != null) {
      const target = textById.get(wish.targetId);
      if (target == null || target.poet_id !== wish.poetId) errors.push(`${wish.id}: manglende mål eller forkert forfatter`);
    } else if (wish.status === 'fulfilled') errors.push(`${wish.id}: opfyldt ønske uden mål`);
    if (wish.status === 'open') {
      const titles = [wish.title, ...(wish.aliases ?? [])].map(normalize);
      candidates.push({ id: wish.id, targetId: wish.targetId ?? null,
        candidates: texts.filter(text => text.poet_id === wish.poetId &&
          (titles.includes(normalize(text.title ?? '')) ||
            (wish.firstline != null && normalize(text.firstline ?? '') === normalize(wish.firstline))))
          .map(text => text.id) });
    }
  }
  for (const person of people) {
    if (person.bio == null) continue;
    for (const marker of elements(person.bio, 'span').filter(span => span.hasAttribute('data-wish'))) {
      const id = marker.getAttribute('data-wish');
      const wish = byId.get(id);
      const mention = wish?.mentions?.find(item => item.file === person.filename && item.text === marker.textContent);
      if (wish == null || mention == null || wish.status !== 'open') errors.push(`${person.filename}: ukendt/afsluttet ønske eller forkert omtale ${id}`);
      if (elements(marker, 'a').length > 0 || elements(marker, 'span').some(span => span.hasAttribute('data-wish'))) errors.push(`${id}: indlejrede ønskemarkører/links er ikke tilladt`);
    }
  }
  for (const wish of registry.entries) {
    for (const mention of wish.mentions ?? []) {
      const person = people.find(item => item.filename === mention.file);
      const matches = person?.bio == null ? [] : elements(person.bio, wish.status === 'fulfilled' ? 'a' : 'span')
        .filter(node => node.getAttribute(wish.status === 'fulfilled' ? 'poem' : 'data-wish') ===
          (wish.status === 'fulfilled' ? wish.targetId : wish.id) && node.textContent === mention.text);
      if (matches.length === 0) errors.push(`${wish.id}: omtalen findes ikke: ${mention.file}`);
    }
  }
  return { errors, candidates };
};

export const reconcileWishes = (people, registry) => {
  const changes = new Map();
  for (const wish of registry.entries) {
    if (wish.status !== 'open' || wish.targetId == null) continue;
    for (const person of people) {
      if (person.bio == null) continue;
      for (const marker of elements(person.bio, 'span').filter(node => node.getAttribute('data-wish') === wish.id)) {
        const link = person.bio.createElement('a');
        link.setAttribute('poem', wish.targetId);
        while (marker.firstChild != null) link.appendChild(marker.firstChild);
        marker.parentNode.replaceChild(link, marker);
        changes.set(person.filename, serialize(person.bio));
      }
    }
    wish.status = 'fulfilled';
  }
  return changes;
};

const main = async () => {
  const args = process.argv.slice(2);
  if (args.some(arg => ['--check', '--reconcile', '--prune'].includes(arg) === false) || args.length > 1) throw new Error('Brug: person-editorial [--check|--reconcile|--prune]');
  const root = process.cwd();
  const people = loadPeople(root);
  const baselineFile = path.join(root, 'tools/data/biography-backlog.json');
  const baseline = readJson(baselineFile);
  if (args.includes('--prune') === true) {
    const remaining = baseline.filter(id => people.some(person => person.id === id && hasBiography(person.bio) === false && elements(person.info, 'biography-status').length === 0));
    fs.writeFileSync(baselineFile, `${JSON.stringify(remaining, null, 2)}\n`);
    return;
  }
  const registryFile = path.join(root, 'tools/data/wanted-texts.json');
  const registry = readJson(registryFile);
  const coverage = checkCoverage(people, baseline);
  const wishes = checkWishes(people, registry, registry.entries.length === 0 ? [] : await readTexts(root));
  const errors = [...coverage.errors, ...wishes.errors];
  console.log(JSON.stringify({ biographyBacklog: coverage.remaining, wishes: wishes.candidates, errors }, null, 2));
  if (errors.length > 0) { process.exitCode = 1; return; }
  if (args.includes('--reconcile') === true) {
    const changes = reconcileWishes(people, registry);
    for (const [filename, xml] of changes) fs.writeFileSync(path.join(root, filename), xml);
    fs.writeFileSync(registryFile, `${JSON.stringify(registry, null, 2)}\n`);
  }
};
if (process.argv[1] != null && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
