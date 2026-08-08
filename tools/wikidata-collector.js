const normalizeName = value => (value ?? '').normalize('NFKC').replace(/[’'.,;:!?()[\]{}]/g, ' ').replace(/\s+/g, ' ').trim().toLocaleLowerCase('da-DK');
const valueOf = binding => binding?.value ?? null;
const valuesOf = (binding, ...keys) => unique(keys.flatMap(key => (valueOf(binding[key]) ?? '').split('|')));
const qidOf = value => value?.match(/entity\/(Q\d+)$/)?.[1] ?? null;
const yearOf = value => value?.match(/(\d{4})/)?.[1] ?? null;
const unique = values => [...new Set(values.filter(value => value != null && value !== ''))];

const parseWikidataSnapshot = (snapshot, provenance) => {
  const groups = new Map();
  for (const binding of snapshot.results?.bindings ?? []) {
    const qid = qidOf(valueOf(binding.person));
    if (qid == null) continue;
    if (!groups.has(qid)) groups.set(qid, []);
    groups.get(qid).push(binding);
  }
  return [...groups.entries()].map(([qid, bindings]) => {
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
    const preferred = labels[0] ?? qid;
    return {
      observationId: `wikidata:${qid}`, source: 'wikidata', sourceId: qid, sourceUrl: `https://www.wikidata.org/wiki/${qid}`,
      original: { labels, aliases, birthDates, deathDates, languages, occupationClaims: occupations, instanceClaims: instances, workClaims: works, externalIds: { dfl: dflIds, viaf: viafIds }, rawBindings: bindings },
      normalized: { name: preferred, normalizedName: normalizeName(preferred), aliases: aliases.map(normalizeName).filter(Boolean), birthYear: yearOf(birthDates[0]), deathYear: yearOf(deathDates[0]), language: languages.includes('http://www.wikidata.org/entity/Q9035') ? 'da' : null, identifiers: { wikidata: qid, ...(dflIds[0] == null ? {} : { 'danskforfatterleksikon-dk': dflIds[0] }), ...(viafIds[0] == null ? {} : { viaf: viafIds[0] }) }, claims: { occupations, instances, works } },
      evidence: { poetrySignal: 'P106/P279* -> Q49757', languageSignal: languages.length === 0 ? 'not-returned' : languages, identityStatus: 'unmatched', qualifiersAndReferences: 'not present in SPARQL result' },
      provenance: { ...provenance, qid, url: `https://www.wikidata.org/wiki/${qid}`, rowCount: bindings.length },
      parserStatus: 'parsed-sparql-observation', errors: [],
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
  for (const record of records) {
    const values = recordValues(record);
    const idMatch = values.ids.some(id => id === observation.sourceId || id === observation.normalized.identifiers['danskforfatterleksikon-dk'] || id === observation.normalized.identifiers.viaf);
    const nameMatch = values.names.includes(observation.normalized.normalizedName) || observation.normalized.aliases.some(alias => values.names.includes(alias));
    const dateConflict = (values.birthYear != null && observation.normalized.birthYear != null && values.birthYear !== observation.normalized.birthYear) || (values.deathYear != null && observation.normalized.deathYear != null && values.deathYear !== observation.normalized.deathYear);
    if (idMatch) matches.push({ sourceId: record.sourceId ?? record.source_id ?? record.observationId ?? null, status: dateConflict ? 'conflict' : 'strong-match', signals: ['stable-identifier', ...(dateConflict ? ['conflicting-life-date'] : [])] });
    else if (nameMatch) matches.push({ sourceId: record.sourceId ?? record.source_id ?? record.observationId ?? null, status: dateConflict ? 'conflict' : 'possible-name-match', signals: ['name-similarity', ...(dateConflict ? ['conflicting-life-date'] : [])] });
  }
  return { source, status: matches.length === 0 ? 'no-match' : matches.some(match => match.status === 'strong-match') ? 'strong-match' : matches.some(match => match.status === 'conflict') ? 'conflict' : 'possible-match', matches: matches.slice(0, 20) };
});

export { crossReference, normalizeName, parseWikidataSnapshot };
