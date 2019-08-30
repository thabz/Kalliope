const { isFileModified } = require('../libs/caching.js');
const {
  safeMkdir,
  writeJSON,
  loadXMLDoc,
  htmlToXml,
  replaceDashes,
  fileExists,
} = require('../libs/helpers.js');
const { extractTitle, get_notes, get_pictures } = require('./parsing.js');
const { safeGetText, safeGetAttr } = require('./xml.js');

// Rekursiv function som bruges til at bygge værkers indholdsfortegnelse,
// men også del-indholdstegnelser til de linkbare sektioner som har en id.
const build_section_toc = section => {
  let poems = [];
  let proses = [];
  let toc = [];

  section.childNodes().forEach(part => {
    const partName = part.name();
    if (partName === 'poem') {
      const textId = part.attr('id').value();
      const head = part.get('head');
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
      const subtoc = build_section_toc(part.get('content'));
      const head = part.get('head');
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
    } else if (partName === 'prose') {
      const textId = part.attr('id').value();
      const head = part.get('head');
      const title = extractTitle(head, 'title');
      const toctitle = extractTitle(head, 'toctitle') || title;
      if (toctitle == null) {
        throw `${textId} mangler title og toctitle i ${poetId}/${workId}.xml`;
      }
      toc.push({
        type: 'text',
        id: textId,
        title: htmlToXml(toctitle.title),
        prefix: toctitle.prefix,
      });
    }
  });
  return toc;
};

const extract_subworks = (poetId, workbody, collected) => {
  return workbody.find('//subwork').map(subworkNode => {
    const subworkId = safeGetAttr(subworkNode, 'ref');
    const subwork = collected.works.get(`${poetId}/${subworkId}`);
    if (subwork == null) {
      throw `${poetId}/${subworkId}.xml refereret i hovedfil, men findes ikke. Glemt at tilføje til <works> i fdirs/${poetId}/info.xml?`;
    }
    return subwork;
  });
};

const build_works_toc = collected => {
  // Returns {toc, subworks, notes, pictures}
  const extract_work_data = work => {
    const type = work.attr('type').value();
    const poetId = work.attr('author').value();
    const workId = work.attr('id').value();
    const parentId = safeGetAttr(work, 'parent');
    let lines = [];

    const workhead = work.get('workhead');
    const notes = get_notes(workhead, collected);
    const pictures = get_pictures(
      workhead,
      `/static/images/${poetId}`,
      `fdirs/${poetId}/${workId}`,
      collected
    );

    const workbody = work.get('workbody');
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

  collected.poets.forEach((poet, poetId) => {
    safeMkdir(`static/api/${poetId}`);

    collected.workids.get(poetId).forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!fileExists(filename)) {
          return
      }
      if (!isFileModified(filename)) {
        return;
      }
      let doc = loadXMLDoc(filename);
      const work = doc.get('//kalliopework');
      const status = work.attr('status').value();
      const type = work.attr('type').value();
      const parentId = safeGetAttr(work, 'parent');
      const head = work.get('workhead');
      const title = head.get('title').text();
      const toctitle = safeGetText(head, 'toctitle') || title;
      const linktitle = safeGetText(head, 'linktitle') || title;
      const breadcrumbtitle = safeGetText(head, 'breadcrumbtitle') || title;
      const year = head.get('year').text();
      const data = {
        id: workId,
        title,
        toctitle,
        breadcrumbtitle,
        linktitle,
        year,
        status,
        type,
      };
      const work_data = extract_work_data(work);
      const parentData = collected.works.get(parentId);

      if (work_data) {
        const toc_file_data = {
          poet,
          toc: work_data.toc,
          subworks: work_data.subworks,
          work: collected.works.get(`${poetId}/${workId}`),
          notes: work_data.notes || [],
          pictures: work_data.pictures || [],
        };

        // Find modified date i git.
        // Later: this turns out to be super-slow, building toc's
        // takes 151s instead of 9s. So I've disabled this.
        /*
          const modifiedDateString = execSync(
            `git log -1 --format="%ad" --date=iso-strict -- ${filename}`
          );
          toc_file_data.modified = modifiedDateString.toString().trim();
          */
        const tocFilename = `static/api/${poetId}/${workId}-toc.json`;
        console.log(tocFilename);
        writeJSON(tocFilename, toc_file_data);
      }
      doc = null;
    });
  });
};

module.exports = {
  build_works_toc,
  build_section_toc,
};
