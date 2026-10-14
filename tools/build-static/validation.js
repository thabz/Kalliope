const validateFirstlineMarkup = (firstline, textId, filename) => {
  if (firstline != null && firstline.title.includes('<')) {
    throw new Error(
      `Teksten "${textId}" i ${filename} har markup i <firstline>.\n` +
        'Fjern markup fra F:-linjen i txt2xml-kilden eller fra <firstline> i XML-filen.'
    );
  }
};

const validateIndexTitleMarkup = (
  title,
  textId,
  filename,
  { allowOverlines = false } = {},
) => {
  const remainingMarkup = allowOverlines === true
    ? title.replace(/<\/?o\s*\/?>/g, '')
    : title;
  if (remainingMarkup.includes('<')) {
    throw new Error(`${textId} har markup i titlen i ${filename}`);
  }
};

export {
  validateFirstlineMarkup,
  validateIndexTitleMarkup,
};
