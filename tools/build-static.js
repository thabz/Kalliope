const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const mkdirp = require('mkdirp');
const Paths = require('../common/paths.js');
const CommonData = require('../common/commondata.js');
const {
  isFileModified,
  markFileDirty,
  refreshFilesModifiedCache,
  loadCachedJSON,
  writeCachedJSON,
} = require('./libs/caching.js');
const {
  fileExists,
  safeMkdir,
  writeJSON,
  writeText,
  htmlToXml,
  replaceDashes,
  imageSizeSync,
  buildThumbnails,
} = require('./libs/helpers.js');
const {
  all_poet_ids,
  build_poets_json,
  build_poets_by_country_json,
} = require('./build-static/poets.js');
const {
  build_dict_first_pass,
  build_dict_second_pass,
} = require('./build-static/dict.js');
const {
  loadXMLDoc,
  safeGetText,
  safeGetAttr,
  getChildren,
  getChildByTagName,
  getChildrenByTagName,
  getElementByTagName,
  getElementsByTagNames,
  safeGetInnerXML,
  tagName,
} = require('./build-static/xml.js');
const { build_sitemap_xml } = require('./build-static/sitemap.js');
const { build_keywords } = require('./build-static/keywords.js');
const { build_about_pages } = require('./build-static/about.js');
const { build_portraits_json } = require('./build-static/portraits.js');
const { build_todays_events_json } = require('./build-static/today.js');
const {
  extractDates,
  extractTitle,
  extractSubtitles,
  get_notes,
  get_pictures,
} = require('./build-static/parsing.js');
const {
  build_person_or_keyword_refs,
  build_mentions_json,
} = require('./build-static/mentions.js');
const {
  build_variants,
  resolve_variants,
  primaryTextVariantId,
} = require('./build-static/variants.js');
const { build_artwork } = require('./build-static/artwork.js');
const { flushImageSizeCache } = require('./build-static/image.js');
const {
  poetName,
  workName,
  workLinkName,
} = require('./build-static/formatting.js');
const {
  build_global_lines_json,
  build_poet_lines_json,
} = require('./build-static/lines.js');
const {
  build_museums,
  build_museum_url,
} = require('./build-static/museums.js');
const {
  b,
  print_benchmarking_results,
} = require('./build-static/benchmarking.js');
const { build_works_toc, build_section_toc } = require('./build-static/toc.js');
const { update_elasticsearch } = require('./build-static/elastic.js');
const {
  build_textrefs,
  mark_ref_destinations_dirty,
} = require('./build-static/textrefs.js');
const { build_anniversaries_ical } = require('./build-static/ical.js');
const {
  build_global_timeline,
  build_poet_timeline_json,
} = require('./build-static/timeline.js');

let collected = {
  texts: new Map(),
  works: new Map(),
  workids: new Map(),
  keywords: new Map(),
  poets: new Map(),
  dict: new Map(),
  timeline: new Array(),
  person_or_keyword_reference: new Map(),
};

// Ready after second pass
let collected_works = new Map();

const build_bio_json = collected => {
  collected.poets.forEach((poet, poetId) => {
    // Skip if all of the participating xml files aren't modified
    if (
      !isFileModified(
        'data/events.xml',
        ...collected.workids
          .get(poetId)
          .map(workId => `fdirs/${poet.id}/${workId}.xml`),
        `fdirs/${poet.id}/info.xml`,
        `fdirs/${poet.id}/events.xml`,
        `fdirs/${poet.id}/portraits.xml`,
        `fdirs/${poet.id}/bio.xml`
      )
    ) {
      return;
    }

    safeMkdir(`static/api/${poet.id}`);
    const bioXmlPath = `fdirs/${poet.id}/bio.xml`;
    const data = {
      poet,
      content_html: null,
    };
    const doc = loadXMLDoc(bioXmlPath);
    if (doc != null) {
      const bio = getChildByTagName(doc, 'bio');
      const head = getChildByTagName(bio, 'head');
      const body = getChildByTagName(bio, 'body');
      let author = safeGetText(head, 'author');
      data.content_html = htmlToXml(safeGetInnerXML(body), collected);
      data.content_lang = 'da';
    }
    data.timeline = build_poet_timeline_json(poet, collected);
    data.portraits = build_portraits_json(poet, collected);
    const destFilename = `static/api/${poet.id}/bio.json`;
    console.log(destFilename);
    writeJSON(destFilename, data);
  });
};

