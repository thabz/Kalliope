// @flow

import type { Lang, PoetId } from '../pages/helpers/types.js';

export const frontPageURL = (lang: string = 'da') => {
  return `/${lang}/`;
};

export const workURL = (lang: Lang = 'da', poetId: string, workId: string) => {
  return `/${lang}/work/${poetId}/${workId}`;
};

export const poetsURL = (
  lang: string = 'da',
  groupBy: 'name' | 'year' | 'looks' = 'name',
  country: string = 'dk'
) => {
  return `/${lang}/poets/${country}/${groupBy}`;
};

export const poetURL = (lang: string = 'da', poetId: string) => {
  return `/${lang}/works/${poetId}`;
};

export const textsURL = (
  lang: string = 'da',
  poetId: string,
  type: 'first' | 'titles'
) => {
  return `/${lang}/texts/${poetId}/${type}`;
};

export const worksURL = (lang: string = 'da', poetId: string) => {
  return `/${lang}/works/${poetId}`;
};

export const bioURL = (lang: string = 'da', poetId: string) => {
  return `/${lang}/bio/${poetId}`;
};

export const bibliographyURL = (lang: string = 'da', poetId: PoetId) => {
  return `/${lang}/bibliography/${poetId}`;
};

export const textURL = (lang: string = 'da', textId: string) => {
  const highlight = textId.match(/,(.*)$/);
  if (highlight != null) {
    textId = textId.replace(',' + highlight[1], '');
  }

  if (highlight) {
    return `/${lang}/text/${textId}?highlight=${highlight[1]}#h`;
  } else {
    return `/${lang}/text/${textId}`;
  }
};

export const bibleURL = (lang: string = 'da', bibleId: string) => {
  const verses = bibleId.match(/,(.*)$/);
  if (verses != null) {
    bibleId = bibleId.replace(',' + verses[1], '');
  }
  if (verses) {
    return `/${lang}/text/${bibleId}?highlight=${verses[1]}#h`;
  } else {
    return `/${lang}/text/${bibleId}`;
  }
};

export const keywordsURL = (lang: string = 'da') => {
  return `/${lang}/keywords`;
};

export const dictionaryURL = (lang: string = 'da', id?: string) => {
  if (id != null) {
    return `/${lang}/dict/${id}`;
  } else {
    return `/${lang}/dict`;
  }
};

export const keywordURL = (lang: string = 'da', keywordId: string) => {
  return `/${lang}/keyword/${keywordId}`;
};

export const aboutURL = (lang: string = 'da', aboutText: string) => {
  return `/${lang}/about/${aboutText}`;
};

export const searchURL = (
  lang: string,
  query: string,
  country: string,
  poetId: ?PoetId = null
) => {
  const escapedQuery = encodeURIComponent(query).replace(/%20/g, '+');
  if (poetId != null) {
    return `/${lang}/search/${country}/${poetId}?query=${escapedQuery}`;
  } else {
    return `/${lang}/search/${country}?query=${escapedQuery}`;
  }
};
