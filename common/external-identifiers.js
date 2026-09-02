import { supportedLanguages } from './languages.js';

const source = (id, category, priority, label, shortLabel, url) => ({
  id,
  category,
  priority,
  label,
  shortLabel,
  url,
  identifierIds: [id],
  resolve: (identifiers) => identifiers[id],
});

const wikipediaIdentifierIds = supportedLanguages.map(
  (lang) => `wikipedia-${lang}`,
);

const wikipediaArticleURL = ({ lang, title }) => {
  const encodedTitle = title
    .replaceAll(' ', '_')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `https://${lang}.wikipedia.org/wiki/${encodedTitle}`;
};

const wikipediaSource = {
  id: 'wikipedia',
  category: 'reference',
  priority: 135,
  label: 'Wikipedia',
  shortLabel: 'W',
  url: wikipediaArticleURL,
  identifierIds: wikipediaIdentifierIds,
  resolve: (identifiers, lang) => {
    const requestedLang = supportedLanguages.includes(lang) ? lang : 'en';
    const requestedTitle = identifiers[`wikipedia-${requestedLang}`];
    if (requestedTitle != null && requestedTitle !== '') {
      return { lang: requestedLang, title: requestedTitle };
    }
    const englishTitle = identifiers['wikipedia-en'];
    return englishTitle == null || englishTitle === ''
      ? null
      : { lang: 'en', title: englishTitle };
  },
};

const externalIdentifierSources = [
  source(
    'wikidata',
    'authority',
    20,
    'Wikidata',
    'WD',
    (value) => `https://www.wikidata.org/wiki/${encodeURIComponent(value)}`,
  ),
  wikipediaSource,
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
    'gnd',
    'authority',
    30,
    'GND',
    'GND',
    (value) => `https://d-nb.info/gnd/${encodeURIComponent(value)}`,
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
    'kvindebiografisk-leksikon-lex-dk',
    'reference',
    115,
    'Dansk Kvindebiografisk Leksikon',
    'DKL',
    (value) =>
      `https://kvindebiografiskleksikon.lex.dk/${encodeURIComponent(value)}`,
  ),
  // Wikidata P12386 is Dansk Forfatterleksikon ID. Named IDs live in
  // 1850bib; foreign-author IDs such as u757 live in 1850u.
  source(
    'danskforfatterleksikon-dk',
    'reference',
    120,
    'Dansk Forfatterleksikon',
    'DFL',
    (value) => {
      const section = /^u\d+$/.test(value) ? '1850u' : '1850bib';
      return `https://danskforfatterleksikon.dk/${section}/${encodeURIComponent(value)}.htm`;
    },
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

const externalIdentifierIds = externalIdentifierSources.flatMap(
  ({ identifierIds }) => identifierIds,
);

const buildExternalIdentifierLinks = (
  identifiers,
  { category, lang = 'da' } = {},
) => {
  if (identifiers == null) {
    return [];
  }
  return externalIdentifierSources
    .filter((source) => category == null || source.category === category)
    .map((source) => ({ source, value: source.resolve(identifiers, lang) }))
    .filter(({ value }) => value != null && value !== '')
    .sort((a, b) => a.source.priority - b.source.priority)
    .map(
      ({
        source: { identifierIds, resolve, url, ...identifierSource },
        value,
      }) => ({
        ...identifierSource,
        href: url(value),
      }),
    );
};

export {
  buildExternalIdentifierLinks,
  externalIdentifierIds,
  externalIdentifierSources,
};
