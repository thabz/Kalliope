import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { formatMetadataXml } from './format-metadata-xml.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultSnapshot = path.join(root, 'docs/indsamling/wikidata/dfl-authorities.json');
const unique = values => [...new Set(values.filter(Boolean))].sort();

export const normalizeAuthorityBindings = (bindings, poets) => {
  const byDflId = new Map();
  bindings.forEach(binding => {
    const dflId = binding.dflId?.value;
    if (dflId == null) return;
    const values = byDflId.get(dflId) ?? { qids: [], viaf: [], gnd: [] };
    values.qids.push(binding.person?.value?.match(/Q\d+$/)?.[0]);
    values.viaf.push(binding.viaf?.value);
    values.gnd.push(binding.gnd?.value);
    byDflId.set(dflId, values);
  });
  return poets.flatMap(poet => {
    const values = byDflId.get(poet.dflId);
    if (values == null) return [];
    const qids = unique(values.qids);
    const viaf = unique(values.viaf);
    const gnd = unique(values.gnd);
    if (qids.length !== 1) throw new Error(`${poet.poetId}: forventede ét Wikidata-id, fandt ${qids.join(', ') || 'ingen'}`);
    return [{
      poetId: poet.poetId, dflId: poet.dflId, wikidata: qids[0],
      ...(viaf.length === 1 ? { viaf: viaf[0] } : {}),
      ...(gnd.length === 1 ? { gnd: gnd[0] } : {}),
      ...(viaf.length > 1 ? { ambiguousViaf: viaf } : {}),
      ...(gnd.length > 1 ? { ambiguousGnd: gnd } : {}),
    }];
  }).sort((a, b) => a.poetId.localeCompare(b.poetId, 'en'));
};

export const addAuthorityIdentifiers = (xml, record) => {
  const existingDflId = xml.match(/<danskforfatterleksikon-dk>([^<]+)<\/danskforfatterleksikon-dk>/)?.[1];
  if (existingDflId !== record.dflId) throw new Error(`${record.poetId}: DFL-id stemmer ikke`);
  let result = xml;
  const add = (name, value, beforePattern) => {
    if (value == null) return;
    const existing = result.match(new RegExp(`<${name}>([^<]+)<\\/${name}>`))?.[1];
    if (existing != null && existing !== value) throw new Error(`${record.poetId}: eksisterende ${name} stemmer ikke`);
    if (existing != null) return;
    const line = `    <${name}>${value}</${name}>\n`;
    result = beforePattern.test(result)
      ? result.replace(beforePattern, `${line}$&`)
      : result.replace(/  <\/identifiers>/, `${line}  </identifiers>`);
  };
  add('wikidata', record.wikidata, /^\s*<(?:wikipedia-|gravsted-dk|viaf|gnd|lex-dk|teaterleksikon-lex-dk|biografisk-leksikon-lex-dk|kvindebiografisk-leksikon-lex-dk|danskforfatterleksikon-dk|runeberg-org|gutenberg-org)>/m);
  add('viaf', record.viaf, /^\s*<(?:gnd|lex-dk|teaterleksikon-lex-dk|biografisk-leksikon-lex-dk|kvindebiografisk-leksikon-lex-dk|danskforfatterleksikon-dk|runeberg-org|gutenberg-org)>/m);
  add('gnd', record.gnd, /^\s*<(?:lex-dk|teaterleksikon-lex-dk|biografisk-leksikon-lex-dk|kvindebiografisk-leksikon-lex-dk|danskforfatterleksikon-dk|runeberg-org|gutenberg-org)>/m);
  return formatMetadataXml(result);
};

export const hiddenDflPoets = () => fs.readdirSync(path.join(root, 'fdirs'), { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .flatMap(entry => {
    const filename = path.join(root, 'fdirs', entry.name, 'info.xml');
    if (!fs.existsSync(filename)) return [];
    const xml = fs.readFileSync(filename, 'utf8');
    if (!/<person\b[^>]*\bhidden="true"/.test(xml)) return [];
    const dflId = xml.match(/<danskforfatterleksikon-dk>([^<]+)<\/danskforfatterleksikon-dk>/)?.[1];
    return dflId == null ? [] : [{ poetId: entry.name, dflId }];
  });

const argument = prefix => process.argv.find(value => value.startsWith(prefix))?.slice(prefix.length);
const main = () => {
  const raw = argument('--build-snapshot=');
  if (raw != null) {
    const bindings = JSON.parse(fs.readFileSync(raw, 'utf8')).results.bindings;
    const records = normalizeAuthorityBindings(bindings, hiddenDflPoets());
    const snapshot = {
      source: 'Wikidata Query Service', endpoint: 'https://query.wikidata.org/sparql',
      retrievedAt: '2026-08-29', identityBasis: 'Exact DFL identifier match through Wikidata property P12386',
      query: 'dfl-authorities-query.sparql',
      counts: {
        records: records.length, wikidata: records.length,
        viaf: records.filter(record => record.viaf != null).length,
        gnd: records.filter(record => record.gnd != null).length,
        ambiguousViaf: records.filter(record => record.ambiguousViaf != null).length,
        ambiguousGnd: records.filter(record => record.ambiguousGnd != null).length,
      },
      records,
    };
    fs.writeFileSync(defaultSnapshot, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(`Gemte ${records.length} autoritetsposter`);
    return;
  }
  const snapshot = JSON.parse(fs.readFileSync(argument('--snapshot=') ?? defaultSnapshot, 'utf8'));
  snapshot.records.forEach(record => {
    const filename = path.join(root, 'fdirs', record.poetId, 'info.xml');
    fs.writeFileSync(filename, addAuthorityIdentifiers(fs.readFileSync(filename, 'utf8'), record));
  });
  console.log(`Opdaterede ${snapshot.records.length} digtere: ${snapshot.counts.wikidata} Wikidata, ${snapshot.counts.viaf} VIAF og ${snapshot.counts.gnd} GND`);
};

if (process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1]) main();
