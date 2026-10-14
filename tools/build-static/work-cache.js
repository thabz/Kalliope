import fs from 'fs';
import * as Paths from '../../common/paths.js';

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

const removeObsoleteTextFiles = (previousTexts, texts) => {
  previousTexts.forEach((text, id) => {
    if (!texts.has(id)) {
      fs.rmSync(Paths.textPath(id), { force: true });
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
  removeObsoleteTextFiles,
  removeTextsFromSourceWorks,
  sourceFilesForText,
  sourceWorkFilename,
  sourceWorkKey,
};
