import fs from 'fs';

const catalogFilename = 'content/literary-periods.json';
const requiredTitleLanguages = ['da', 'en', 'fr', 'de'];
const knownCountries = new Set([
  'dk', 'se', 'no', 'is', 'gb', 'de', 'fr', 'us', 'it', 'un',
]);
const knownTraditions = new Set([
  'dk', 'se', 'no', 'gb', 'de', 'fr', 'us', 'it',
  'es', 'fa', 'grc', 'la', 'nl', 'is', 'sv-fi',
]);
const traditionCountries = {
  dk: ['dk'], se: ['se'], no: ['no'], gb: ['gb'], de: ['de', 'un'],
  fr: ['fr'], us: ['us'], it: ['it'], es: ['un'], fa: ['un'],
  grc: ['un'], la: ['un'], nl: ['un'], is: ['is'], 'sv-fi': ['un'],
};

const validateLiteraryPeriods = catalog => {
  if (catalog == null || Array.isArray(catalog.periods) === false) {
    throw new Error('Litteraturperiodekataloget skal have en periods-liste');
  }
  const ids = new Set();
  catalog.periods.forEach(period => {
    if (typeof period.id !== 'string' || period.id === '' || ids.has(period.id)) {
      throw new Error(`Ugyldigt eller gentaget litteraturperiode-id: ${period.id}`);
    }
    ids.add(period.id);
    if (!knownTraditions.has(period.tradition)) {
      throw new Error(`${period.id} har ukendt litterær tradition: ${period.tradition}`);
    }
    if (period.id.startsWith(`${period.tradition}-`) === false) {
      throw new Error(`${period.id} har id-prefix, der ikke svarer til traditionen`);
    }
    if (Array.isArray(period.countries) === false || period.countries.length === 0) {
      throw new Error(`${period.id} mangler landeområde`);
    }
    period.countries.forEach(country => {
      if (!knownCountries.has(country)) {
        throw new Error(`${period.id} har ukendt land: ${country}`);
      }
      if (traditionCountries[period.tradition].includes(country) === false) {
        throw new Error(`${period.id} har ugyldig tradition/land-kombination`);
      }
    });
    if (Object.keys(period.title ?? {}).sort().join(',') !== requiredTitleLanguages.sort().join(',')) {
      throw new Error(`${period.id} skal have præcis titler på da, en, fr og de`);
    }
    requiredTitleLanguages.forEach(lang => {
      if (typeof period.title[lang] !== 'string' || period.title[lang] === '') {
        throw new Error(`${period.id} mangler titel på ${lang}`);
      }
    });
    if (typeof period.sortYear !== 'number' || Number.isFinite(period.sortYear) === false) {
      throw new Error(`${period.id} har ugyldigt sortYear`);
    }
    if (Array.isArray(period.sources) === false || period.sources.length === 0) {
      throw new Error(`${period.id} mangler kilde`);
    }
    period.sources.forEach(source => {
      if (typeof source.title !== 'string' || source.title === '' || typeof source.url !== 'string') {
        throw new Error(`${period.id} har ugyldig kilde`);
      }
      try {
        new URL(source.url);
      } catch {
        throw new Error(`${period.id} har ugyldig kilde-URL`);
      }
    });
  });
  return catalog.periods;
};

const loadLiteraryPeriods = () => {
  const catalog = JSON.parse(fs.readFileSync(catalogFilename, 'utf8'));
  const periods = validateLiteraryPeriods(catalog);
  const idMap = new Map(periods.map(period => [period.id, period]));
  const sorted = periods
    .map((period, catalogIndex) => ({ period, catalogIndex }))
    .sort((a, b) => a.period.sortYear - b.period.sortYear || a.catalogIndex - b.catalogIndex)
    .map(entry => entry.period);
  return {
    catalog,
    periods,
    idMap,
    byId: idMap,
    sorted,
    sortedPeriods: sorted,
  };
};

const literaryPeriods = loadLiteraryPeriods();

export {
  catalogFilename,
  knownCountries,
  knownTraditions,
  loadLiteraryPeriods,
  validateLiteraryPeriods,
  literaryPeriods,
};