const build_poet_workids = () => {
  let collected_workids = new Map(loadCachedJSON('collected.workids') || []);
  let found_changes = false;
  all_poet_ids().forEach(poetId => {
    const infoFilename = `fdirs/${poetId}/info.xml`;
    if (!fs.existsSync(infoFilename)) {
      throw new Error(`Missing info.xml in fdirs/${poetId}.`);
    }
    if (isFileModified(infoFilename)) {
      const doc = loadXMLDoc(infoFilename);
      const workIds = safeGetText(doc, 'works') || '';
      let items = workIds.split(',').filter(x => x.length > 0);
      collected_workids.set(poetId, items);
      found_changes = true;
    }
  });
  if (found_changes) {
    writeCachedJSON('collected.workids', Array.from(collected_workids));
  }
  return collected_workids;
};

const handle_text = (
  poetId,
  workId,
  text,
  textType, // poem, prose, section
  resolve_prev_next,
  section_titles
) => {
  if (
    !isFileModified(`fdirs/${poetId}/info.xml`, `fdirs/${poetId}/${workId}.xml`)
  ) {
    return;
  }
  const poet = collected.poets.get(poetId);
  const work = collected_works.get(poetId + '-' + workId);

  const textId = safeGetAttr(text, 'id');
  const head = getChildByTagName(text, 'head');
  const firstline = extractTitle(head, 'firstline');
  let title = extractTitle(head, 'title') || firstline; // {title: xxx, prefix: xxx}
  let indextitle = extractTitle(head, 'indextitle') || title;
  let linktitle = extractTitle(head, 'linktitle') || indextitle || title;

  const keywords = safeGetText(head, 'keywords');
  const isBible = poetId === 'bibel';
  const isFolkevise =
    poetId === 'folkeviser' || (poetId === 'tasso' && workId === '1581');

  let subtitles = extractSubtitles(head, 'subtitle', collected);
  let suptitles = extractSubtitles(head, 'suptitle', collected);

  let keywordsArray = [];
  if (keywords) {
    keywordsArray = keywords.split(',').map(k => {
      let type = null;
      let title = null;
      if (collected.poets.get(k) != null) {
        type = 'poet';
        title = poetName(collected.poets.get(k));
      } else if (collected.keywords.get(k) != null) {
        type = 'keyword';
        title = collected.keywords.get(k).title;
      } else {
        type = 'subject';
        title = k;
      }
      return {
        id: k,
        type,
        title,
      };
    });
  }

  let refsArray = (collected.textrefs.get(textId) || [])
    .filter(id => {
      // Hvis en tekst har varianter som også henviser til denne,
      // vil vi kun vise den ældste variant.
      return primaryTextVariantId(id, collected) === id;
    })
    .map(id => {
      const meta = collected.texts.get(id);
      const poet = poetName(collected.poets.get(meta.poetId));
      const workFormattet =
        meta.workId === 'andre'
          ? ''
          : ' - ' +
            workLinkName(collected.works.get(meta.poetId + '/' + meta.workId));

      return [
        [
          `${poet}: <a poem="${id}">»${meta.title}«</a>${workFormattet}`,
          { html: true },
        ],
      ];
    });

  const variantsArray = (resolve_variants(textId, collected) || [])
    .filter(id => {
      // Skip self
      return id !== textId;
    })
    .map(id => {
      const meta = collected.texts.get(id);
      const poet = poetName(collected.poets.get(meta.poetId));
      const work = workLinkName(
        collected.works.get(meta.poetId + '/' + meta.workId)
      );
      return [
        [
          `${poet}: <a poem="${id}">»${meta.title}«</a> – ${work}`,
          { html: true },
        ],
      ];
    });

  const foldername = Paths.textFolder(textId);
  const prev_next = resolve_prev_next(textId);

  const sourceNode = getChildByTagName(head, 'source');
  let source = null;
  let workSource = null;
  if (sourceNode != null) {
    const sourceId = safeGetAttr(sourceNode, 'in') || 'default';
    workSource = work.sources[sourceId];
    if (workSource == null) {
      throw new Error(
        `fdirs/${poetId}/${workId}.xml ${textId} references undefined source.`
      );
    }
    let pages = null;
    const pagesAttr = safeGetAttr(sourceNode, 'pages');
    let sourceBookRef = workSource ? workSource.source : null;
    const sourceNodeInner = safeGetInnerXML(sourceNode);
    if (sourceNodeInner.length > 0) {
      sourceBookRef = sourceNodeInner;
    }
    const facsimile =
      safeGetAttr(sourceNode, 'facsimile') ||
      (workSource ? workSource.facsimile : null);
    let facsimilePages = safeGetAttr(sourceNode, 'facsimile-pages');
    if (
      facsimilePages == null &&
      workSource != null &&
      workSource.facsimilePagesOffset != null &&
      pagesAttr != null
    ) {
      // Deduce facsimilePages from pages and facsimilePagesOffset.
      const pagesParts = pagesAttr.split(/-/).map(n => parseInt(n));
      const o = workSource.facsimilePagesOffset;
      const pFrom = pagesParts[0];
      const pTo = pagesParts[1] || pFrom;
      facsimilePages = [pFrom + o, pTo + o];
    } else if (facsimilePages != null) {
      const pagesParts = facsimilePages.split(/-/).map(n => parseInt(n));
      const pFrom = pagesParts[0];
      const pTo = pagesParts[1] || pFrom;
      facsimilePages = [pFrom, pTo];
    }
    if (facsimilePages[0] > facsimilePages[1]) {
      throw new Error(
        `fdirs/${poetId}/${workId}.xml ${textId} sideangivelser har fra > til.`
      );
    }
    if (facsimilePages[1] > workSource.facsimilePageCount) {
      throw new Error(
        `fdirs/${poetId}/${workId}.xml ${textId} sideangivelse ${facsimilePages[1]} rækker over antal facsimile-sider. Er facsimile-pages-offset ${workSource.facsimilePageCount} korrekt?`
      );
    }
    source = {
      source: sourceBookRef,
      pages: pagesAttr,
      facsimilePageCount: workSource.facsimilePageCount,
      facsimile,
      facsimilePages,
    };
  } else if (workSource != null) {
    // Dette er ikke nødvendigvis en fejl.
    console.log(`fdirs/${poetId}/${workId}: teksten ${textId} mangler source.`);
  }
  let content_html = null;
  let has_footnotes = false;
  let toc = null;
  if (textType === 'section') {
    // A linkable section with id
    if (title == null) {
      throw `fdirs/${poetId}/${workId}: section ${textId} mangler title.`;
    }
    const content = getChildByTagName(text, 'content');
    toc = build_section_toc(content);
  } else {
    // prose or poem
    const body = getChildByTagName(text, 'body');
    const rawBody = safeGetInnerXML(body);
    content_html = htmlToXml(
      rawBody,
      collected,
      textType === 'poem',
      isBible,
      isFolkevise
    );
    has_footnotes =
      rawBody.indexOf('<footnote') !== -1 || rawBody.indexOf('<note') !== -1;
  }
  mkdirp.sync(foldername);
  const text_data = {
    poet,
    work,
    prev: prev_next.prev,
    next: prev_next.next,
    section_titles,
    text: {
      id: textId,
      title: replaceDashes(title.title),
      title_prefix: title.prefix,
      linktitle: replaceDashes(linktitle.title),
      subtitles,
      suptitles,
      is_prose: tagName(text) === 'prose',
      text_type: textType,
      has_footnotes,
      notes: get_notes(head, collected),
      source,
      keywords: keywordsArray || [],
      refs: refsArray,
      variants: variantsArray,
      pictures: get_pictures(
        head,
        `/static/images/${poetId}`,
        `fdirs/${poetId}/${workId}.xml:${textId}`,
        collected
      ),
      content_lang: poet.lang,
      content_html,
      toc,
    },
  };
  console.log(Paths.textPath(textId));
  writeJSON(Paths.textPath(textId), text_data);
};

