const source = (id, category, priority, label, shortLabel, url) => ({
  id,
  category,
  priority,
  label,
  shortLabel,
  url,
});

const externalIdentifierSources = [
  source(
    'wikidata',
    'authority',
    20,
    'Wikidata',
    'WD',
    (value) => `https://www.wikidata.org/wiki/${encodeURIComponent(value)}`,
  ),
  source(
    'gravsted-dk',
    'reference',
    1000,
    'Kendtes Gravsted',
    'KG',
    (value) =>
      `https://www.gravsted.dk/person.php?navn=${encodeURIComponent(value)}`,
  ),
  source(
    'viaf',
    'authority',
    10,
    'VIAF',
    'VIAF',
    (value) => `https://viaf.org/viaf/${encodeURIComponent(value)}/`,
  ),
  source(
    'lex-dk',
    'reference',
    100,
    'Lex',
    'lex',
    (value) => `https://lex.dk/${encodeURIComponent(value)}`,
  ),
  source(
    'teaterleksikon-lex-dk',
    'reference',
    130,
    'Gyldendals Teaterleksikon',
    'TL',
    (value) => `https://teaterleksikon.lex.dk/${encodeURIComponent(value)}`,
  ),
  source(
    'biografisk-leksikon-lex-dk',
    'reference',
    110,
    'Dansk Biografisk Leksikon',
    'DBL',
    (value) => `https://biografiskleksikon.lex.dk/${encodeURIComponent(value)}`,
  ),
  source(
    'litteraturpriser-dk',
    'reference',
    120,
    'Litteraturpriser.dk',
    'LP',
    (value) =>
      `https://www.litteraturpriser.dk/aut/${encodeURIComponent(value)}.htm`,
  ),
  source(
    'runeberg-org',
    'reference',
    140,
    'Projekt Runeberg',
    'R',
    (value) =>
      `https://runeberg.org/authors/${encodeURIComponent(value)}.html`,
  ),
  source(
    'gutenberg-org',
    'reference',
    150,
    'Project Gutenberg',
    'G',
    (value) =>
      `https://www.gutenberg.org/ebooks/author/${encodeURIComponent(value)}`,
  ),
];

const externalIdentifierIds = externalIdentifierSources.map(
  ({ id }) => id,
);

const buildExternalIdentifierLinks = (identifiers, { category } = {}) => {
  if (identifiers == null) {
    return [];
  }
  return externalIdentifierSources
    .filter((source) => category == null || source.category === category)
    .filter(({ id }) => identifiers[id] != null && identifiers[id] !== '')
    .sort((a, b) => a.priority - b.priority)
    .map(({ url, ...identifierSource }) => ({
      ...identifierSource,
      href: url(identifiers[identifierSource.id]),
    }));
};

export {
  buildExternalIdentifierLinks,
  externalIdentifierIds,
  externalIdentifierSources,
};
