import crypto from 'crypto';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { formatMetadataXml } from './format-metadata-xml.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshotDir = path.join(root, 'docs', 'indsamling', 'dfl', 'livsdata');
const authorityFile = path.join(root, 'docs', 'indsamling', 'wikidata', 'dfl-authorities.json');
const resolutionFile = path.join(root, 'tools', 'data', 'indsamling', 'register', 'author-resolution.json');
const resolvedFile = path.join(snapshotDir, 'resolved.json');
const auditFile = path.join(snapshotDir, 'audit.json');
const reportFile = path.join(snapshotDir, 'report.md');
const targetsFile = path.join(snapshotDir, 'targets.json');
const baselineFile = path.join(snapshotDir, 'baseline.json');
const manifestFile = path.join(snapshotDir, 'manifest.json');
const sourcePriority = ['lex', 'gnd', 'viaf', 'wikidata', 'dfl'];
const normalizeName = value => value.normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const unique = values => [...new Set(values.filter(value => value != null && value !== ''))];
const escapeXml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const normalizePlace = value => value.normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();

export const isSafeNameMatch = (person, candidate) => {
  const personNames = unique([person.name, ...(person.alternativeNames ?? [])]).map(normalizeName);
  const candidateNames = unique([candidate.name, ...(candidate.alternativeNames ?? [])]).map(normalizeName);
  if (personNames.some(name => candidateNames.includes(name)) === false) return false;
  const sameBirthYear = person.birthYear != null && person.birthYear === candidate.birthYear;
  const sharedTitle = (person.workTitles ?? []).map(normalizeName).some(title => (candidate.workTitles ?? []).map(normalizeName).includes(title));
  const sharedAuthority = Object.entries(person.identifiers ?? {}).some(([key, value]) => value != null && candidate.identifiers?.[key] === value);
  const crossedAlternativeName = (person.alternativeNames ?? []).map(normalizeName).some(name => (candidate.alternativeNames ?? []).map(normalizeName).includes(name));
  return sameBirthYear || sharedTitle || sharedAuthority || crossedAlternativeName;
};
const sourceUrl = (source, id) => ({
  lex: id.startsWith('dbl:') ? `https://biografiskleksikon.lex.dk/${id.slice(4)}` : `https://lex.dk/${id}`,
  gnd: `https://d-nb.info/gnd/${id}`,
  viaf: `https://viaf.org/viaf/${id}`,
  wikidata: `https://www.wikidata.org/wiki/${id}`,
  dfl: `https://danskforfatterleksikon.dk/1850/${id}.htm`,
})[source];

const cacheFile = source => path.join(snapshotDir, 'raw', `${source}.json.gz`);
const writeCache = (source, records) => {
  const json = `${JSON.stringify({ source, records }, null, 2)}\n`;
  fs.mkdirSync(path.dirname(cacheFile(source)), { recursive: true });
  fs.writeFileSync(cacheFile(source), zlib.gzipSync(json, { level: 9 }));
};
const readCache = source => JSON.parse(zlib.gunzipSync(fs.readFileSync(cacheFile(source))));

const fetchText = async url => {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'Kalliope/1.0 (https://kalliope.org)' }, signal: AbortSignal.timeout(30000) });
      if (response.ok === false) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`${url}: ${lastError.message}`);
};

const mapLimit = async (values, limit, fn) => {
  const results = new Array(values.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(values[index], index);
    }
  });
  await Promise.all(workers);
  return results;
};

const cachedResponse = (url, retrievedAt, body) => ({ url, retrievedAt, sha256: sha256(body), body });
const fetchJsonRecords = async (source, ids, urlForId, concurrency = 8) => {
  const retrievedAt = new Date().toISOString();
  return mapLimit(ids, concurrency, async id => {
    const url = urlForId(id);
    try {
      const body = await fetchText(url);
      return { id, ...cachedResponse(url, retrievedAt, body) };
    } catch (error) {
      return { id, url, retrievedAt, error: error.message };
    }
  });
};

const claimValues = (entity, property) => (entity?.claims?.[property] ?? [])
  .filter(claim => claim.rank !== 'deprecated')
  .map(claim => claim.mainsnak?.datavalue?.value)
  .filter(value => value != null);