const handle_work = work => {
  const type = safeGetAttr(work, 'type');
  const poetId = safeGetAttr(work, 'author');
  const workId = safeGetAttr(work, 'id');
  let lines = [];

  const handle_section = (section, resolve_prev_next, section_titles) => {
    let poems = [];
    let proses = [];
    let toc = [];

    getChildren(section).forEach(part => {
      const partName = tagName(part);
      if (partName === 'poem') {
        const textId = safeGetAttr(part, 'id');
        const head = getChildByTagName(part, 'head');
        const firstline = extractTitle(head, 'firstline');
        const title = extractTitle(head, 'title') || firstline;
        const indextitle = extractTitle(head, 'indextitle') || title;
        const toctitle = extractTitle(head, 'toctitle') || title;
        if (indextitle == null) {
          throw `${textId} mangler førstelinje, indextitle og title i ${poetId}/${workId}.xml`;
        }
        if (firstline != null && firstline.title.indexOf('<') > -1) {
          throw `${textId} har markup i førstelinjen i ${poetId}/${workId}.xml`;
        }
        if (firstline != null && firstline.title.trim().length === 0) {
          throw `${textId} har blank førstelinje i ${poetId}/${workId}.xml`;
        }
        if (indextitle.title.indexOf('>') > -1) {
          throw `${textId} har markup i titlen i ${poetId}/${workId}.xml`;
        }
        if (toctitle == null) {
          throw `${textId} mangler toctitle, firstline og title i ${poetId}/${workId}.xml`;
        }
        lines.push({
          id: textId,
          work_id: workId,
          lang: collected.poets.get(poetId).lang,
          title: replaceDashes(indextitle.title),
          firstline: firstline == null ? null : replaceDashes(firstline.title),
        });
        toc.push({
          type: 'text',
          id: textId,
          title: htmlToXml(toctitle.title),
          prefix: replaceDashes(toctitle.prefix),
        });
        handle_text(
          poetId,
          workId,
          part,
          partName,
          resolve_prev_next,
          section_titles
        );
      } else if (partName === 'section') {
        const head = getChildByTagName(part, 'head');
        const level = parseInt(safeGetAttr(head, 'level') || '1');
        const sectionId = safeGetAttr(part, 'id');
        const title = extractTitle(head, 'title');
        const toctitle = extractTitle(head, 'toctitle') || title;
        if (toctitle == null) {
          throw `En section mangler toctitle eller title i ${poetId}/${workId}.xml`;
        }
        const linktitle = extractTitle(head, 'linktitle') || toctitle || title;
        const breadcrumb = { title: linktitle.title, id: sectionId };
        const subtoc = handle_section(
          getChildByTagName(part, 'content'),
          resolve_prev_next,
          [...section_titles, breadcrumb]
        );
        toc.push({
          type: 'section',
          id: sectionId,
          level: level,
          title: htmlToXml(toctitle.title),
          content: subtoc,
        });
        if (sectionId != null) {
          handle_text(
            poetId,
            workId,
            part,
            partName,
            resolve_prev_next,
            section_titles
          );
        }
      } else if (partName === 'prose') {
        const textId = safeGetAttr(part, 'id');
        const head = getChildByTagName(part, 'head');
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
        handle_text(
          poetId,
          workId,
          part,
          partName,
          resolve_prev_next,
          section_titles
        );
      }
    });
    return toc;
  };

  const workhead = getChildByTagName(work, 'workhead');
  const notes = get_notes(workhead, collected);
  const pictures = get_pictures(
    workhead,
    `/static/images/${poetId}`,
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

  // Create function to resolve prev/next links in texts
  const resolve_prev_next = (function() {
    const items = getElementsByTagNames(workbody, ['poem', 'prose', 'section'])
      .filter(part => safeGetAttr(part, 'id') != null)
      .map(part => {
        const textId = safeGetAttr(part, 'id');
        const head = getChildByTagName(part, 'head');
        const title = safeGetText(head, 'title');
        return { id: textId, title: title };
      });
    return textId => {
      const index = items.findIndex(x => {
        return x.id === textId;
      });
      let prev = null,
        next = null;
      if (index < items.length - 1) {
        next = items[index + 1];
      }
      if (index > 0) {
        prev = items[index - 1];
      }
      return { prev, next };
    };
  })();

  const toc = handle_section(workbody, resolve_prev_next, []);
  return { lines, toc, notes, pictures };
};

// Constructs collected.works and collected.texts to
// be used for resolving <xref poem="">, etc.
const works_first_pass = collected => {
  const texts = new Map(loadCachedJSON('collected.texts') || []);
  const works = new Map(loadCachedJSON('collected.works') || []);

  let found_changes = false;
  const force_reload = texts.size === 0 || works.size === 0;

  let parentIdsToFillIn = new Map(); // Bruges til nedenstående second-pass som klistrer parent-data på

  collected.workids.forEach((workIds, poetId) => {
    workIds.forEach(workId => {
      const workFilename = `fdirs/${poetId}/${workId}.xml`;
      if (!fileExists(workFilename)) {
        return;
      }
      if (!force_reload && !isFileModified(workFilename)) {
        return;
      } else {
        found_changes = true;
      }

      let doc = loadXMLDoc(workFilename);
      const work = getElementByTagName(doc, 'kalliopework');
      // touch fdirs/zahle/1843.xml; npm run build-static
      if (safeGetAttr(work, 'id') !== workId) {
        throw new Error(`${workFilename} has wrong id in <kalliopework>`);
      }

      const parentId = safeGetAttr(work, 'parent');
      const head = getElementByTagName(work, 'workhead');
      const workBody = getElementByTagName(work, 'workbody');
      const title = replaceDashes(safeGetText(head, 'title'));
      const toctitle = extractTitle(head, 'toctitle') || { title };
      const linktitle = replaceDashes(safeGetText(head, 'linktitle')) || title;
      const breadcrumbtitle = safeGetText(head, 'breadcrumbtitle') || title;
      const year = safeGetText(head, 'year');
      const status = safeGetAttr(work, 'status');
      const type = safeGetAttr(work, 'type');
      const subtitles = extractSubtitles(head, 'subtitle', collected);
      const dates = extractDates(head);
      // Sanity check
      if (safeGetAttr(work, 'author') !== poetId) {
        throw new Error(
          `fdirs/${poetId}/${workId}.xml has wrong author-attribute in <kalliopework>`
        );
      }
      const workTexts = getElementsByTagNames(workBody, [
        'poem',
        'prose',
        'section',
      ]);
      const fullWorkId = `${poetId}/${workId}`;
      works.set(fullWorkId, {
        id: workId,
        title,
        subtitles,
        toctitle,
        linktitle,
        breadcrumbtitle,
        year: year,
        status,
        type,
        has_content: workTexts.length > 0,
        published: dates.published || year,
      });

      if (parentId != null) {
        parentIdsToFillIn.set(fullWorkId, `${poetId}/${parentId}`);
      }

      workTexts.forEach(part => {
        const textId = safeGetAttr(part, 'id');
        if (tagName(part) === 'section' && textId == null) {
          return;
        }
        const head = getChildByTagName(part, 'head');
        const firstline = extractTitle(head, 'firstline');
        const title = extractTitle(head, 'title');
        const linktitle = extractTitle(head, 'linktitle');
        const indextitle = extractTitle(head, 'indextitle');

        const linkTitle = linktitle || title || firstline;
        const indexTitle = indextitle || title || firstline;

        if (linkTitle == null) {
          throw new Error(
            `fdirs/${poetId}/${workId}.xml has ${tagName(
              part
            )} ${textId} without title.`
          );
        }
        texts.set(textId, {
          id: textId,
          title: replaceDashes(linkTitle.title),
          firstline: replaceDashes(firstline == null ? null : firstline.title),
          indexTitle: replaceDashes(indexTitle.title),
          linkTitle: replaceDashes(linkTitle.title),
          type: tagName(part),
          poetId: poetId,
          workId: workId,
        });
      });
    });
  });

  // Second-pass som resolver parentIds til fulde parent objekter
  Array.from(parentIdsToFillIn.keys()).forEach(fullWorkId => {
    const parentId = parentIdsToFillIn.get(fullWorkId);
    const data = works.get(fullWorkId);
    data.parent = works.get(parentId);
    works.set(fullWorkId, data);
  });

  if (found_changes) {
    writeCachedJSON('collected.texts', Array.from(texts));
    writeCachedJSON('collected.works', Array.from(works));
  }
  return { works, texts };
};

const works_second_pass = collected => {
  collected.poets.forEach((poet, poetId) => {
    safeMkdir(`static/api/${poetId}`);

    collected.workids.get(poetId).forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!fileExists(filename)) {
        return;
      }
      if (!isFileModified(filename)) {
        return;
      }
      let doc = loadXMLDoc(filename);
      const work = getChildByTagName(doc, 'kalliopework');
      const status = safeGetAttr(work, 'status');
      const type = safeGetAttr(work, 'type');
      const head = getChildByTagName(work, 'workhead');
      const title = safeGetText(head, 'title');
      const year = safeGetText(head, 'year');
      //const data = { id: workId, title, year, status, type };
      const data = collected.works.get(`${poetId}/${workId}`);
      let sources = {};
      getChildrenByTagName(head, 'source').forEach(sourceNode => {
        let source = null;
        const sourceInner = safeGetInnerXML(sourceNode);
        if (sourceInner != null && sourceInner.length > 0) {
          source = { source: sourceInner };
        }
        if (source == null || source.source == null) {
          throw new Error(
            `fdirs/${poetId}/${workId}.xml has source with no title.`
          );
        }
        const sourceId = safeGetAttr(sourceNode, 'id') || 'default';
        let facsimile = safeGetAttr(sourceNode, 'facsimile');
        if (facsimile != null) {
          facsimile = facsimile.replace(/.pdf$/, '');
          let facsimilePagesOffset = safeGetAttr(
            sourceNode,
            'facsimile-pages-offset'
          );
          if (facsimilePagesOffset != null) {
            facsimilePagesOffset = parseInt(facsimilePagesOffset, 10);
          }

          const facsimilePageCount = safeGetAttr(
            sourceNode,
            'facsimile-pages-num'
          );
          if (facsimilePageCount == null) {
            throw new Error(
              `fdirs/${poetId}/${workId}.xml is missing facsimile-pages-num in source.`
            );
          }
          source = {
            ...source,
            facsimile,
            facsimilePageCount: parseInt(facsimilePageCount, 10),
            facsimilePagesOffset,
          };
        }
        sources[sourceId] = source;
      });
      data.sources = sources;
      collected_works.set(poetId + '-' + workId, data);

      // TODO: Make handle_work non-recursive by using a simple XPath
      // to select all the poems and prose texts.
      handle_work(work); // Creates texts
      doc = null;
    });
  });
};

