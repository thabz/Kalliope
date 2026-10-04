const sourceWorkKey = text =>
  `${text.sourcePoetId ?? text.poetId}/${text.sourceWorkId ?? text.workId}`;

const sourceWorkFilename = text => `fdirs/${sourceWorkKey(text)}.xml`;

const sourceFilesForText = text =>
  text.sourceFiles ?? [
    `fdirs/${text.poetId}/info.xml`,
    sourceWorkFilename(text),
  ];

const removeTextsFromSourceWorks = (texts, sourceWorkKeys) => {
  Array.from(texts.entries()).forEach(([textId, text]) => {
    if (sourceWorkKeys.has(sourceWorkKey(text))) {
      texts.delete(textId);
    }
  });
};

const obsoleteSourceWorkKeys = (works, currentSourceWorkKeys) =>
  new Set(
    Array.from(works.entries())
      .filter(
        ([key, work]) =>
          work.virtualType !== 'anthology' &&
          !currentSourceWorkKeys.has(key)
      )
      .map(([key]) => key)
  );

export {
  obsoleteSourceWorkKeys,
  removeTextsFromSourceWorks,
  sourceFilesForText,
  sourceWorkFilename,
  sourceWorkKey,
};
