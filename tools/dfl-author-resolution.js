const normalizeName = value => (value ?? '').normalize('NFKC').replace(/[’'.,;:!?()[\]{}]/g, ' ').replace(/\s+/g, ' ').trim().toLocaleLowerCase('da-DK');

const nameForms = person => [person.normalizedName, ...(person.name?.alternatives ?? []).map(normalizeName)].filter(Boolean);

const resolveDflAuthors = ({ authorAudit, authorPageAudit, kalliope, wikidata }) => {
  const pages = new Map(authorPageAudit.map(page => [page.key, page]));
  const records = authorAudit.records.map(author => {
    const page = pages.get(author.key);
    const dflId = author.sourceId;
    const dflMatches = kalliope.filter(person => dflId != null && person.identifiers?.['danskforfatterleksikon-dk'] === dflId);
    const name = normalizeName(page?.preferredName ?? author.names[0]);
    const birthYear = page?.birthYear ?? null;
    const deathYear = page?.deathYear ?? null;
    const datedKalliope = kalliope.filter(person => nameForms(person).includes(name) && birthYear != null && deathYear != null && person.birthYear === birthYear && person.deathYear === deathYear);
    const datedWikidata = wikidata.filter(person => nameForms(person).includes(name) && birthYear != null && deathYear != null && person.birthYear === birthYear && person.deathYear === deathYear);
    let resolution;
    if (dflMatches.length === 1) resolution = { status: 'certain', reason: 'dfl-id', kalliopeId: dflMatches[0].sourceId };
    else if (datedKalliope.length === 1) resolution = { status: 'likely', reason: 'name-and-life-dates', kalliopeId: datedKalliope[0].sourceId };
    else if (datedKalliope.length > 1) resolution = { status: 'needs-review', reason: 'ambiguous-name-and-life-dates', candidates: datedKalliope.map(person => person.sourceId) };
    else if (datedWikidata.length === 1) resolution = { status: 'likely-wikidata', reason: 'name-and-life-dates', wikidataId: datedWikidata[0].sourceId };
    else if (author.status === 'matched') resolution = { status: 'certain', reason: 'existing-author-match' };
    else if (page?.pageStatus === 'non-person-placeholder') resolution = { status: 'not-a-person', reason: 'placeholder-or-role' };
    else if (page?.pageStatus === 'life-dates-found') resolution = { status: 'needs-review', reason: 'no-authority-match-with-life-dates' };
    else resolution = { status: 'unresolved', reason: page == null ? 'no-person-page' : 'missing-life-dates' };
    return { ...author, page, resolution };
  });
  return {
    counts: {
      uniqueAuthors: records.length,
      certain: records.filter(record => record.resolution.status === 'certain').length,
      likely: records.filter(record => record.resolution.status === 'likely' || record.resolution.status === 'likely-wikidata').length,
      review: records.filter(record => record.resolution.status === 'needs-review').length,
      notPeople: records.filter(record => record.resolution.status === 'not-a-person').length,
      unresolved: records.filter(record => record.resolution.status === 'unresolved').length,
    },
    records,
  };
};

const renderResolution = resolution => {
  const review = resolution.records.filter(record => record.resolution.status === 'needs-review' || record.resolution.status === 'unresolved').slice(0, 300);
  return `# DFL-forfatter-matchning\n\nGenereret uden automatisk import.\n\n## Tal\n\n- Unikke DFL-forfattere: ${resolution.counts.uniqueAuthors}\n- Sikkert match: ${resolution.counts.certain}\n- Sandsynligt match: ${resolution.counts.likely}\n- Manuel vurdering: ${resolution.counts.review}\n- Ikke-person/rolle: ${resolution.counts.notPeople}\n- Uafklaret: ${resolution.counts.unresolved}\n\n## Manuel kø\n\n| Navneformer | DFL-id | DFL-år | Status | Årsag | DFL-kilde |\n| --- | --- | --- | --- | --- | --- |\n${review.map(record => `| ${record.names.join(', ').replaceAll('|', '\\|')} | ${record.sourceId ?? ''} | ${record.page?.birthYear ?? ''}-${record.page?.deathYear ?? ''} | ${record.resolution.status} | ${record.resolution.reason} | ${(record.sourceUrls ?? []).join('<br>')} |`).join('\n')}\n\n## Regel\n\nDFL-id giver sikkert match. Navn kombineret med samme fødsels- og dødsår giver kun sandsynligt match, medmindre en autoritetsrelation allerede findes.\n`;
};

export { normalizeName, renderResolution, resolveDflAuthors };
