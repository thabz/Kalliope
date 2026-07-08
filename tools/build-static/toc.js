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
import { extractTitle, get_notes, get_pictures } from './parsing.js';
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

// Rekursiv function som bruges til at bygge værkers indholdsfortegnelse,
// men også del-indholdstegnelser til de linkbare sektioner som har en id.
const build_section_toc = (section) => {
  let poems = [];
  let proses = [];
  let toc = [];

  getChildren(section).forEach((part) => {
    const partName = tagName(part);
    if (partName === 'text') {
      const textId = safeGetAttr(part, 'id');
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
      const subtoc = build_section_toc(getChildByTagName(part, 'content'));
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
  const modifiedDates = collect_git_modified_dates();

  const workFilesForPoet = (poetId) => {
    return collected.workids
      .get(poetId)
      .map((workId) => `fdirs/${poetId}/${workId}.xml`)
      .filter(fileExists);
  };

  const worksForPaging = (poetId, poet) => {
    const works = collected.workids
      .get(poetId)
      .map((workId) => collected.works.get(`${poetId}/${workId}`))
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
    let toc = build_section_toc(workbody);
    let subworks = extract_subworks(poetId, workbody, collected);
    return { lines, toc, subworks, notes, pictures };
  };

  const poetData = new Map();
  const jobs = [];
  collected.poets.forEach((poet, poetId) => {
    safeMkdir(`public/api/${poetId}`);
    const workFilenames = workFilesForPoet(poetId);
    const poetWorksModified = isFileModified(
      `fdirs/${poetId}/info.xml`,
      ...workFilenames
    );
    const pageWorks = worksForPaging(poetId, poet);
    poetData.set(poetId, { pageWorks, poet, poetWorksModified });
    collected.workids.get(poetId).forEach((workId) => {
      jobs.push({ poetId, workId });
    });
  });

  return mapLimit(jobs, async ({ poetId, workId }) => {
    const { pageWorks, poet, poetWorksModified } = poetData.get(poetId);
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
        modified: modifiedDates.get(filename),
        prev,
        next,
      };
      const tocFilename = `public/api/${poetId}/${workId}-toc.json`;
      console.log(tocFilename);
      writeJSON(tocFilename, toc_file_data);
    }
    doc = null;
  });
};

export {
  build_works_toc,
  build_section_toc,
};