const stringClaims = (entity, property) => claimValues(entity, property).filter(value => typeof value === 'string');
const entityClaims = (entity, property) => claimValues(entity, property).map(value => value.id).filter(Boolean);
const timeClaims = (entity, property) => claimValues(entity, property).flatMap(value => {
  if (typeof value.time !== 'string' || value.time.startsWith('+') === false) return [];
  const match = /^\+(\d{4})-(\d{2})-(\d{2})T/.exec(value.time);
  if (match == null) return [];
  const date = value.precision >= 11 ? `${match[1]}-${match[2]}-${match[3]}` : value.precision === 10 ? `${match[1]}-${match[2]}` : match[1];
  return [{ value: date, raw: value }];
});
const preferredLabel = entity => entity?.labels?.da?.value ?? entity?.labels?.en?.value ?? Object.values(entity?.labels ?? {})[0]?.value;

const fetchWikidata = async qids => {
  const chunks = [];
  for (let index = 0; index < qids.length; index += 40) chunks.push(qids.slice(index, index + 40));
  const retrievedAt = new Date().toISOString();
  const personResponses = await mapLimit(chunks, 4, async ids => {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join('|')}&props=labels%7Cclaims&languages=da%7Cen&format=json`;
    const body = await fetchText(url);
    return cachedResponse(url, retrievedAt, body);
  });
  const people = Object.assign({}, ...personResponses.map(record => JSON.parse(record.body).entities));
  const placeIds = unique(Object.values(people).flatMap(entity => [...entityClaims(entity, 'P19'), ...entityClaims(entity, 'P20')]));
  const placeChunks = [];
  for (let index = 0; index < placeIds.length; index += 40) placeChunks.push(placeIds.slice(index, index + 40));
  const placeResponses = await mapLimit(placeChunks, 4, async ids => {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join('|')}&props=labels&languages=da%7Cen&format=json`;
    const body = await fetchText(url);
    return cachedResponse(url, retrievedAt, body);
  });
  return [...personResponses, ...placeResponses];
};

const wikidataEntities = cache => Object.assign({}, ...cache.records.map(record => JSON.parse(record.body).entities));
const observation = (source, sourceId, field, value, raw, placeId = null) => ({ source, sourceId, sourceUrl: sourceUrl(source, sourceId), field, value, raw, ...(placeId == null ? {} : { placeId }) });

const wikidataObservations = (authority, cache) => {
  const entities = wikidataEntities(cache);
  return authority.records.map(record => {
    const entity = entities[record.wikidata];
    const fields = [];
    timeClaims(entity, 'P569').forEach(item => fields.push(observation('wikidata', record.wikidata, 'birthDate', item.value, item.raw)));
    timeClaims(entity, 'P570').forEach(item => fields.push(observation('wikidata', record.wikidata, 'deathDate', item.value, item.raw)));
    entityClaims(entity, 'P19').forEach(id => fields.push(observation('wikidata', record.wikidata, 'birthPlace', preferredLabel(entities[id]), { entityId: id, label: preferredLabel(entities[id]) }, id)));
    entityClaims(entity, 'P20').forEach(id => fields.push(observation('wikidata', record.wikidata, 'deathPlace', preferredLabel(entities[id]), { entityId: id, label: preferredLabel(entities[id]) }, id)));
    return {
      poetId: record.poetId,
      identifiers: {
        wikidata: record.wikidata,
        viaf: record.viaf,
        gnd: record.gnd,
        lex: stringClaims(entity, 'P8313')[0],
        lexDbl: stringClaims(entity, 'P8341')[0],
      },
      fields,
    };
  });
};

