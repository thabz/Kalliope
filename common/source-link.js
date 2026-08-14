import _ from './translations.js';

const sourceProviders = [
  {
    domain: 'kb.dk',
    names: {
      da: 'Det kongelige Bibliotek',
      en: 'The Royal Danish Library',
      de: 'Königliche Bibliothek Dänemarks',
      fr: 'Bibliothèque royale du Danemark',
    },
  },
  { domain: 'adl.dk', names: { da: 'Arkiv for Dansk Litteratur' } },
  { domain: 'archive.org', names: { da: 'Internet Archive' } },
  { domain: 'gutenberg.org', names: { da: 'Project Gutenberg' } },
  {
    domain: 'xn--grundtvigsvrker-7lb.dk',
    names: { da: 'Grundtvigs Værker' },
  },
  { domain: 'litteraturbanken.se', names: { da: 'Litteraturbanken' } },
  { domain: 'rosekamp.dk', names: { da: 'Rosekamp' } },
  { domain: 'runeberg.org', names: { da: 'Projekt Runeberg' } },
  { domain: 'wikisource.org', names: { da: 'Wikisource' } },
  { domain: 'zeno.org', names: { da: 'Zeno.org' } },
];

const matchesDomain = (hostname, domain) =>
  hostname === domain || hostname.endsWith(`.${domain}`);

const sourceProviderName = (href, lang) => {
  try {
    const hostname = new URL(href).hostname.toLowerCase();
    const provider = sourceProviders.find(({ domain }) =>
      matchesDomain(hostname, domain)
    );
    if (provider == null) {
      return hostname.replace(/^www\./, '');
    }
    return provider.names[lang] ?? provider.names.da;
  } catch {
    return null;
  }
};

export const sourceLinkLabel = (href, lang) => {
  const providerName = sourceProviderName(href, lang);
  if (providerName == null || providerName.length === 0) {
    return _('Digital kilde', lang);
  }
  return _('Digital kilde hos {provider}', lang, {
    provider: providerName,
  });
};
