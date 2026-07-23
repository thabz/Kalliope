import { isFileModified } from '../libs/caching.js';
import {
  safeMkdir,
  writeJSON,
  htmlToXml,
  replaceDashes,
  fileExists,
} from '../libs/helpers.js';
import { collect_git_modified_dates } from './git.js';
import { mapLimit } from './concurrency.js';
import { createProgressReporter } from './progress.js';
import { extractTitle, get_notes, get_pictures } from './parsing.js';
import { workName } from './formatting.js';
import { sortWorks } from '../../common/worksort.js';
import {
  loadXMLDoc,
  getChildren,
  tagName,
  safeGetText,
  safeGetAttr,
  getChildByTagName,
  getChildrenByTagName,
} from './xml.js';
import {
  isAnthologyText,
  publicationTextId,
  resolveAuthorId,
  worksForPoet,
} from './anthologies.js';

// Rekursiv function som bruges til at bygge værkers indholdsfortegnelse,
// men også del-indholdstegnelser til de linkbare sektioner som har en id.
const build_section_toc = (section, publicationPoetId = null) => {
  let poems = [];
  let proses = [];
  let toc = [];

  getChildren(section).forEach((part) => {
    const partName = tagName(part);
    if (partName === 'text') {
      const sourceTextId = safeGetAttr(part, 'id');
      const textAuthorId = resolveAuthorId(part, publicationPoetId);
      const textId =
        isAnthologyText(textAuthorId, publicationPoetId) ?
          publicationTextId(sourceTextId)
        : sourceTextId;
      const head = getChildByTagName(part, 'head');
      const firstline = extractTitle(head, 'firstline');
      const title = extractTitle(head, 'title') || firstline;
      const toctitle = extractTitle(head, 'toctitle') || title;
      toc.push({
        type: 'text',
        id: textId,
        title: htmlToXml(toctitle.title),
        prefix: replaceDashes(toctitle.prefix),
      });
    } else if (partName === 'section') {
      const subtoc = build_section_toc(
        getChildByTagName(part, 'content'),
        publicationPoetId
      );
      const head = getChildByTagName(part, 'head');
      const level = parseInt(safeGetAttr(part, 'level') || '1');
      const sectionId = safeGetAttr(part, 'id');
      const title = extractTitle(head, 'title');
      const toctitle = extractTitle(head, 'toctitle') || title;
      toc.push({
        type: 'section',
        id: sectionId,
        level: level,
        title: htmlToXml(toctitle.title),
        prefix: replaceDashes(toctitle.prefix),
        content: subtoc,
      });
    }
  });
  return toc;
};

const extract_subworks = (poetId, workbody, collected) => {
  return getChildrenByTagName(workbody, 'subwork').map((subworkNode) => {
    const subworkId = safeGetAttr(subworkNode, 'ref');
    const subwork = collected.works.get(`${poetId}/${subworkId}`);
    if (subwork == null) {
      throw `${poetId}/${subworkId}.xml refereret i hovedfil, men findes ikke. Glemt at tilføje til <works> i fdirs/${poetId}/info.xml?`;
    }
    return subwork;
  });
};