const jsonBody = record => record?.body == null ? null : JSON.parse(record.body);
const strings = value => value == null ? [] : (Array.isArray(value) ? value : [value]).flatMap(item => typeof item === 'string' ? [item] : [item?.['@value'], item?.label, item?.preferredName, item?.name]).filter(Boolean);
const firstDate = values => strings(values).map(value => /(?:^|[^0-9])(\d{4}(?:-\d{2}(?:-\d{2})?)?)(?:[^0-9]|$)/.exec(value)?.[1]).find(Boolean);
const linkedDataObservations = (source, poetId, sourceId, data) => {
  if (data == null) return [];
  if (Array.isArray(data)) return data.flatMap(item => linkedDataObservations(source, poetId, sourceId, item));
  const valueBySuffix = suffix => Object.entries(data).filter(([key]) => key === suffix || key.endsWith(`#${suffix}`)).flatMap(([, value]) => value);
  const fields = [];
  const birthRaw = data.dateOfBirth ?? data.birthDate ?? data.birth ?? valueBySuffix('dateOfBirth');
  const deathRaw = data.dateOfDeath ?? data.deathDate ?? data.death ?? valueBySuffix('dateOfDeath');
  const birthPlaceRaw = data.placeOfBirth ?? data.birthPlace ?? valueBySuffix('placeOfBirth');
  const deathPlaceRaw = data.placeOfDeath ?? data.deathPlace ?? valueBySuffix('placeOfDeath');
  const birthDate = firstDate(birthRaw);
  const deathDate = firstDate(deathRaw);
  if (birthDate != null) fields.push(observation(source, sourceId, 'birthDate', birthDate, birthRaw));
  if (deathDate != null) fields.push(observation(source, sourceId, 'deathDate', deathDate, deathRaw));
  strings(birthPlaceRaw).forEach(value => fields.push(observation(source, sourceId, 'birthPlace', value, birthPlaceRaw)));
  strings(deathPlaceRaw).forEach(value => fields.push(observation(source, sourceId, 'deathPlace', value, deathPlaceRaw)));
  const nested = Object.values(data)
    .filter(value => value != null && typeof value === 'object')
    .flatMap(value => linkedDataObservations(source, poetId, sourceId, value));
  return [...fields, ...nested];
};

const jsonLdFromHtml = html => {
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return matches.flatMap(match => {
    try { return [JSON.parse(match[1])]; } catch { return []; }
  });
};
const lexObservations = (poetId, sourceId, html) => jsonLdFromHtml(html).flatMap(data => {
  const nodes = Array.isArray(data) ? data : (data['@graph'] ?? [data]);
  return nodes.flatMap(node => linkedDataObservations('lex', poetId, sourceId, node));
});

const dateCompatible = (a, b) => a === b || a.startsWith(`${b}-`) || b.startsWith(`${a}-`);
const resolveField = (field, observations) => {
  const usable = observations.filter(item => typeof item.value === 'string' && item.value.trim().length > 0);
  usable.sort((a, b) => sourcePriority.indexOf(a.source) - sourcePriority.indexOf(b.source) || b.value.length - a.value.length);
  if (usable.length === 0) return { selected: null, alternatives: [], conflict: false };
  const anchor = usable[0];
  const anchorEquivalent = item => field.endsWith('Date') ? dateCompatible(anchor.value, item.value) : (item.placeId != null && item.placeId === anchor.placeId) || normalizePlace(item.value) === normalizePlace(anchor.value);
  const selected = field.endsWith('Date')
    ? usable.filter(anchorEquivalent).sort((a, b) => b.value.length - a.value.length || sourcePriority.indexOf(a.source) - sourcePriority.indexOf(b.source))[0]
    : anchor;
  const equivalent = item => field.endsWith('Date') ? dateCompatible(selected.value, item.value) : (item.placeId != null && item.placeId === selected.placeId) || normalizePlace(item.value) === normalizePlace(selected.value);
  const alternatives = usable.slice(1).filter(item => equivalent(item) === false);
  return { selected, alternatives, conflict: alternatives.length > 0 };
};

const replacePeriod = (xml, fields, conflicts) => {
  const renderEvent = (name, dateField, placeField) => {
    const date = fields[dateField]?.selected?.value;
    const place = fields[placeField]?.selected?.value;
    if (date == null && place == null) return '';
    const eventConflicts = conflicts.filter(item => item.field === dateField || item.field === placeField);
    const comments = eventConflicts.map(item => `      <!-- Konflikt ${item.field}: ${item.alternatives.map(value => `${value.source}=${value.value}`).join('; ')} -->\n`).join('');
    return `    <${name}>\n${comments}${date == null ? '' : `      <date>${escapeXml(date)}</date>\n`}${place == null ? '' : `      <place>${escapeXml(place)}</place>\n`}    </${name}>\n`;
  };
  const period = `  <period>\n${renderEvent('born', 'birthDate', 'birthPlace')}${renderEvent('dead', 'deathDate', 'deathPlace')}  </period>\n`;
  if (period === '  <period>\n  </period>\n') return xml;
  if (/<period>[\s\S]*?<\/period>\s*/.test(xml)) return xml.replace(/  <period>[\s\S]*?<\/period>\s*/, period);
  return xml.replace(/  <\/name>\n/, `  </name>\n${period}`);
};

