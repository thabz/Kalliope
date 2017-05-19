export const workURL = (lang, poetId, workId, groupBy = 'name') => {
  return `${lang}/work/${poetId}/${workId}/${groupBy}`;
};

export const poetsURL = (lang, groupBy = 'name') => {
  return `${lang}/poets/${groupBy}`;
};
