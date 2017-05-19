export const workURL = (lang = 'da', poetId, workId, groupBy = 'name') => {
  return `/${lang}/work/${poetId}/${workId}/${groupBy}`;
};

export const poetsURL = (lang = 'da', groupBy = 'name') => {
  return `/${lang}/poets/${groupBy}`;
};