const addIdentifier = (xml, name, value) => {
  if (value == null || new RegExp(`<${name}>`).test(xml)) return xml;
  return xml.replace(/  <\/identifiers>/, `    <${name}>${escapeXml(value)}</${name}>\n  </identifiers>`);
};

const reorderIdentifiers = xml => xml.replace(/  <identifiers>\n([\s\S]*?)  <\/identifiers>/, (block, body) => {
  const order = ['wikidata', 'wikipedia-da', 'wikipedia-en', 'wikipedia-fr', 'wikipedia-de', 'gravsted-dk', 'viaf', 'gnd', 'lex-dk', 'teaterleksikon-lex-dk', 'biografisk-leksikon-lex-dk', 'kvindebiografisk-leksikon-lex-dk', 'danskforfatterleksikon-dk', 'runeberg-org', 'gutenberg-org'];
  const elements = [...body.matchAll(/^\s*<([a-z0-9-]+)>[^<]*<\/\1>\s*$/gm)].map(match => ({ name: match[1], xml: match[0].trim() }));
  elements.sort((a, b) => {
    const aIndex = order.indexOf(a.name);
    const bIndex = order.indexOf(b.name);
    return (aIndex < 0 ? order.length : aIndex) - (bIndex < 0 ? order.length : bIndex);
  });
  return `  <identifiers>\n${elements.map(element => `    ${element.xml}`).join('\n')}\n  </identifiers>`;
});

export const applyLifeDataToXml = (xml, record) => {
  let result = replacePeriod(xml, record.fields, record.conflicts);
  const fullname = result.match(/<fullname>([^<]+)<\/fullname>/)?.[1];
  const birthYear = record.fields.birthDate?.selected?.value?.slice(0, 4);
  if (fullname != null && birthYear != null && new RegExp(`, f\\.? ${birthYear}$`, 'i').test(fullname)) {
    result = result.replace(`<fullname>${fullname}</fullname>`, `<fullname>${fullname.replace(/, f\.? \d{4}$/i, '')}</fullname>`);
  }
  result = addIdentifier(result, 'wikidata', record.identifiers.wikidata);
  result = addIdentifier(result, 'viaf', record.identifiers.viaf);
  result = addIdentifier(result, 'gnd', record.identifiers.gnd);
  result = addIdentifier(result, 'lex-dk', record.identifiers.lex);
  result = addIdentifier(result, 'biografisk-leksikon-lex-dk', record.identifiers.lexDbl);
  return formatMetadataXml(reorderIdentifiers(result));
};

