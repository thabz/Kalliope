#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const rawDir = join(root, 'raw');
const parsedDir = join(root, 'parsed');
const apiUrl = 'https://nordicwomensliterature.net/wp-json/nwl/v1/writers/da';
const indexUrl = 'https://nordicwomensliterature.net/da/writers/';
const offline = process.argv.includes('--offline');

async function getText(url, localName) {
  if (offline === true) {
    return readFile(join(rawDir, localName), 'utf8');
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  const text = await response.text();
  await writeFile(join(rawDir, localName), text);
  return text;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeText(value) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('da-DK');
}

function parseYear(value) {
  const year = Number.parseInt(value, 10);
  return Number.isInteger(year) ? year : null;
}

await mkdir(rawDir, { recursive: true });
await mkdir(parsedDir, { recursive: true });

const indexHtml = await getText(indexUrl, 'writers.html');
const apiText = await getText(apiUrl, 'writers-da.json');
const writers = JSON.parse(apiText);
const observations = writers.map((writer, index) => ({
  observation_id: `nwl-da-writer-${String(index + 1).padStart(4, '0')}`,
  source: 'nordisk-kvindelitteraturhistorie',
  source_id: writer.profile_url,
  url: writer.profile_url,
  raw: writer,
  normalized: {
    name: normalizeText(writer.name),
    country: writer.country == null || writer.country === '' ? null : normalizeText(writer.country),
    born: parseYear(writer.born),
    dead: parseYear(writer.dead),
    profile_url: writer.profile_url,
  },
  parser_status: 'parsed-index-observation',
  errors: [],
}));

await writeFile(join(parsedDir, 'observations.json'), `${JSON.stringify(observations, null, 2)}\n`);
const manifest = {
  source: 'nordisk-kvindelitteraturhistorie',
  status: 'snapshot',
  generatedAt: new Date().toISOString(),
  method: 'bounded fetch of the public Danish writer index and its JSON data endpoint',
  indexUrl,
  apiUrl,
  rawSnapshot: ['raw/writers.html', 'raw/writers-da.json'],
  parsedSnapshot: 'parsed/observations.json',
  fields: ['name', 'born', 'dead', 'country', 'profile_url', 'picture_url'],
  records: {
    observations: observations.length,
    missingCountry: observations.filter((observation) => observation.raw.country == null).length,
  },
  checksums: {
    'raw/writers.html': sha256(indexHtml),
    'raw/writers-da.json': sha256(apiText),
  },
  articleRelations: {
    status: 'not-in-writer-index',
    note: 'The writer endpoint exposes no article relation field.',
  },
};
await writeFile(join(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
