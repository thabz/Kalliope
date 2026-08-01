const validateFirstlineMarkup = (firstline, textId, filename) => {
  if (firstline != null && firstline.title.includes('<')) {
    throw new Error(
      `Teksten "${textId}" i ${filename} har markup i <firstline>.\n` +
        'Fjern markup fra F:-linjen i txt2xml-kilden eller fra <firstline> i XML-filen.'
    );
  }
};

const removeRedundantMuseumName = (description, museumName) => {
  if (description == null || museumName == null || museumName.length === 0) {
    return description;
  }

  const escapedName = museumName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const withoutMuseumName = description.replace(
    new RegExp(escapedName, 'gi'),
    ''
  );

  return withoutMuseumName
    .replace(/\s+([,.])/g, '$1')
    .replace(/,\s*\./g, '.')
    .replace(/\.\s*,/g, '.')
    .replace(/\.\s*\./g, '.')
    .replace(/\b(?:fra|hos|i|på)\s*\.$/i, '.')
    .replace(/,\s*$/g, '')
    .replace(/\s+([,.])/g, '$1')
    .trim();
};

export {
  removeRedundantMuseumName,
  validateFirstlineMarkup,
};
