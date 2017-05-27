// @flow

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

export const textURL = (lang: string = 'da', textId: string) => {
  return `/${lang}/text/${textId}`;
};
