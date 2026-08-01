const validateFirstlineMarkup = (firstline, textId, filename) => {
  if (firstline != null && firstline.title.includes('<')) {
    throw new Error(
      `Teksten "${textId}" i ${filename} har markup i <firstline>.\n` +
        'Fjern markup fra F:-linjen i txt2xml-kilden eller fra <firstline> i XML-filen.'
    );
  }
};

export {
  validateFirstlineMarkup,
};
