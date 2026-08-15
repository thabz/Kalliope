import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('../../../..', import.meta.url).pathname;
const docsDir = join(root, 'docs/indsamling/wikidata');
const rawFile = join(docsDir, 'wikidata.json');
const queryFile = join(docsDir, 'query.sparql');
const parsedFile = join(docsDir, 'observations.json');
const overlapFile = join(docsDir, 'overlap.json');
const manifestFile = join(docsDir, 'manifest.json');
const reportFile = join(root, 'docs/indsamling/rapporter/wikidata-overlap.md');
const endpoint = 'https://query.wikidata.org/sparql';
const queryVersion = '2026-08-08-danish-poet-public-domain-v5';
const fetchSnapshot = process.argv.includes('--fetch');
const limitArgument = process.argv.find(argument => argument.startsWith('--limit='));
const limit = limitArgument == null ? null : Number(limitArgument.slice('--limit='.length));
if (limit != null && (!Number.isInteger(limit) || limit < 1)) throw new Error('--limit skal være et positivt heltal.');

const sha256 = value => createHash('sha256').update(value).digest('hex');
const valueOf = binding => binding?.value ?? null;
const valuesOf = (binding, ...keys) => unique(keys.flatMap(key => (valueOf(binding[key]) ?? '').split('|')));
const qidOf = value => value?.match(/entity\/(Q\d+)$/)?.[1] ?? null;
const yearOf = value => value?.match(/(\d{4})/)?.[1] ?? null;
const normalizeName = value => (value ?? '').normalize('NFKC').replace(/[’'.,;:!?()[\]{}]/g, ' ').replace(/\s+/g, ' ').trim().toLocaleLowerCase('da-DK');
const unique = values => [...new Set(values.filter(value => value != null && value !== ''))];

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const readOptionalJson = async file => {
  try { return await readJson(file); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
};

const parseWikidataSnapshot = (snapshot, provenance) => {
  const groups = new Map();
  for (const binding of snapshot.results?.bindings ?? []) {
    const qid = qidOf(valueOf(binding.person));
    if (qid == null) continue;
    if (!groups.has(qid)) groups.set(qid, []);
    groups.get(qid).push(binding);
  }
  return [...groups.entries()].map(([qid, bindings], index) => {
    const first = bindings[0];
    const labels = unique(bindings.map(binding => valueOf(binding.personLabel)));
    const aliases = unique(bindings.flatMap(binding => valuesOf(binding, 'alias', 'aliases')));
    const birthDates = unique(bindings.map(binding => valueOf(binding.birth)));
    const deathDates = unique(bindings.map(binding => valueOf(binding.death)));
    const languages = unique(bindings.flatMap(binding => valuesOf(binding, 'language', 'languages')));
    const occupations = unique(bindings.flatMap(binding => valuesOf(binding, 'occupation', 'occupations')));
    const instances = unique(bindings.flatMap(binding => valuesOf(binding, 'instance', 'instances')));
    const works = unique(bindings.flatMap(binding => valuesOf(binding, 'work', 'works')));
    const dflIds = unique(bindings.flatMap(binding => valuesOf(binding, 'dflId', 'dflIds')));
    const viafIds = unique(bindings.flatMap(binding => valuesOf(binding, 'viaf', 'viafIds')));
    const gndIds = unique(bindings.flatMap(binding => valuesOf(binding, 'gnd', 'gndIds')));
    const preferred = labels[0] ?? qid;
    return {
      observationId: `wikidata:${qid}`,
      source: 'wikidata',
      sourceId: qid,
      sourceUrl: `https://www.wikidata.org/wiki/${qid}`,
      original: {
        labels,
        aliases,
        birthDates,
        deathDates,
        languages,
        occupationClaims: occupations,
        instanceClaims: instances,
        workClaims: works,
        externalIds: { dfl: dflIds, viaf: viafIds, gnd: gndIds },
        rawBindings: bindings,
      },
      normalized: {
        name: preferred,
        normalizedName: normalizeName(preferred),
        aliases: aliases.map(normalizeName).filter(Boolean),
        birthYear: yearOf(birthDates[0]),
        deathYear: yearOf(deathDates[0]),
        language: languages.includes('http://www.wikidata.org/entity/Q9035') ? 'da' : null,
        identifiers: { wikidata: qid, ...(dflIds[0] == null ? {} : { 'danskforfatterleksikon-dk': dflIds[0] }), ...(viafIds[0] == null ? {} : { viaf: viafIds[0] }), ...(gndIds[0] == null ? {} : { gnd: gndIds[0] }) },
        claims: { occupations, instances, works },
      },
      evidence: {
        poetrySignal: 'P106/P279* -> Q49757',
        languageSignal: languages.length === 0 ? 'not-returned' : languages,
        identityStatus: 'unmatched',
        qualifiersAndReferences: 'not present in SPARQL result; raw claim API enrichment is a separate future snapshot version',
      },
      provenance: {
        qid,
        url: `https://www.wikidata.org/wiki/${qid}`,
        endpoint: provenance.endpoint,
        retrievedAt: provenance.retrievedAt,
        queryVersion: provenance.queryVersion,
        querySha256: provenance.querySha256,
        snapshotSha256: provenance.snapshotSha256,
        rowCount: bindings.length,
      },
      parserStatus: first == null ? 'missing-row' : 'parsed-sparql-observation',
      errors: first == null ? ['missing-binding-row'] : [],
      sourceOrder: index,
    };
  });
};

const recordValues = record => ({
  ids: Object.values(record.identifiers ?? {}).filter(Boolean),
  names: unique([record.normalizedName, record.normalized?.normalizedName, record.name?.preferred, record.original?.name, ...(record.name?.alternatives ?? []), ...(record.normalized?.aliases ?? [])].map(value => normalizeName(value))),
  birthYear: record.birthYear ?? record.normalized?.birthYear ?? record.normalized?.born ?? record.page?.birthYear ?? null,
  deathYear: record.deathYear ?? record.normalized?.deathYear ?? record.normalized?.dead ?? record.page?.deathYear ?? null,
});

const crossReference = (observation, sources) => Object.entries(sources).map(([source, records]) => {
  if (records == null) return { source, status: 'source-not-collected', matches: [] };
  const matches = [];
  const wikidataIds = observation.normalized.identifiers;
  for (const record of records) {
    const values = recordValues(record);
    const idMatch = values.ids.some(id => id === observation.sourceId || id === wikidataIds['danskforfatterleksikon-dk'] || id === wikidataIds.viaf || id === wikidataIds.gnd);
    const nameMatch = values.names.includes(observation.normalized.normalizedName) || observation.normalized.aliases.some(alias => values.names.includes(alias));
    const dateConflict = (values.birthYear != null && observation.normalized.birthYear != null && values.birthYear !== observation.normalized.birthYear) || (values.deathYear != null && observation.normalized.deathYear != null && values.deathYear !== observation.normalized.deathYear);
    if (idMatch) matches.push({ sourceId: record.sourceId ?? record.source_id ?? record.observationId ?? null, status: dateConflict ? 'conflict' : 'strong-match', signals: ['stable-identifier', ...(dateConflict ? ['conflicting-life-date'] : [])] });
    else if (nameMatch) matches.push({ sourceId: record.sourceId ?? record.source_id ?? record.observationId ?? null, status: dateConflict ? 'conflict' : 'possible-name-match', signals: ['name-similarity', ...(dateConflict ? ['conflicting-life-date'] : [])] });
  }
  return { source, status: records == null ? 'source-not-collected' : matches.length === 0 ? 'no-match' : matches.some(match => match.status === 'strong-match') ? 'strong-match' : matches.some(match => match.status === 'conflict') ? 'conflict' : 'possible-match', matches: matches.slice(0, 20) };
});

const renderReport = ({ observations, references, sourceStatus, generatedAt }) => {
  const counts = status => references.flatMap(reference => reference.references).filter(item => item.status === status).length;
  return `# Wikidata-overlaprapport\n\nGenereret: ${generatedAt}\n\nWikidata-observationer: ${observations.length}\n\n## Kildestatus\n\n${sourceStatus.map(item => `- ${item.source}: ${item.status}`).join('\n')}\n\n## Krydsreferencer\n\n- Stærke matches via stabil identifikator: ${counts('strong-match')}\n- Mulige navnematches: ${counts('possible-name-match')}\n- Konflikter: ${counts('conflict')}\n- Ingen match: ${references.filter(reference => reference.status === 'no-match').length}\n\nNavnelighed alene danner ikke et sikkert match. Alle observationer bevares med Wikidata-Q-ID, rå bindinger og provenance.\n\n## Begrænsninger\n\n- Udvælgelsen er begrænset til danske digtere med en occupation-kæde til Q49757, en eksplicit dansk P1412-claim og enten dødsår <= 1955 eller ukendt dødsår samt fødselsår <= 1855.\n- SPARQL-snapshotet indeholder ikke Wikibase EntityData med qualifiers og references; rå bindinger bevares, og claim-API-berigelse må ske i en eksplicit ny snapshot-version.\n- Wikidata er en discovery-kilde og dokumenterer ikke alene optagelse i Kalliope.\n`;
};

const loadSourceRecords = async () => {
  const files = {
    kalliope: join(root, 'docs/indsamling/kalliope/observations.json'),
    danskforfatterleksikon: join(root, 'docs/indsamling/dfl/authors.json'),
    'dansk-biografisk-leksikon': join(root, 'docs/indsamling/dbl/observations.json'),
    'nordisk-kvindelitteraturhistorie': join(root, 'tools/data/indsamling/nordisk-kvindelitteraturhistorie/parsed/observations.json'),
    'dansk-kvindebiografisk-leksikon': join(root, 'docs/indsamling/kvindebiografisk/observations.json'),
  };
  const loaded = {};
  const status = [];
  for (const [source, file] of Object.entries(files)) {
    const data = await readOptionalJson(file);
    const records = Array.isArray(data) ? data : data?.observations;
    loaded[source] = records;
    status.push({ source, status: records == null ? 'source-not-collected' : 'loaded', records: records?.length ?? 0 });
  }
  return { loaded, status };
};

const query = await readFile(queryFile, 'utf8');
await mkdir(docsDir, { recursive: true });
let snapshot;
let retrievedAt;
if (fetchSnapshot === true) {
  let response;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    response = await fetch(`${endpoint}?query=${encodeURIComponent(query)}&format=json`, { headers: { Accept: 'application/sparql-results+json', 'User-Agent': 'Kalliope Wikidata candidate collector (issue 1461)' } });
    if (response.ok === true) break;
    if (response.status !== 504 || attempt === 3) throw new Error(`Wikidata svarede HTTP ${response.status}`);
    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
  }
  snapshot = await response.json();
  retrievedAt = new Date().toISOString();
  await writeFile(rawFile, `${JSON.stringify(snapshot, null, 2)}\n`);
} else {
  snapshot = await readJson(rawFile);
  const previous = await readOptionalJson(manifestFile);
  retrievedAt = previous?.retrievedAt ?? previous?.generatedAt ?? null;
}
const rawText = `${JSON.stringify(snapshot, null, 2)}\n`;
const provenance = { endpoint, retrievedAt, queryVersion, querySha256: sha256(query), snapshotSha256: sha256(rawText) };
const observations = parseWikidataSnapshot(snapshot, provenance).slice(0, limit ?? undefined);
const { loaded, status: sourceStatus } = await loadSourceRecords();
const references = observations.map(observation => ({ observationId: observation.observationId, qid: observation.sourceId, references: crossReference(observation, loaded) }));
const generatedAt = new Date().toISOString();
const manifest = { source: 'wikidata', status: 'snapshot', generatedAt, retrievedAt, limit, method: 'Bounded Wikidata SPARQL query; parser runs offline unless --fetch is supplied.', endpoint, queryVersion, querySource: 'docs/indsamling/wikidata/query.sparql', rawSnapshot: 'docs/indsamling/wikidata/wikidata.json', parsedSnapshot: 'docs/indsamling/wikidata/observations.json', overlapSnapshot: 'docs/indsamling/wikidata/overlap.json', report: 'docs/indsamling/rapporter/wikidata-overlap.md', records: { observations: observations.length, rawBindings: snapshot.results?.bindings?.length ?? 0, parserErrors: observations.filter(observation => observation.errors.length > 0).length }, checksums: { query: provenance.querySha256, rawSnapshot: provenance.snapshotSha256 }, limitations: ['SPARQL bindings preserve returned claim values but not Wikibase qualifiers/references.', 'Wikidata discovery scope is constrained to Danish poets who satisfy the death-year or old-birth-year rule.'] };
await writeFile(parsedFile, `${JSON.stringify({ generatedAt, provenance, observations }, null, 2)}\n`);
await writeFile(overlapFile, `${JSON.stringify({ generatedAt, sourceStatus, references }, null, 2)}\n`);
await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(reportFile, renderReport({ observations, references: references.map(reference => ({ ...reference, references: reference.references })), sourceStatus, generatedAt }));
console.log(JSON.stringify(manifest.records));

export { crossReference, normalizeName, parseWikidataSnapshot, renderReport };
