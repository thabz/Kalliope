import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { DOMParser, onWarningStopParsing } from '@xmldom/xmldom';

// Only files consumed by the build belong here. Retired formats must be migrated
// or removed rather than silently accepted as metadata.
export const poetMetadataRoots = new Map([
  ['info.xml', 'person'],
  ['bio.xml', 'bio'],
  ['events.xml', 'events'],
  ['portraits.xml', 'pictures'],
  ['artwork.xml', 'pictures'],
  ['bibliography-primary.xml', 'items'],
  ['bibliography-secondary.xml', 'items'],
]);

export const classifyPoetXml = (filename, xml) => {
  const root = new DOMParser({ onError: onWarningStopParsing })
    .parseFromString(xml, 'text/xml').documentElement;
  const basename = path.basename(filename);
  const poetId = path.basename(path.dirname(filename));
  const expectedRoot = poetMetadataRoots.get(basename);
  if (expectedRoot != null) {
    if (root.tagName !== expectedRoot) {
      throw new Error(`${filename}: forventede <${expectedRoot}>, fandt <${root.tagName}>.`);
    }
    return { kind: 'metadata' };
  }
  if (root.tagName !== 'kalliopework') {
    throw new Error(`${filename}: ukendt XML-fil uden en funktion i buildet (<${root.tagName}>).`);
  }
  const id = basename.slice(0, -4);
  if (root.getAttribute('id') !== id || root.getAttribute('author') !== poetId) {
    throw new Error(`${filename}: værkets id og author skal svare til filnavn og digtermappe.`);
  }
  let sortOrder = null;
  if (root.hasAttribute('sort-order')) {
    const value = root.getAttribute('sort-order');
    sortOrder = Number(value);
    if (/^[1-9]\d*$/.test(value) === false || Number.isSafeInteger(sortOrder) === false) {
      throw new Error(`${filename}: sort-order skal være et positivt, sikkert heltal.`);
    }
  }
  return { kind: 'work', id, sortOrder };
};

// A directory listing detects additions/deletions; stat signatures let unchanged
// XML reuse its classification without reading or parsing the file again.
export const discoverPoetFiles = (poetIds, {
  rootDir = '.',
  previous = null,
  readFile = fs.readFileSync,
} = {}) => {
  const previousFiles = previous?.version === 1 ? previous.files : {};
  const files = {};
  const workids = new Map();
  const changedPoetIds = new Set();
  for (const poetId of poetIds) {
    const directory = path.join(rootDir, 'fdirs', poetId);
    if (fs.existsSync(path.join(directory, 'info.xml')) === false) {
      throw new Error(`Missing info.xml in fdirs/${poetId}.`);
    }
    const works = [];
    const sortOrders = new Map();
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() === false || entry.name.endsWith('.xml') === false) {
        continue;
      }
      const relativeFilename = `fdirs/${poetId}/${entry.name}`;
      const filename = path.join(directory, entry.name);
      const stat = fs.statSync(filename);
      const signature = `${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}`;
      const cached = previousFiles[relativeFilename];
      let digest = cached?.digest;
      let classification = cached?.classification;
      if (cached?.signature !== signature || digest == null) {
        const xml = readFile(filename, 'utf8');
        digest = createHash('sha256').update(xml).digest('hex');
        if (digest !== cached?.digest) {
          classification = classifyPoetXml(relativeFilename, xml);
        }
      }
      files[relativeFilename] = { signature, digest, classification };
      if (classification.kind !== 'work') {
        continue;
      }
      if (cached?.digest !== digest) {
        changedPoetIds.add(poetId);
      }
      if (classification.sortOrder != null) {
        const other = sortOrders.get(classification.sortOrder);
        if (other != null) {
          throw new Error(`${relativeFilename}: sort-order ${classification.sortOrder} bruges også af ${other}.`);
        }
        sortOrders.set(classification.sortOrder, relativeFilename);
      }
      works.push(classification);
    }
    works.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder == null ? 1 : b.sortOrder == null ? -1 : a.sortOrder - b.sortOrder;
      }
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    workids.set(poetId, works.map(work => work.id));
    if (previous?.version !== 1) {
      changedPoetIds.add(poetId);
    }
  }
  for (const [filename, cached] of Object.entries(previousFiles)) {
    if (files[filename] == null && cached.classification.kind === 'work') {
      changedPoetIds.add(path.basename(path.dirname(filename)));
    }
  }
  return { workids, changedPoetIds, cache: { version: 1, files } };
};