const build_poet_works_json = collected => {
  collected.poets.forEach((poet, poetId) => {
    safeMkdir(`static/api/${poetId}`);

    const workFilenames = collected.workids
      .get(poetId)
      .map(workId => `fdirs/${poetId}/${workId}.xml`);
    if (
      !isFileModified(
        `fdirs/${poetId}/info.xml`,
        `fdirs/${poetId}/artwork.xml`,
        ...workFilenames
      )
    ) {
      return;
    }

    let works = [];
    collected.workids.get(poetId).forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!fileExists(filename)) {
        return;
      }

      // Copy the xml-file into static to allow for xml download.
      fs.createReadStream(filename).pipe(
        fs.createWriteStream(`static/api/${poetId}/${workId}.xml`)
      );
      let doc = loadXMLDoc(filename);
      const work = getChildByTagName(doc, 'kalliopework');
      const head = getChildByTagName(work, 'workhead');
      const body = getChildByTagName(work, 'workbody');
      const parent = safeGetAttr(work, 'parent');
      if (parent != null) {
        return;
      }
      const data = collected.works.get(`${poetId}/${workId}`);
      works.push(data);
    });

    let artwork = [];
    if (poet.has_artwork) {
      artwork = Array.from(collected.artwork.values())
        .filter(a => a.artistId === poetId)
        .map(picture => {
          return {
            lang: picture.lang,
            src: picture.src,
            size: picture.size,
            content_lang: picture.content_lang,
            content_html: picture.content_html,
            subjects: picture.subjects,
            year: picture.year,
          };
        });
    }

    const objectToWrite = {
      poet,
      works,
      artwork,
    };
    const worksOutFilename = `static/api/${poetId}/works.json`;
    console.log(worksOutFilename);
    writeJSON(worksOutFilename, objectToWrite);
  });
};