const buildSnapshots = () => {
  const authority = JSON.parse(fs.readFileSync(authorityFile));
  const resolution = JSON.parse(fs.readFileSync(resolutionFile));
  const dflById = new Map(resolution.records.filter(record => record.sourceId != null).map(record => [record.sourceId, record]));
  const targetPoetIds = new Set(JSON.parse(fs.readFileSync(targetsFile)).poetIds);
  const baselineByPoetId = new Map(JSON.parse(fs.readFileSync(baselineFile)).records.map(record => [record.poetId, record]));
  const wdByPoetId = new Map(wikidataObservations(authority, readCache('wikidata')).map(record => [record.poetId, record]));
  const viafCache = new Map(readCache('viaf').records.map(record => [record.id, record]));
  const gndCache = new Map(readCache('gnd').records.map(record => [record.id, record]));
  const lexCache = new Map(readCache('lex').records.map(record => [record.id, record]));
  const hiddenPoets = fs.readdirSync(path.join(root, 'fdirs'), { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() === false || targetPoetIds.has(entry.name) === false) return [];
    const infoFile = path.join(root, 'fdirs', entry.name, 'info.xml');
    if (fs.existsSync(infoFile) === false) return [];
    const xml = fs.readFileSync(infoFile, 'utf8');
    if (/<person\b[^>]*\bhidden="true"/.test(xml) === false) return [];
    const dflId = xml.match(/<danskforfatterleksikon-dk>([^<]+)<\/danskforfatterleksikon-dk>/)?.[1];
    return dflId == null ? [] : [{ poetId: entry.name, dflId }];
  }).sort((a, b) => a.poetId.localeCompare(b.poetId, 'en'));
  const records = hiddenPoets.map(poet => {
    const record = wdByPoetId.get(poet.poetId) ?? { poetId: poet.poetId, identifiers: {}, fields: [] };
    const dfl = dflById.get(poet.dflId);
    const observations = [...record.fields];
    const baseline = baselineByPoetId.get(poet.poetId);
    ['birthDate', 'deathDate', 'birthPlace', 'deathPlace'].forEach(field => {
      if (baseline?.[field] != null) observations.push(observation('dfl', poet.dflId, field, baseline[field], { basis: 'imported-xml', value: baseline[field] }));
    });
    const viafRaw = viafCache.get(record.identifiers.viaf);
    observations.push(...linkedDataObservations('viaf', record.poetId, record.identifiers.viaf, jsonBody(viafRaw)));
    const gndRaw = gndCache.get(record.identifiers.gnd);
    observations.push(...linkedDataObservations('gnd', record.poetId, record.identifiers.gnd, jsonBody(gndRaw)));
    [record.identifiers.lex == null ? null : record.identifiers.lex, record.identifiers.lexDbl == null ? null : `dbl:${record.identifiers.lexDbl}`].filter(Boolean).forEach(id => {
      const raw = lexCache.get(id);
      if (raw?.body != null) observations.push(...lexObservations(record.poetId, id, raw.body));
    });
    if (dfl?.page?.birthYear != null) observations.push(observation('dfl', poet.dflId, 'birthDate', dfl.page.birthYear, { basis: 'author-page', value: dfl.page.birthYear }));
    if (dfl?.page?.deathYear != null) observations.push(observation('dfl', poet.dflId, 'deathDate', dfl.page.deathYear, { basis: 'author-page', value: dfl.page.deathYear }));
    (dfl?.names ?? []).forEach(name => {
      const year = /,\s*f\.?\s*(\d{4})\s*$/i.exec(name)?.[1];
      if (year != null) observations.push(observation('dfl', poet.dflId, 'birthDate', year, { basis: 'terminal-name-year', value: name }));
    });
    const idYear = /f(\d{4})$/i.exec(poet.dflId)?.[1];
    if (idYear != null) observations.push(observation('dfl', poet.dflId, 'birthDate', idYear, { basis: 'unique-dfl-id-year', value: poet.dflId }));
    const fields = Object.fromEntries(['birthDate', 'deathDate', 'birthPlace', 'deathPlace'].map(field => [field, resolveField(field, observations.filter(item => item.field === field))]));
    const conflicts = Object.entries(fields).filter(([, value]) => value.conflict).map(([field, value]) => ({ field, selected: value.selected, alternatives: value.alternatives }));
    const infoFile = path.join(root, 'fdirs', record.poetId, 'info.xml');
    const originalFullname = baseline?.fullname ?? fs.readFileSync(infoFile, 'utf8').match(/<fullname>([^<]+)<\/fullname>/)?.[1] ?? null;
    return { poetId: record.poetId, dflId: poet.dflId, originalFullname, identifiers: { ...(baseline?.identifiers ?? {}), ...record.identifiers }, fields, conflicts, observations };
  });
  const counts = {};
  sourcePriority.forEach(source => {
    counts[source] = Object.fromEntries(['birthDate', 'deathDate', 'birthPlace', 'deathPlace'].map(field => [field, records.filter(record => record.fields[field].selected?.source === source).length]));
  });
  const unresolved = records.filter(record => Object.values(record.fields).every(field => field.selected == null)).map(record => record.poetId);
  const caches = ['wikidata', 'viaf', 'gnd', 'lex'].map(source => {
    const cache = readCache(source);
    const compressed = fs.readFileSync(cacheFile(source));
    return {
      source,
      file: path.relative(root, cacheFile(source)),
      sha256: sha256(compressed),
      records: cache.records.length,
      successful: cache.records.filter(record => record.body != null).length,
      errors: cache.records.filter(record => record.error != null).length,
      retrievedAt: cache.records.map(record => record.retrievedAt).filter(Boolean).sort().at(-1) ?? null,
    };
  });
  const generatedAt = caches.map(cache => cache.retrievedAt).filter(Boolean).sort().at(-1);
  const resolvedRecords = records.map(record => ({
    poetId: record.poetId,
    dflId: record.dflId,
    originalFullname: record.originalFullname,
    identifiers: record.identifiers,
    fields: record.fields,
    conflicts: record.conflicts,
  }));
  fs.writeFileSync(resolvedFile, `${JSON.stringify({ generatedAt, sourcePriority, counts, records: resolvedRecords }, null, 2)}\n`);
  fs.writeFileSync(auditFile, `${JSON.stringify({ generatedAt, sourcePriority, counts, unresolved, conflicts: records.filter(record => record.conflicts.length > 0).map(record => ({ poetId: record.poetId, conflicts: record.conflicts })), records }, null, 2)}\n`);
  fs.writeFileSync(manifestFile, `${JSON.stringify({ generatedAt, mode: 'Offline by default; only --fetch performs network requests.', sourcePriority, targets: records.length, caches }, null, 2)}\n`);
  const lines = sourcePriority.map(source => `| ${source} | ${counts[source].birthDate} | ${counts[source].deathDate} | ${counts[source].birthPlace} | ${counts[source].deathPlace} |`);
  const identifierCounts = ['lex', 'lexDbl', 'gnd', 'viaf', 'wikidata'].map(identifier => `- ${identifier}: ${records.filter(record => record.identifiers[identifier] != null).length}`).join('\n');
  const nameYears = records.filter(record => record.observations.some(item => item.raw?.basis === 'terminal-name-year')).length;
  const idOnlyYears = records.filter(record => record.observations.some(item => item.raw?.basis === 'unique-dfl-id-year') && record.observations.some(item => item.raw?.basis === 'terminal-name-year') === false).length;
  const cacheLines = caches.map(cache => `| ${cache.source} | ${cache.records} | ${cache.successful} | ${cache.errors} | \`${cache.sha256}\` |`);
  const conflictLines = records.filter(record => record.conflicts.length > 0).map(record => `- \`${record.poetId}\`: ${record.conflicts.map(conflict => `${conflict.field}: ${conflict.selected.source}=${conflict.selected.value}; alternativer ${conflict.alternatives.map(item => `${item.source}=${item.value}`).join(', ')}`).join(' / ')}`);
  const unresolvedLines = unresolved.map(poetId => {
    const record = records.find(item => item.poetId === poetId);
    return `- \`${poetId}\` (${record.originalFullname ?? record.dflId})`;
  });
  fs.writeFileSync(reportFile, `# Berigelse af skjulte DFL-digtere\n\nSnapshot-tid: ${generatedAt}\n\nKildeprioritet: Lex → GND → VIAF → Wikidata → DFL.\n\n| Kilde | Fødselsdato | Dødsdato | Fødested | Dødssted |\n| --- | ---: | ---: | ---: | ---: |\n${lines.join('\n')}\n\n## Autoritets-id’er\n\n${identifierCounts}\n- danskforfatterleksikon-dk: ${records.length}\n\n## DFL-år\n\n- Eksplicit terminalt fødselsår i navn: ${nameYears}\n- Yderligere fødselsår fra entydigt \`fYYYY\`-id: ${idOnlyYears}\n\n## Rå cache\n\n| Kilde | Svar | Vellykkede | Fejl | SHA-256 |\n| --- | ---: | ---: | ---: | --- |\n${cacheLines.join('\n')}\n\n## Status\n\n- Poster: ${records.length}\n- Konflikter: ${conflictLines.length}\n- Poster uden livsdata: ${unresolved.length}\n\n## Konflikter\n\n${conflictLines.join('\n')}\n\n## Poster uden livsdata\n\n${unresolvedLines.join('\n')}\n`);
  return { records, counts, unresolved };
};

