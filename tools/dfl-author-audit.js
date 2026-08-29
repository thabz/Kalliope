const authorKey = author => author.sourceId == null
  ? `name:${(author.name ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('da-DK')}`
  : `dfl:${author.sourceId}`;

const decodeHtml = value => value.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');

const parseDflAuthorPage = (html, sourceUrl) => {
  const headingMatches = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)];
  const headingText = headingMatches.map(match => decodeHtml(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())).find(value => /\(\d{4}-\d{4}\)/.test(value));
  const text = decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<(?:br|\/p|\/div|\/h[1-6])\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')).split(/\r?\n/).map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
  const dateMatch = (headingText ?? text).match(/([^\n]{2,160})\s*\((\d{4})-(\d{4})\)/);
  const preferredName = dateMatch?.[1]?.trim() ?? null;
  const placeholder = /^(?:anonym|ukendt|uidentificeret|pseudonym)|oversat af|redigeret af/i.test(preferredName ?? '');
  return {
    sourceUrl, pageStatus: placeholder ? 'non-person-placeholder' : dateMatch == null ? 'no-life-dates-found' : 'life-dates-found',
    preferredName, birthYear: placeholder ? null : dateMatch?.[2] ?? null, deathYear: placeholder ? null : dateMatch?.[3] ?? null,
  };
};

const auditAuthors = works => {
  const byKey = new Map();
  works.forEach((work, workIndex) => {
    (work.authors ?? []).forEach(author => {
      const key = authorKey(author);
      const existing = byKey.get(key) ?? {
        key, sourceId: author.sourceId ?? null, names: new Set(), roles: new Set(), sourceUrls: new Set(), workIndexes: [], matches: [],
      };
      existing.names.add(author.name);
      existing.roles.add(author.role);
      if (author.sourceUrl != null) existing.sourceUrls.add(author.sourceUrl);
      existing.workIndexes.push(workIndex);
      existing.matches.push(author.match ?? { status: 'unmatched', confidence: 'none' });
      byKey.set(key, existing);
    });
  });
  const records = [...byKey.values()].map(candidate => {
    const statuses = candidate.matches.map(match => match.status);
    const status = statuses.includes('already-in-kalliope') ? 'matched' : statuses.includes('needs-review') ? 'needs-review' : 'unmatched';
    const confidence = statuses.includes('already-in-kalliope') && candidate.matches.every(match => match.status === 'already-in-kalliope') ? 'certain' : status === 'needs-review' ? 'possible' : 'none';
    return {
      key: candidate.key, sourceId: candidate.sourceId, names: [...candidate.names].sort(), roles: [...candidate.roles].sort(), sourceUrls: [...candidate.sourceUrls].sort(),
      workCount: candidate.workIndexes.length, workIndexes: candidate.workIndexes, status, confidence,
      matchReasons: [...new Set(candidate.matches.map(match => match.reason ?? match.status))],
      matches: candidate.matches,
    };
  }).sort((a, b) => b.workCount - a.workCount || a.key.localeCompare(b.key));
  return {
    counts: {
      uniqueAuthors: records.length,
      matched: records.filter(record => record.status === 'matched').length,
      possible: records.filter(record => record.status === 'needs-review').length,
      unmatched: records.filter(record => record.status === 'unmatched').length,
      affectedWorks: works.length,
    },
    records,
  };
};

const renderAuthorAudit = audit => {
  const review = audit.records.filter(record => record.status !== 'matched').slice(0, 300);
  return `# DFL-forfatteraudit\n\nGenereret fra DFL-poster med type \`digte\`: originalforfattere med dansk originalsprog og oversættere af fremmedsprogede digte. Ingen personer er importeret.\n\n## Tal\n\n- Unikke DFL-forfatterkandidater: ${audit.counts.uniqueAuthors}\n- Sikkert matchede: ${audit.counts.matched}\n- Mulige match: ${audit.counts.possible}\n- Umatchede: ${audit.counts.unmatched}\n- Berørte værkposter: ${audit.counts.affectedWorks}\n\n## Manuel vurderingskø\n\n| Navneformer | DFL-id | Værkposter | Status | Matchårsag | Kilder |\n| --- | --- | ---: | --- | --- | --- |\n${review.map(record => `| ${record.names.join(', ').replaceAll('|', '\\|')} | ${record.sourceId ?? ''} | ${record.workCount} | ${record.status} | ${record.matchReasons.join(', ')} | ${record.sourceUrls.join('<br>')} |`).join('\n')}\n\n## Fortolkning\n\n- DFL’s sprogfelt behandles som værkets originalsprog.\n- En DFL-forfatter samles kun med andre poster via DFL-id i dette audit.\n- Kalliope-id’er og navneforslag ligger på de enkelte værkrelationer.\n- Mulige match er ikke redaktionelle afgørelser.\n- Umatchede kandidater kan være nye personer, manglende autoritetsdata eller navne-/id-forskelle.\n`;
};

export { auditAuthors, authorKey, parseDflAuthorPage, renderAuthorAudit };