const build_news = collected => {
  ['da', 'en'].forEach(lang => {
    const path = `data/news_${lang}.xml`;
    if (!isFileModified(path)) {
      return;
    }
    const doc = loadXMLDoc(path);
    const items = getChildByTagName(doc, 'items');
    let list = [];
    getChildren(items).forEach(item => {
      if (tagName(item) !== 'item') {
        return;
      }
      const date = safeGetText(item, 'date');
      const body = getChildByTagName(item, 'body');
      const title = safeGetText(item, 'title');
      list.push({
        date,
        title,
        content_lang: lang,
        content_html: htmlToXml(safeGetInnerXML(body).trim(), collected),
      });
    });
    const outfile = `static/api/news_${lang}.json`;
    writeJSON(outfile, list);
    console.log(outfile);
  });
};

const build_redirects_json = collected => {
  let redirects = {};
  collected.poets.forEach((poet, poetId) => {
    if (!poet.has_works && !poet.has_artwork) {
      redirects[`/en/works/${poetId}`] = `/en/bio/${poetId}`;
      redirects[`/da/works/${poetId}`] = `/da/bio/${poetId}`;
    }
  });
  writeJSON('static/api/redirects.json', redirects);
};

const build_image_thumbnails = () => {
  buildThumbnails('static/images', isFileModified);
  buildThumbnails('static/kunst', isFileModified);
};

