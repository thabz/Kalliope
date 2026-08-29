const decisionStatuses = new Set(['accept', 'reject', 'merge-with', 'needs-more-evidence']);

const priorityScore = record => {
  const lifeDataBonus = record.page?.pageStatus === 'life-dates-found' ? 50 : 0;
  const sourceIdBonus = record.sourceId == null ? 0 : 10;
  return record.workCount * 100 + lifeDataBonus + sourceIdBonus;
};

const publicDomainCutoffYear = referenceDate => referenceDate.getFullYear() - 71;

const publicDomainStatus = (record, referenceDate = new Date()) => {
  const deathYear = Number.parseInt(record.page?.deathYear ?? '', 10);
  if (Number.isNaN(deathYear)) return 'death-year-unknown';
  return deathYear <= publicDomainCutoffYear(referenceDate) ? 'eligible-for-public-domain-review' : 'not-yet-eligible';
};

const validateDecisions = (decisions, resolutionRecords) => {
  const knownKeys = new Set(resolutionRecords.map(record => record.key));
  const seen = new Set();
  decisions.forEach(decision => {
    if (!knownKeys.has(decision.key)) throw new Error(`Ukendt DFL-forfatter i beslutningsfilen: ${decision.key}`);
    if (!decisionStatuses.has(decision.status)) throw new Error(`Ukendt beslutningsstatus for ${decision.key}: ${decision.status}`);
    if (seen.has(decision.key)) throw new Error(`Dobbeltbeslutning for ${decision.key}`);
    if (decision.status === 'merge-with' && typeof decision.targetKalliopeId !== 'string') throw new Error(`merge-with kræver targetKalliopeId for ${decision.key}`);
    seen.add(decision.key);
  });
  return decisions;
};

const buildReviewQueue = (resolution, decisions, limit = 100, referenceDate = new Date()) => {
  validateDecisions(decisions, resolution.records);
  const decisionByKey = new Map(decisions.map(decision => [decision.key, decision]));
  const allReviewRecords = resolution.records
    .filter(
      record =>
        (record.resolution.status === 'needs-review' ||
          record.resolution.status === 'unresolved') &&
        (record.eligibility?.status ?? 'eligible') === 'eligible'
    )
    .map(record => ({ ...record, publicDomainStatus: publicDomainStatus(record, referenceDate), priorityScore: priorityScore(record), decision: decisionByKey.get(record.key) ?? null }));
  const records = allReviewRecords
    .filter(record => record.publicDomainStatus === 'eligible-for-public-domain-review')
    .sort((a, b) => b.priorityScore - a.priorityScore || a.key.localeCompare(b.key));
  return {
    counts: {
      eligible: records.length,
      topQueue: Math.min(records.length, limit),
      decided: records.filter(record => record.decision != null).length,
      undecided: records.filter(record => record.decision == null).length,
      notYetEligible: allReviewRecords.filter(record => record.publicDomainStatus === 'not-yet-eligible').length,
      deathYearUnknown: allReviewRecords.filter(record => record.publicDomainStatus === 'death-year-unknown').length,
    },
    referenceYear: referenceDate.getFullYear(),
    records: records.slice(0, limit),
  };
};

const renderReviewQueue = queue => `# Manuel DFL-vurderingskø\n\nGenereret uden automatisk import. Referenceår: ${queue.referenceYear}. Køen viser de ${queue.counts.topQueue} højest prioriterede personer, der konservativt kan vurderes som public domain.\n\n## Tal\n\n- Public-domain-køposter: ${queue.counts.eligible}\n- I denne kø: ${queue.counts.topQueue}\n- Allerede besluttet: ${queue.counts.decided}\n- Afventer beslutning: ${queue.counts.undecided}\n- Ikke 70 år fri endnu: ${queue.counts.notYetEligible}\n- Ukendt dødsår: ${queue.counts.deathYearUnknown}\n\n## Kø\n\n| Prioritet | Navneformer | DFL-id | Dødsår | Værkposter | Resolution | Beslutning |\n| ---: | --- | --- | ---: | ---: | --- | --- |\n${queue.records.map(record => `| ${record.priorityScore} | ${record.names.join(', ').replaceAll('|', '\\|')} | ${record.sourceId ?? ''} | ${record.page?.deathYear ?? ''} | ${record.workCount} | ${record.resolution.status} | ${record.decision?.status ?? 'pending'} |`).join('\n')}\n\n## Beslutningsstatusser\n\n- \`accept\`: kandidaten kan gå videre til redaktionel vurdering.\n- \`reject\`: kandidaten afvises med begrundelse, men slettes ikke.\n- \`merge-with\`: kandidaten kobles til et eksisterende Kalliope-id.\n- \`needs-more-evidence\`: kræver yderligere kilder.\n\nBeslutninger vedligeholdes separat i \`tools/data/indsamling/register/manual-decisions.json\`.\n`;

export { buildReviewQueue, decisionStatuses, priorityScore, publicDomainCutoffYear, publicDomainStatus, renderReviewQueue, validateDecisions };
