// @flow

import type {
  Lang,
  PoetId,
  LinesType,
  Country,
  URLString,
} from '../pages/helpers/types.js';

export const frontPageURL = (lang: string = 'da'): URLString => {
  return `/${lang}/`;
};

export const workURL = (
  lang: Lang = 'da',
  poetId: string,
  workId: string
): URLString => {
  return `/${lang}/work/${poetId}/${workId}`;
};

export const allTextsURL = (
  lang: Lang,
  country: Country,
  type: LinesType,
  letter: string = 'A'
): URLString => {
  return `/${lang}/texts/${country}/${type}/${letter}`;
};
export const poetsURL = (
  lang: Lang = 'da',
  groupBy: 'name' | 'year' | 'looks' = 'name',
  country: string = 'dk'
): URLString => {
  return `/${lang}/poets/${country}/${groupBy}`;
};

export const poetURL = (lang: string = 'da', poetId: string): URLString => {
  return `/${lang}/works/${poetId}`;
};

export const textsURL = (
  lang: Lang = 'da',
  poetId: string,
  type: LinesType // 'first' | 'titles'
): URLString => {
  return `/${lang}/texts/${poetId}/${type}`;
};

export const worksURL = (lang: Lang = 'da', poetId: PoetId): URLString => {
  return `/${lang}/works/${poetId}`;
};

export const bioURL = (lang: Lang = 'da', poetId: PoetId): URLString => {
  return `/${lang}/bio/${poetId}`;
};

export const bibliographyURL = (
  lang: Lang = 'da',
  poetId: PoetId
): URLString => {
  return `/${lang}/bibliography/${poetId}`;
};

export const mentionsURL = (lang: Lang = 'da', poetId: PoetId): URLString => {
  return `/${lang}/mentions/${poetId}`;
};

export const textURL = (lang: Lang = 'da', textId: string): URLString => {
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

export const bibleURL = (lang: Lang = 'da', bibleId: string): URLString => {
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

export const keywordsURL = (lang: Lang = 'da'): URLString => {
  return `/${lang}/keywords`;
};

export const dictionaryURL = (lang: Lang = 'da', id?: string): URLString => {
  if (id != null) {
    return `/${lang}/dict/${id}`;
  } else {
    return `/${lang}/dict`;
  }
};

export const keywordURL = (lang: Lang = 'da', keywordId: string): URLString => {
  return `/${lang}/keyword/${keywordId}`;
};

export const aboutURL = (lang: Lang = 'da', aboutText: string): URLString => {
  return `/${lang}/about/${aboutText}`;
};

export const searchURL = (
  lang: Lang,
  query: string,
  country: Country,
  poetId: ?PoetId = null
): URLString => {
  const escapedQuery = encodeURIComponent(query).replace(/%20/g, '+');
  if (poetId != null) {
    return `/${lang}/search/${country}/${poetId}?query=${escapedQuery}`;
  } else {
    return `/${lang}/search/${country}?query=${escapedQuery}`;
  }
};
