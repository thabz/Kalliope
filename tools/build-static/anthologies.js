import { safeGetAttr } from './xml.js';
import { sourceWorkKey } from './work-cache.js';

const ANTHOLOGY_WORK_ID = 'antologier';
const ANTHOLOGY_WORK_TITLE = 'Tekster i andre udgivelser';

const isAnthologyText = (textAuthorId, workAuthorId) =>
  workAuthorId != null &&
  textAuthorId != null &&
  textAuthorId !== workAuthorId;

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

// Index the canonical texts by publication and the same objects by virtual TOC.
// A TOC reference never creates a second text record.
const buildCollectionIndexes = (collected) => {
  const worksByPoet = new Map();
  const textsByWork = new Map();
  collected.works.forEach((work, key) => {
    const poetId = key.slice(0, key.indexOf('/'));
    const works = worksByPoet.get(poetId) ?? [];
    works.push(work);
    worksByPoet.set(poetId, works);
  });
  collected.texts.forEach((text) => {
    const workPoetId = text.sourcePoetId ?? text.poetId;
    const poetWorks = textsByWork.get(workPoetId) ?? new Map();
    const texts = poetWorks.get(text.sourceWorkId ?? text.workId) ?? [];
    texts.push(text);
    poetWorks.set(text.sourceWorkId ?? text.workId, texts);
    textsByWork.set(workPoetId, poetWorks);
  });
  collected.works.forEach((work, key) => {
    if (work.virtualType !== 'anthology') {
      return;
    }
    const poetId = key.slice(0, key.indexOf('/'));
    const poetWorks = textsByWork.get(poetId) ?? new Map();
    poetWorks.set(work.id, work.textIds.map(id => collected.texts.get(id)));
    textsByWork.set(poetId, poetWorks);
  });
  collected.worksByPoet = worksByPoet;
  collected.textsByWork = textsByWork;
};

const worksForPoet = (collected, poetId) => {
  if (collected.worksByPoet != null) {
    return (collected.worksByPoet.get(poetId) ?? []).slice();
  }
  return Array.from(collected.works.entries())
    .filter(([key]) => key.startsWith(`${poetId}/`))
    .map(([, work]) => work);
};

const textsForWork = (collected, poetId, workId) => {
  if (collected.textsByWork != null) {
    return (collected.textsByWork.get(poetId)?.get(workId) ?? []).slice();
  }
  const work = collected.works.get(`${poetId}/${workId}`);
  if (work?.virtualType === 'anthology') {
    return work.textIds.map(id => collected.texts.get(id));
  }
  return Array.from(collected.texts.values()).filter(
    text => sourceWorkKey(text) === `${poetId}/${workId}`
  );
};

const compareSourceSections = (a, b) => {
  const aYear = a.work.year ?? a.work.published ?? '';
  const bYear = b.work.year ?? b.work.published ?? '';
  if (aYear !== bYear) {
    return aYear < bYear ? -1 : 1;
  }
  const titleOrder = a.work.title.localeCompare(b.work.title, 'da');
  return titleOrder !== 0 ? titleOrder : a.key.localeCompare(b.key, 'da');
};

const buildVirtualAnthologyWorks = collected => {
  delete collected.worksByPoet;
  delete collected.textsByWork;
  Array.from(collected.works.entries()).forEach(([key, work]) => {
    if (work.virtualType === 'anthology') {
      collected.works.delete(key);
    }
  });

  const textsByAuthor = new Map();
  collected.texts.forEach(text => {
    if (!isAnthologyText(text.poetId, text.sourcePoetId)) {
      return;
    }
    const texts = textsByAuthor.get(text.poetId) ?? [];
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
      const section = sectionsBySource.get(key) ?? {
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
          (a, b) => (a.sourceOrder ?? 0) - (b.sourceOrder ?? 0)
        ),
      }));
    const sourceFiles = new Set([`fdirs/${poetId}/info.xml`]);
    sections.forEach(section => {
      (section.work.sourceFiles ?? [
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
  buildCollectionIndexes,
  buildVirtualAnthologyWorks,
  isAnthologyText,
  resolveAuthorId,
  textsForWork,
  worksForPoet,
};
