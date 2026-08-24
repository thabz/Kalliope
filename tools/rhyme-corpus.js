import fs from 'fs';
import path from 'path';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { poetryStanzasFromXml } from './metre-analysis.js';

const excludedWorkFiles = new Set(['artwork.xml', 'bio.xml', 'info.xml', 'portraits.xml']);

const poetLanguage = (rootDir, poetId, cache) => {
  if (cache.has(poetId)) return cache.get(poetId);
  const filename = path.join(rootDir, 'fdirs', poetId, 'info.xml');
  if (fs.existsSync(filename) === false) {
    cache.set(poetId, null);
    return null;
  }
  const document = new DOMParser().parseFromString(fs.readFileSync(filename, 'utf8'), 'text/xml');
  const language = document.documentElement.getAttribute('lang');
  cache.set(poetId, language == null || language === '' ? null : language);
  return cache.get(poetId);
};

const workXmlFiles = rootDir => {
  const files = [];
  const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(filename);
    else if (entry.isFile() && entry.name.endsWith('.xml') &&
      excludedWorkFiles.has(entry.name) === false) files.push(filename);
  });
  walk(path.join(rootDir, 'fdirs'));
  return files.sort();
};

const publicationYear = document => {
  const workhead = document.getElementsByTagName('workhead')[0];
  const value = workhead?.getElementsByTagName('year')[0]?.textContent ?? '';
  const match = value.match(/(?:^|\D)(\d{4})(?:\D|$)/u);
  return match == null ? null : Number(match[1]);
};

export const selectRhymeTrainingPoems = (rootDir, {
  fromYear = 1820,
  toYear = 1880,
  minStanzas = 5,
  minLinesPerStanza = 4,
} = {}) => {
  const serializer = new XMLSerializer();
  const languageCache = new Map();
  const poems = [];
  workXmlFiles(rootDir).forEach(filename => {
    const document = new DOMParser().parseFromString(fs.readFileSync(filename, 'utf8'), 'text/xml');
    const year = publicationYear(document);
    if (year == null || year < fromYear || year > toYear) return;
    const workAuthor = document.documentElement.getAttribute('author');
    const explicitWorkLanguage = document.documentElement.getAttribute('lang');
    const defaultWorkLanguage = poetLanguage(rootDir, workAuthor, languageCache) ?? 'da';
    const workLanguage = explicitWorkLanguage != null && explicitWorkLanguage !== ''
      ? explicitWorkLanguage
      : defaultWorkLanguage;
    Array.from(document.getElementsByTagName('text')).forEach(text => {
      const textAuthor = text.getAttribute('author');
      const explicitTextLanguage = text.getAttribute('lang');
      const authorLanguage = textAuthor == null || textAuthor === ''
        ? workLanguage
        : poetLanguage(rootDir, textAuthor, languageCache) ?? workLanguage;
      const language = explicitTextLanguage != null && explicitTextLanguage !== ''
        ? explicitTextLanguage
        : authorLanguage;
      if (language !== 'da') return;
      const poetry = Array.from(text.getElementsByTagName('poetry'))[0];
      if (poetry == null) return;
      const stanzas = poetryStanzasFromXml(serializer.serializeToString(poetry));
      if (stanzas.length < minStanzas || stanzas[0]?.length < minLinesPerStanza ||
        stanzas.some(stanza => stanza.length !== stanzas[0].length)) return;
      poems.push({
        file: path.relative(rootDir, filename),
        id: text.getAttribute('id') ?? '(uden id)',
        linesPerStanza: stanzas[0].length,
        poetId: path.relative(path.join(rootDir, 'fdirs'), filename).split(path.sep)[0],
        stanzas,
        workId: path.basename(filename, '.xml'),
        year,
      });
    });
  });
  return poems;
};

export const summarizeRhymeTrainingPoems = poems => ({
  poems: poems.length,
  works: new Set(poems.map(poem => poem.file)).size,
  poets: new Set(poems.map(poem => poem.poetId)).size,
  stanzas: poems.reduce((sum, poem) => sum + poem.stanzas.length, 0),
  lines: poems.reduce((sum, poem) => sum + poem.stanzas.length * poem.linesPerStanza, 0),
});