const fetchSources = async () => {
  const authority = JSON.parse(fs.readFileSync(authorityFile));
  const qids = authority.records.map(record => record.wikidata);
  if (fs.existsSync(cacheFile('wikidata')) === false) writeCache('wikidata', await fetchWikidata(qids));
  const wd = wikidataObservations(authority, readCache('wikidata'));
  const viafIds = unique(wd.map(record => record.identifiers.viaf));
  const gndIds = unique(wd.map(record => record.identifiers.gnd));
  const lexIds = unique(wd.flatMap(record => [record.identifiers.lex, record.identifiers.lexDbl == null ? null : `dbl:${record.identifiers.lexDbl}`]));
  if (fs.existsSync(cacheFile('viaf')) === false) writeCache('viaf', await fetchJsonRecords('viaf', viafIds, id => `https://viaf.org/viaf/${id}/viaf.json`));
  if (fs.existsSync(cacheFile('gnd')) === false) writeCache('gnd', await fetchJsonRecords('gnd', gndIds, id => `https://d-nb.info/gnd/${id}/about/lds.jsonld`));
  if (fs.existsSync(cacheFile('lex')) === false) writeCache('lex', await fetchJsonRecords('lex', lexIds, id => sourceUrl('lex', id), 6));
};

const trimAuthorityCaches = () => {
  const authority = JSON.parse(fs.readFileSync(authorityFile));
  const allowed = {
    viaf: new Set(authority.records.map(record => record.viaf).filter(Boolean)),
    gnd: new Set(authority.records.map(record => record.gnd).filter(Boolean)),
  };
  ['viaf', 'gnd'].forEach(source => {
    if (fs.existsSync(cacheFile(source)) === false) return;
    const cache = readCache(source);
    const records = cache.records.filter(record => allowed[source].has(record.id));
    if (records.length !== cache.records.length) writeCache(source, records);
  });
};

