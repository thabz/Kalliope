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