safeMkdir(`static/api`);
collected.workids = b('build_poet_workids', build_poet_workids);
const { works, texts } = b('works_first_pass', works_first_pass, collected);
collected.works = works;
collected.texts = texts;
b('build_person_or_keyword_refs', build_person_or_keyword_refs, collected);
collected.poets = b('build_poets_json', build_poets_json, collected);
b('mark_ref_destinations_dirty', mark_ref_destinations_dirty, collected);
b('build_poets_by_country_json', build_poets_by_country_json, collected);
collected.artwork = b('build_artwork', build_artwork, collected);
b('build_museums', build_museums, collected);
collected.variants = b('build_variants', build_variants, collected);
b('build_mentions_json', build_mentions_json, collected);
collected.textrefs = b('build_textrefs', build_textrefs, collected);
build_dict_first_pass(collected);
collected.keywords = b('build_keywords', build_keywords, collected);
b('build_poet_lines_json', build_poet_lines_json, collected);
b('build_poet_works_json', build_poet_works_json, collected);
b('works_second_pass', works_second_pass, collected);
b('build_works_toc', build_works_toc, collected);
collected.timeline = b(
  'build_global_timeline',
  build_global_timeline,
  collected
);
b('build_bio_json', build_bio_json, collected);
b('build_news', build_news, collected);
b('build_about_pages', build_about_pages, collected);
b('build_global_lines_json', build_global_lines_json, collected);
b('build_dict_second_pass', build_dict_second_pass, collected);
b('build_todays_events_json', build_todays_events_json, collected);
b('build_redirects_json', build_redirects_json, collected);
b('build_sitemap_xml', build_sitemap_xml, collected);
b('build_anniversaries_ical', build_anniversaries_ical, collected);
b('build_image_thumbnails', build_image_thumbnails);
b('update_elasticsearch', update_elasticsearch, collected);
refreshFilesModifiedCache();
flushImageSizeCache();
print_benchmarking_results();