export const applySnapshot = (filename = resolvedFile) => {
  const snapshot = JSON.parse(fs.readFileSync(filename));
  let changed = 0;
  snapshot.records.forEach(record => {
    const infoFile = path.join(root, 'fdirs', record.poetId, 'info.xml');
    const xml = fs.readFileSync(infoFile, 'utf8');
    const enriched = applyLifeDataToXml(xml, record);
    if (xml === enriched) return;
    fs.writeFileSync(infoFile, enriched);
    changed += 1;
  });
  return changed;
};

const main = async () => {
  fs.mkdirSync(snapshotDir, { recursive: true });
  if (process.argv.includes('--build-targets')) {
    const files = execFileSync('git', ['diff', '--name-only', '--diff-filter=A', 'origin/master...HEAD', '--', 'fdirs/dfl-*/info.xml'], { cwd: root, encoding: 'utf8' });
    const poetIds = files.trim().split('\n').filter(Boolean).map(filename => filename.split('/')[1]).sort();
    fs.writeFileSync(targetsFile, `${JSON.stringify({ basis: 'info.xml files added by this branch relative to origin/master', records: poetIds.length, poetIds }, null, 2)}\n`);
    const baselineRecords = poetIds.map(poetId => {
      const xml = execFileSync('git', ['show', `HEAD:fdirs/${poetId}/info.xml`], { cwd: root, encoding: 'utf8' });
      const eventValue = (event, element) => new RegExp(`<${event}>[\\s\\S]*?<${element}(?: [^>]*)?>([^<]+)<\\/${element}>`).exec(xml)?.[1] ?? null;
      const identifiers = Object.fromEntries([...xml.matchAll(/<(wikidata|viaf|gnd|lex-dk|biografisk-leksikon-lex-dk|danskforfatterleksikon-dk)>([^<]+)<\/\1>/g)].map(match => [({ 'lex-dk': 'lex', 'biografisk-leksikon-lex-dk': 'lexDbl' }[match[1]] ?? match[1]), match[2]]));
      return {
        poetId,
        fullname: xml.match(/<fullname>([^<]+)<\/fullname>/)?.[1] ?? null,
        birthDate: eventValue('born', 'date'),
        deathDate: eventValue('dead', 'date'),
        birthPlace: eventValue('born', 'place'),
        deathPlace: eventValue('dead', 'place'),
        identifiers,
      };
    });
    fs.writeFileSync(baselineFile, `${JSON.stringify({ basis: 'Branch XML before life-data enrichment', count: baselineRecords.length, records: baselineRecords }, null, 2)}\n`);
  }
  if (fs.existsSync(targetsFile) === false) throw new Error(`Mangler målmanifest: ${targetsFile}. Brug --build-targets én gang.`);
  if (fs.existsSync(baselineFile) === false) throw new Error(`Mangler baseline: ${baselineFile}. Brug --build-targets én gang.`);
  if (process.argv.includes('--fetch')) await fetchSources();
  trimAuthorityCaches();
  ['wikidata', 'viaf', 'gnd', 'lex'].forEach(source => {
    if (fs.existsSync(cacheFile(source)) === false) throw new Error(`Mangler cache: ${cacheFile(source)}. Brug --fetch.`);
  });
  const snapshot = buildSnapshots();
  const changed = applySnapshot();
  console.log(JSON.stringify({ records: snapshot.records.length, changed, counts: snapshot.counts, unresolved: snapshot.unresolved.length }));
};

if (process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { dateCompatible, resolveField };
