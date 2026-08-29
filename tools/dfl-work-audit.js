const normalizeWorkValue = value => (value ?? '')
  .normalize('NFKC')
  .replace(/[’'.,;:!?()[\]{}]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLocaleLowerCase('da-DK');

const authorKey = author => author?.sourceId == null
  ? normalizeWorkValue(author?.name)
  : `dfl:${author.sourceId}`;

const workKey = work => [
  authorKey(work.authors?.[0]),
  normalizeWorkValue(work.title),
  work.year ?? '',
].join('|');

const classifyAuthorMatch = work => {
  const authors = work.authors ?? [];
  if (authors.length === 0) return 'no-author';
  if (authors.some(author => author.match?.status === 'needs-review')) return 'needs-review';
  if (authors.every(author => author.match?.status === 'already-in-kalliope')) return 'matched';
  return 'unmatched';
};

const auditWorks = works => {
  const counts = new Map();
  works.forEach(work => {
    const key = workKey(work);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  const records = works.map(work => {
    const key = workKey(work);
    const authorStatus = classifyAuthorMatch(work);
    const yearNumber = Number.parseInt(work.year, 10);
    return {
      ...work,
      workKey: key,
      authorStatus,
      duplicateStatus: counts.get(key) > 1 ? 'possible-duplicate' : 'unique-key',
      yearStatus: work.year == null || work.year === '' ? 'missing' : Number.isNaN(yearNumber) || yearNumber < 1500 || yearNumber > 1975 ? 'outside-dfl-period' : 'within-dfl-period',
    };
  });
  return {
    generatedFrom: 'danskforfatterleksikon',
    counts: {
      raw: records.length,
      uniqueKeys: new Set(records.map(record => record.workKey)).size,
      matchedAuthors: records.filter(record => record.authorStatus === 'matched').length,
      unmatchedAuthors: records.filter(record => record.authorStatus === 'unmatched').length,
      missingAuthors: records.filter(record => record.authorStatus === 'no-author').length,
      manualReview: records.filter(record => record.authorStatus === 'needs-review').length,
      possibleDuplicates: records.filter(record => record.duplicateStatus === 'possible-duplicate').length,
      missingYears: records.filter(record => record.yearStatus === 'missing').length,
      outsideDflPeriod: records.filter(record => record.yearStatus === 'outside-dfl-period').length,
    },
    records,
  };
};

const renderWorkAudit = audit => {
  const { counts, records } = audit;
  const review = records.filter(record => record.authorStatus !== 'matched' || record.duplicateStatus === 'possible-duplicate' || record.yearStatus !== 'within-dfl-period').slice(0, 300);
  return `# DFL-værkaudit\n\nDette er et genereret audit af DFL-poster med type \`digte\`. Relationerne omfatter originalforfattere til digte med dansk originalsprog og oversættere af fremmedsprogede digte i den danske bibliografi. Ingen poster er importeret.\n\n## Tal\n\n- Rå værkposter: ${counts.raw}\n- Unikke værksnøgler: ${counts.uniqueKeys}\n- Sikkert matchede forfattere: ${counts.matchedAuthors}\n- Umatchede forfattere: ${counts.unmatchedAuthors}\n- Poster uden forfatter: ${counts.missingAuthors}\n- Manuel vurdering: ${counts.manualReview}\n- Mulige dubletter: ${counts.possibleDuplicates}\n- Manglende år: ${counts.missingYears}\n- År uden for DFL-perioden: ${counts.outsideDflPeriod}\n\n## Manuel vurderingskø\n\n| Titel | År | Forfatter | Forfatterstatus | Dubletstatus | Årstatus | Kilde |\n| --- | --- | --- | --- | --- | --- | --- |\n${review.map(record => `| ${record.title.replaceAll('|', '\\|')} | ${record.year ?? ''} | ${(record.authors ?? []).map(author => author.name).join(', ').replaceAll('|', '\\|')} | ${record.authorStatus} | ${record.duplicateStatus} | ${record.yearStatus} | ${record.sourceUrl} |`).join('\n')}\n\n## Metode og begrænsninger\n\n- DFL’s sprogfelt fortolkes som værkets originalsprog.\n- Værksnøglen er første forfatter-id eller normaliseret forfatternavn + normaliseret titel + år.\n- En mulig dublet slettes ikke; posterne bevares med alle kilde-URL’er.\n- Samme titel i forskellige udgaver kan være en legitim bibliografisk forskel.\n- Navn alene giver ikke et sikkert forfattermatch.\n- DFL’s periode og klassifikation er kildeegenskaber, ikke ophavsretsafgørelser.\n`;
};

export { auditWorks, normalizeWorkValue, renderWorkAudit, workKey };