const build_works_toc = async (collected) => {
  let modifiedDates = null;
  const getModifiedDates = () => {
    if (modifiedDates == null) {
      modifiedDates = collect_git_modified_dates();
    }
    return modifiedDates;
  };
  const progress = createProgressReporter('Skrev toc.json-filer', 100);

  const workFilesForPoet = (poetId) => {
    return Array.from(
      new Set(
        worksForPoet(collected, poetId).flatMap(work => work.sourceFiles || [])
      )
    ).filter(fileExists);
  };

  const worksForPaging = (poetId, poet) => {
    const works = worksForPoet(collected, poetId)
      .filter((work) => work != null && work.parent == null)
      .filter((work) => work.has_content);
    return sortWorks(poet, works);
  };

  const resolvePrevNextWork = (works, workId) => {
    const index = works.findIndex((work) => {
      return work.id === workId;
    });
    return {
      prev: index > 0 ? works[index - 1] : null,
      next: index >= 0 && index < works.length - 1 ? works[index + 1] : null,
    };
  };

  // Returns {toc, subworks, notes, pictures}
  const extract_work_data = async (work) => {
    const type = safeGetAttr(work, 'type');
    const poetId = safeGetAttr(work, 'author');
    const workId = safeGetAttr(work, 'id');
    const parentId = safeGetAttr(work, 'parent');
    let lines = [];

    const workhead = getChildByTagName(work, 'workhead');
    const notes = get_notes(workhead, collected);
    const pictures = await get_pictures(
      workhead,
      `/images/${poetId}`,
      `fdirs/${poetId}/${workId}`,
      collected
    );

    const workbody = getChildByTagName(work, 'workbody');
    if (workbody == null) {
      return {
        lines: [],
        toc: [],
        notes: [],
        pictures: [],
      };
    }
    let toc = build_section_toc(workbody, poetId);
    let subworks = extract_subworks(poetId, workbody, collected);
    return { lines, toc, subworks, notes, pictures };
  };

  const poetData = new Map();
  const jobs = [];
  collected.poets.forEach((poet, poetId) => {
    safeMkdir(`public/api/${poetId}`);
    const workFilenames = workFilesForPoet(poetId);
    const poetWorksModified =
      collected.poetMetadataDirty?.has(poetId) ||
      isFileModified(
        'tools/build-static/toc.js',
        'tools/build-static/anthologies.js',
        `fdirs/${poetId}/info.xml`,
        ...workFilenames
      );
    const pageWorks = worksForPaging(poetId, poet);
    poetData.set(poetId, { pageWorks, poet, poetWorksModified });
    worksForPoet(collected, poetId).forEach(work => {
      jobs.push({ poetId, workId: work.id, work });
    });
  });

  const results = await mapLimit(jobs, async ({ poetId, workId, work: workMeta }) => {
    const { pageWorks, poet, poetWorksModified } = poetData.get(poetId);
    if (workMeta.virtualType === 'anthology') {
      if (
        !poetWorksModified &&
        !isFileModified(
          'tools/build-static/toc.js',
          'tools/build-static/anthologies.js',
          ...workMeta.sourceFiles
        )
      ) {
        return;
      }
      const toc = workMeta.sections.map(section => ({
        type: 'section',
        id: null,
        level: 1,
        title: htmlToXml(workName(section.work)),
        content: section.texts.map(text => ({
          type: 'text',
          id: text.id,
          title: htmlToXml(text.tocTitle),
          prefix: text.tocPrefix,
        })),
      }));
      const { prev, next } = resolvePrevNextWork(pageWorks, workId);
      const modified = workMeta.sourceFiles
        .map(filename => getModifiedDates().get(filename))
        .filter(date => date != null)
        .sort()
        .pop();
      const tocFilename = `public/api/${poetId}/${workId}-toc.json`;
      writeJSON(tocFilename, {
        poet,
        toc,
        subworks: [],
        work: workMeta,
        notes: [],
        pictures: [],
        modified,
        prev,
        next,
      });
      progress.increment();
      return;
    }
    const filename = `fdirs/${poetId}/${workId}.xml`;
    if (!fileExists(filename)) {
      return;
    }
    if (!poetWorksModified && !isFileModified(filename)) {
      return;
    }
    let doc = loadXMLDoc(filename);
    const work = getChildByTagName(doc, 'kalliopework');
    const work_data = await extract_work_data(work);

    if (work_data) {
      const { prev, next } = resolvePrevNextWork(pageWorks, workId);
      const toc_file_data = {
        poet,
        toc: work_data.toc,
        subworks: work_data.subworks,
        work: collected.works.get(`${poetId}/${workId}`),
        notes: work_data.notes || [],
        pictures: work_data.pictures || [],
        modified: getModifiedDates().get(filename),
        prev,
        next,
      };
      const tocFilename = `public/api/${poetId}/${workId}-toc.json`;
      writeJSON(tocFilename, toc_file_data);
      progress.increment();
    }
    doc = null;
  });
  progress.finish();
  return results;
};

export {
  build_works_toc,
  build_section_toc,
};
