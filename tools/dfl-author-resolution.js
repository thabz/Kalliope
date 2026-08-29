const normalizeName = value => (value ?? '').normalize('NFKC').replace(/[’'.,;:!?()[\]{}]/g, ' ').replace(/\s+/g, ' ').trim().toLocaleLowerCase('da-DK');

const nameForms = person => [person.normalizedName, ...(person.name?.alternatives ?? []).map(normalizeName)].filter(Boolean);

const resolveDflAuthors = ({
  authorAudit,
  authorPageAudit,
  kalliope,
  wikidata,
  danishAuthorIds = new Set(),
}) => {
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
    const wroteDanishPoetry =
      dflId != null &&
      danishAuthorIds.has(dflId) &&
      (author.roles ?? []).some(role => role === 'author' || role === 'poet');
    const translatedDanishPoetry = (author.roles ?? []).includes('translator');
    const eligibility = {
      status:
        wroteDanishPoetry || translatedDanishPoetry
          ? 'eligible'
          : 'not-danish-language',
      wroteDanishPoetry,
      translatedDanishPoetry,
      hasPoetryEvidence: true,
      reason: wroteDanishPoetry
          ? 'danish-original-language-and-poetry'
          : translatedDanishPoetry
          ? 'translated-foreign-poetry-into-danish'
          : 'foreign-original-author-only',
    };
    return { ...author, page, resolution, eligibility };
  });
  return {
    counts: {
      uniqueAuthors: records.length,
      certain: records.filter(record => record.resolution.status === 'certain').length,
      likely: records.filter(record => record.resolution.status === 'likely' || record.resolution.status === 'likely-wikidata').length,
      review: records.filter(record => record.resolution.status === 'needs-review').length,
      notPeople: records.filter(record => record.resolution.status === 'not-a-person').length,
      unresolved: records.filter(record => record.resolution.status === 'unresolved').length,
      eligible: records.filter(record => record.eligibility.status === 'eligible').length,
      notDanishLanguage: records.filter(
        record => record.eligibility.status === 'not-danish-language'
      ).length,
      notPoets: records.filter(
        record => record.eligibility.hasPoetryEvidence === false
      ).length,
    },
    records,
  };
};

const renderResolution = resolution => {
  const review = resolution.records.filter(record => record.resolution.status === 'needs-review' || record.resolution.status === 'unresolved').slice(0, 300);
  return `# DFL-forfatter-matchning\n\nGenereret uden automatisk import.\n\n## Tal\n\n- Unikke DFL-forfattere: ${resolution.counts.uniqueAuthors}\n- Sikkert match: ${resolution.counts.certain}\n- Sandsynligt match: ${resolution.counts.likely}\n- Manuel vurdering: ${resolution.counts.review}\n- Ikke-person/rolle: ${resolution.counts.notPeople}\n- Uafklaret: ${resolution.counts.unresolved}\n- Dansk digter eller oversætter af danske digte: ${resolution.counts.eligible}\n- Kun fremmedsproget originalforfatter: ${resolution.counts.notDanishLanguage}\n- Uden digtbelæg: ${resolution.counts.notPoets}\n\n## Manuel kø\n\n| Navneformer | DFL-id | DFL-år | Status | Sprog-/digterstatus | Årsag | DFL-kilde |\n| --- | --- | --- | --- | --- | --- | --- |\n${review.map(record => `| ${record.names.join(', ').replaceAll('|', '\\|')} | ${record.sourceId ?? ''} | ${record.page?.birthYear ?? ''}-${record.page?.deathYear ?? ''} | ${record.resolution.status} | ${record.eligibility.status} | ${record.eligibility.reason} | ${(record.sourceUrls ?? []).join('<br>')} |`).join('\n')}\n\n## Regel\n\nDFL-id giver sikkert match. Navn kombineret med samme fødsels- og dødsår giver kun sandsynligt match, medmindre en autoritetsrelation allerede findes. Kun personer i DFL's danske originalsprogsliste med digtbelæg samt personer, der har oversat digte til dansk, er importegnede.\n`;
};

export { normalizeName, renderResolution, resolveDflAuthors };
