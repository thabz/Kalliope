// @flow

export const frontPageURL = (lang: string = 'da') => {
  return `/${lang}/`;
};

export const workURL = (
  lang: string = 'da',
  poetId: string,
  workId: string
) => {
  return `/${lang}/work/${poetId}/${workId}`;
};

export const poetsURL = (
  lang: string = 'da',
  groupBy: 'name' | 'year' = 'name'
) => {
  return `/${lang}/poets/${groupBy}`;
};

export const poetURL = (lang: string = 'da', poetId: string) => {
  return `/${lang}/works/${poetId}`;
};

export const linesURL = (
  lang: string = 'da',
  poetId: string,
  type: 'first' | 'titles'
) => {
  return `/${lang}/lines/${poetId}/${type}`;
};

export const worksURL = (lang: string = 'da', poetId: string) => {
  return `/${lang}/works/${poetId}`;
};

export const bioURL = (lang: string = 'da', poetId: string) => {
  return `/${lang}/bio/${poetId}`;
};

export const bibliographyURL = (lang: string = 'da', poetId: string) => {
  return `/${lang}/bibliography/${poetId}`;
};

export const textURL = (lang: string = 'da', textId: string) => {
  return `/${lang}/text/${textId}`;
};

export const bibleURL = (lang: string = 'da', bibleId: string) => {
  const verses = bibleId.match(/,(.*)$/);
  if (verses != null) {
    bibleId = bibleId.replace(',' + verses[1], '');
  }
  if (verses) {
    return `/${lang}/text/${bibleId}?verses=${verses[1]}`;
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
