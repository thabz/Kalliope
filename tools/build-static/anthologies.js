import { safeGetAttr } from './xml.js';

const ANTHOLOGY_WORK_ID = 'antologier';
const ANTHOLOGY_WORK_TITLE = 'Tekster i andre udgivelser';

const publicationTextId = textId => `${textId}a`;

const isAnthologyText = (textAuthorId, publicationPoetId) =>
  textAuthorId != null && textAuthorId !== publicationPoetId;

const resolveAuthorId = (node, fallbackAuthorId) => {
  let current = node;
  while (current != null) {
    const authorId = safeGetAttr(current, 'author');
    if (authorId != null && authorId.length > 0) {
      return authorId;
    }
    current = current.parentNode;
  }
  return fallbackAuthorId;
};

const sourceWorkKey = text =>
  `${text.sourcePoetId || text.poetId}/${text.sourceWorkId || text.workId}`;

const sourceWorkFilename = text => `fdirs/${sourceWorkKey(text)}.xml`;

const sourceFilesForText = text =>
  text.sourceFiles || [
    `fdirs/${text.poetId}/info.xml`,
    sourceWorkFilename(text),
  ];

const worksForPoet = (collected, poetId) =>
  Array.from(collected.works.entries())
    .filter(([key]) => key.startsWith(`${poetId}/`))
    .map(([, work]) => work);

const textsForWork = (collected, poetId, workId) =>
  Array.from(collected.texts.values()).filter(
    text => text.poetId === poetId && text.workId === workId
  );

const compareSourceSections = (a, b) => {
  const aKey = `${a.work.published || ''}\0${a.work.title}\0${a.key}`;
  const bKey = `${b.work.published || ''}\0${b.work.title}\0${b.key}`;
  return aKey.localeCompare(bKey, 'da');
};

const buildVirtualAnthologyWorks = collected => {
  Array.from(collected.works.entries()).forEach(([key, work]) => {
    if (work.virtualType === 'anthology') {
      collected.works.delete(key);
    }
  });

  const textsByAuthor = new Map();
  collected.texts.forEach(text => {
    if (text.placement !== 'author') {
      return;
    }
    const texts = textsByAuthor.get(text.poetId) || [];
    texts.push(text);
    textsByAuthor.set(text.poetId, texts);
  });

  textsByAuthor.forEach((texts, poetId) => {
    const sectionsBySource = new Map();
    texts.forEach(text => {
      const key = sourceWorkKey(text);
      const sourceWork = collected.works.get(key);
      if (sourceWork == null) {
        throw new Error(
          `Antologiteksten ${text.id} henviser til det ukendte værk ${key}.`
        );
      }
      const section = sectionsBySource.get(key) || {
        key,
        sourcePoetId: text.sourcePoetId,
        sourceWorkId: text.sourceWorkId,
        work: sourceWork,
        texts: [],
      };
      section.texts.push(text);
      sectionsBySource.set(key, section);
    });

    const sections = Array.from(sectionsBySource.values())
      .sort(compareSourceSections)
      .map(section => ({
        ...section,
        texts: section.texts.sort(
          (a, b) => (a.sourceOrder || 0) - (b.sourceOrder || 0)
        ),
      }));
    const sourceFiles = new Set([`fdirs/${poetId}/info.xml`]);
    sections.forEach(section => {
      (section.work.sourceFiles || [
        `fdirs/${section.sourcePoetId}/info.xml`,
        `fdirs/${section.sourcePoetId}/${section.sourceWorkId}.xml`,
      ]).forEach(filename => sourceFiles.add(filename));
    });

    collected.works.set(`${poetId}/${ANTHOLOGY_WORK_ID}`, {
      id: ANTHOLOGY_WORK_ID,
      title: ANTHOLOGY_WORK_TITLE,
      toctitle: { title: ANTHOLOGY_WORK_TITLE },
      linktitle: ANTHOLOGY_WORK_TITLE,
      breadcrumbtitle: ANTHOLOGY_WORK_TITLE,
      year: null,
      published: null,
      status: 'complete',
      type: 'poetry',
      has_content: texts.length > 0,
      virtualType: 'anthology',
      sourceFiles: Array.from(sourceFiles),
      sections,
      textIds: sections.flatMap(section => section.texts.map(text => text.id)),
    });
  });
};

export {
  ANTHOLOGY_WORK_ID,
  ANTHOLOGY_WORK_TITLE,
  buildVirtualAnthologyWorks,
  isAnthologyText,
  publicationTextId,
  resolveAuthorId,
  sourceFilesForText,
  sourceWorkFilename,
  sourceWorkKey,
  textsForWork,
  worksForPoet,
};
