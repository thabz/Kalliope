export const frontPageURL = (lang = 'da') => {
  return `/${lang}/`;
};

export const workURL = (lang = 'da', poetId, workId) => {
  return `/${lang}/work/${poetId}/${workId}`;
};

export const allTextsURL = (lang, country, type, letter = 'A') => {
  return `/${lang}/texts/${country}/${type}/${letter}`;
};

export const poetsURL = (
  lang = 'da',
  groupBy = 'name', // 'name' | 'year' | 'looks'
  country = 'dk'
) => {
  return `/${lang}/poets/${country}/${groupBy}`;
};

export const poetURL = (lang = 'da', poetId) => {
  return `/${lang}/works/${poetId}`;
};

export const textsURL = (
  lang = 'da',
  poetId,
  type // 'first' | 'titles'
) => {
  return `/${lang}/texts/${poetId}/${type}`;
};

export const worksURL = (lang = 'da', poetId) => {
  return `/${lang}/works/${poetId}`;
};

export const bioURL = (lang = 'da', poetId) => {
  return `/${lang}/bio/${poetId}`;
};

export const bibliographyURL = (lang = 'da', poetId) => {
  return `/${lang}/bibliography/${poetId}`;
};

export const mentionsURL = (lang = 'da', poetId) => {
  return `/${lang}/mentions/${poetId}`;
};

export const textURL = (lang = 'da', textId) => {
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

export const bibleURL = (lang = 'da', bibleId) => {
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

export const keywordsURL = (lang = 'da') => {
  return `/${lang}/keywords`;
};

export const dictionaryURL = (lang = 'da', id?) => {
  if (id != null) {
    return `/${lang}/dict/${id}`;
  } else {
    return `/${lang}/dict`;
  }
};

export const keywordURL = (lang = 'da', keywordId) => {
  return `/${lang}/keyword/${keywordId}`;
};

export const aboutURL = (lang = 'da', aboutText) => {
  return `/${lang}/about/${aboutText}`;
};

export const museumURL = (lang = 'da', museumId) => {
  return `/${lang}/museum/${museumId}`;
};

export const museumsURL = (lang = 'da') => {
  return `/${lang}/museums`;
};

export const searchURL = (lang, query, country, poetId = null) => {
  const escapedQuery = encodeURIComponent(query).replace(/%20/g, '+');
  if (poetId != null) {
    return `/${lang}/search/${country}/${poetId}?query=${escapedQuery}`;
  } else {
    return `/${lang}/search/${country}?query=${escapedQuery}`;
  }
};
