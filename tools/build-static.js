const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const libxml = require('libxmljs');
const mkdirp = require('mkdirp');
const Paths = require('../pages/helpers/paths.js');
const CommonData = require('../pages/helpers/commondata.js');
const ics = require('ics');
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
  loadXMLDoc,
  htmlToXml,
  replaceDashes,
  imageSizeSync,
  buildThumbnails,
  resizeImage,
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
const { safeGetText, safeGetAttr } = require('./build-static/xml.js');
const {
  extractTitle,
  get_notes,
  get_pictures,
  get_picture,
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
const { build_works_toc, build_section_toc } = require('./build-static/toc.js');
const { update_elasticsearch } = require('./build-static/elastic.js');
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

const build_portraits_json = (poet, collected) => {
  let result = [];
  if (!poet.has_portraits) {
    return result;
  }
  const doc = loadXMLDoc(`fdirs/${poet.id}/portraits.xml`);
  if (doc != null) {
    onError = message => {
      throw `fdirs/${poet.id}/portraits.xml: ${message}`;
    };
    result = doc.find('//pictures/picture').map(picture => {
      picture = get_picture(
        picture,
        `/static/images/${poet.id}`,
        collected,
        onError
      );
      if (picture == null) {
        onError('har et billede uden src- eller ref-attribut.');
      }
      return picture;
    });
    const primaries = result.filter(p => p.primary);
    if (primaries.length > 1) {
      onError('har flere primary');
    }
    if (primaries.length == 0) {
      onError('mangler primary');
    }
  }
  return result;
};

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
      const bio = doc.get('//bio');
      const head = bio.get('head');
      const body = bio.get('body');
      let author = null;
      if (head && head.get('author')) {
        data.author = head.get('author').text();
      }
      data.content_html = htmlToXml(
        body
          .toString()
          .replace('<body>', '')
          .replace('</body>', ''),
        collected
      );
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
      const person = doc.get('//person');
      const workIds = person.get('works');
      let items = workIds
        ? workIds
            .text()
            .split(',')
            .filter(x => x.length > 0)
        : [];
      collected_workids.set(poetId, items);
      found_changes = true;
    }
  });
  if (found_changes) {
    writeCachedJSON('collected.workids', Array.from(collected_workids));
  }
  return collected_workids;
};

const extract_subtitles = (head, tag = 'subtitle') => {
  let subtitles = null;
  const subtitle = head.get(tag);
  if (subtitle && subtitle.find('line').length > 0) {
    subtitles = subtitle.find('line').map(s => {
      return htmlToXml(
        s
          .toString()
          .replace('<line>', '')
          .replace('</line>', '')
          .replace('<line/>', ''),
        collected,
        true
      );
    });
  } else if (subtitle) {
    const subtitleString = subtitle
      .toString()
      .replace(`<${tag}>`, '')
      .replace(`</${tag}>`, '');
    if (subtitleString.indexOf(`<${tag}/>`) === -1) {
      subtitles = [htmlToXml(subtitleString, collected, true)];
    }
  }
  return subtitles;
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

  const textId = text.attr('id').value();
  const head = text.get('head');
  const firstline = extractTitle(head, 'firstline');
  let title = extractTitle(head, 'title') || firstline; // {title: xxx, prefix: xxx}
  let indextitle = extractTitle(head, 'indextitle') || title;
  let linktitle = extractTitle(head, 'linktitle') || indextitle || title;

  const keywords = head.get('keywords');
  const isBible = poetId === 'bibel';
  const isFolkevise =
    poetId === 'folkeviser' || (poetId === 'tasso' && workId === '1581');

  let subtitles = extract_subtitles(head, 'subtitle');
  let suptitles = extract_subtitles(head, 'suptitle');

  let keywordsArray = [];
  if (keywords) {
    keywordsArray = keywords
      .text()
      .split(',')
      .map(k => {
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

  const sourceNode = head.get('source');
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
    if (sourceNode.text().trim().length > 0) {
      sourceBookRef = sourceNode
        .toString()
        .replace(/<source[^>]*>/, '')
        .replace(/<\/source>/, '');
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
        `fdirs/${poetId}/${workId}.xml ${textId} sideangivelse ${
          facsimilePages[1]
        } rækker over antal facsimile-sider. Er facsimile-pages-offset ${
          workSource.facsimilePageCount
        } korrekt?`
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
    const content = text.get('content');
    toc = build_section_toc(content);
  } else {
    // prose or poem
    const body = text.get('body');
    const rawBody = body
      .toString()
      .replace('<body>', '')
      .replace('</body>', '');
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
      is_prose: text.name() === 'prose',
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
  const type = work.attr('type').value();
  const poetId = work.attr('author').value();
  const workId = work.attr('id').value();
  let lines = [];

  const handle_section = (section, resolve_prev_next, section_titles) => {
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
        const head = part.get('head');
        const level = parseInt(safeGetAttr(head, 'level') || '1');
        const sectionId = safeGetAttr(part, 'id');
        const title = extractTitle(head, 'title');
        const toctitle = extractTitle(head, 'toctitle') || title;
        const linktitle = extractTitle(head, 'linktitle') || toctitle || title;
        const breadcrumb = { title: linktitle.title, id: sectionId };
        const subtoc = handle_section(part.get('content'), resolve_prev_next, [
          ...section_titles,
          breadcrumb,
        ]);
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

  // Create function to resolve prev/next links in texts
  const resolve_prev_next = (function() {
    const items = workbody.find('//poem|//prose|//section[@id]').map(part => {
      const textId = part.attr('id').value();
      const head = part.get('head');
      const title = head.get('title') ? head.get('title').text() : null;
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

const extractDates = head => {
  const dates = head.get('dates');
  const result = {};
  if (dates != null) {
    result.published = safeGetText(dates, 'published');
    result.event = safeGetText(dates, 'event');
    result.written = safeGetText(dates, 'written');
  }
  return result;
};

// Constructs collected.works and collected.texts to
// be used for resolving <xref poem="">, etc.
const works_first_pass = collected => {
  let texts = new Map(loadCachedJSON('collected.texts') || []);
  let works = new Map(loadCachedJSON('collected.works') || []);

  let found_changes = false;
  const force_reload = texts.size === 0 || works.size === 0;

  let parentIdsToFillIn = new Map(); // Bruges til nedenstående second-pass som klistrer parent-data på

  collected.workids.forEach((workIds, poetId) => {
    workIds.forEach(workId => {
      const workFilename = `fdirs/${poetId}/${workId}.xml`;
      if (!force_reload && !isFileModified(workFilename)) {
        return;
      } else {
        found_changes = true;
      }

      let doc = loadXMLDoc(workFilename);
      const work = doc.get('//kalliopework');
      const attrId = work.attr('id').value();
      if (attrId !== workId) {
        throw new Error(`${workFilename} has wrong id in <kalliopework>`);
      }
      const parentId = safeGetAttr(work, 'parent');
      const head = work.get('workhead');
      const title = replaceDashes(safeGetText(head, 'title'));
      const toctitle = extractTitle(head, 'toctitle') || { title };
      const linktitle = replaceDashes(safeGetText(head, 'linktitle')) || title;
      const breadcrumbtitle = safeGetText(head, 'breadcrumbtitle') || title;
      const year = head.get('year').text();
      const status = work.attr('status').value();
      const type = work.attr('type').value();
      const subtitles = extract_subtitles(head);
      const dates = extractDates(head);
      // Sanity check
      if (work.attr('author').value() !== poetId) {
        throw new Error(
          `fdirs/${poetId}/${workId}.xml has wrong author-attribute in <kalliopework>`
        );
      }
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
        has_content: work.find('//poem|//prose|//subwork').length > 0,
        published: dates.published || year,
      });

      if (parentId != null) {
        parentIdsToFillIn.set(fullWorkId, `${poetId}/${parentId}`);
      }

      work.find('//poem|//prose|//section[@id]').forEach(part => {
        const textId = part.attr('id').value();
        const head = part.get('head');
        const title = extractTitle(head, 'title');
        const firstline = extractTitle(head, 'firstline');
        const linktitle = extractTitle(head, 'linktitle');
        const indextitle = extractTitle(head, 'indextitle');

        const linkTitle = linktitle || title || firstline;
        const indexTitle = indextitle || title || firstline;

        if (linkTitle == null) {
          throw new Error(
            `fdirs/${poetId}/${workId}.xml has ${part.name()} ${textId} without title.`
          );
        }
        texts.set(textId, {
          title: replaceDashes(linkTitle.title),
          firstline: replaceDashes(firstline == null ? null : firstline.title),
          indexTitle: replaceDashes(indexTitle.title),
          type: part.name(),
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
      if (!isFileModified(filename)) {
        return;
      }
      let doc = loadXMLDoc(filename);
      const work = doc.get('//kalliopework');
      const status = work.attr('status').value();
      const type = work.attr('type').value();
      const head = work.get('workhead');
      const title = head.get('title').text();
      const year = head.get('year').text();
      //const data = { id: workId, title, year, status, type };
      const data = collected.works.get(`${poetId}/${workId}`);
      let sources = {};
      head.find('source').forEach(sourceNode => {
        let source = null;
        if (sourceNode.text().trim().length > 0) {
          const title = sourceNode
            .toString()
            .replace(/<source[^>]*>/, '')
            .replace(/<\/source>/, '');
          source = { source: title };
        }
        const sourceId = safeGetAttr(sourceNode, 'id') || 'default';
        if (source == null || source.source == null) {
          throw new Error(
            `fdirs/${poetId}/${workId}.xml has source with no title.`
          );
        }
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

const build_textrefs = collected => {
  let textrefs = new Map(loadCachedJSON('collected.textrefs') || []);
  const force_reload = textrefs.size == 0;
  let found_changes = false;
  const regexps = [
    /xref\s.*?poem="([^",]*)/g,
    /a\s.*?poem="([^",]*)/g,
    /xref bibel="([^",]*)/g,
  ];
  collected.poets.forEach((poet, poetId) => {
    collected.workids.get(poetId).forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!force_reload && !isFileModified(filename)) {
        return;
      } else {
        found_changes = true;
      }
      let doc = loadXMLDoc(filename);
      const texts = doc.find('//poem|//prose');
      texts.forEach(text => {
        const notes = text.find('head/notes/note|body//footnote|body//note');
        notes.forEach(note => {
          regexps.forEach(regexp => {
            while ((match = regexp.exec(note.toString())) != null) {
              const fromId = text.attr('id').value();
              const toId = match[1];
              const array = textrefs.get(toId) || [];
              if (array.indexOf(fromId) === -1) {
                array.push(fromId);
              }
              textrefs.set(toId, array);
            }
          });
        });
      });
    });
  });
  if (found_changes) {
    writeCachedJSON('collected.textrefs', Array.from(textrefs));
  }
  return textrefs;
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

      // Copy the xml-file into static to allow for xml download.
      fs.createReadStream(filename).pipe(
        fs.createWriteStream(`static/api/${poetId}/${workId}.xml`)
      );
      let doc = loadXMLDoc(filename);
      const work = doc.get('//kalliopework');
      const head = work.get('workhead');
      const body = work.get('workbody');
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

const build_keywords = () => {
  safeMkdir('static/api/keywords');
  let collected_keywords = new Map(loadCachedJSON('collected.keywords') || []);
  const folder = 'data/keywords';
  const filenames = fs
    .readdirSync(folder)
    .filter(x => x.endsWith('.xml'))
    .map(x => `${folder}/${x}`);
  if (collected_keywords.size === 0 || isFileModified(...filenames)) {
    collected_keywords = new Map();
    let keywords_toc = new Array();
    filenames.map(path => {
      if (!path.endsWith('.xml')) {
        return;
      }
      const doc = loadXMLDoc(path);
      const keyword = doc.get('//keyword');
      const head = keyword.get('head');
      const body = keyword.get('body');
      const id = keyword.attr('id').value();
      const is_draft =
        keyword.attr('draft') != null
          ? keyword.attr('draft').value() === 'true'
          : false;
      const title = head.get('title').text();
      const pictures = get_pictures(
        head,
        '/static/images/keywords',
        path,
        collected
      );
      const author = safeGetText(head, 'author');
      const rawBody = body
        .toString()
        .replace('<body>', '')
        .replace('</body>', '');
      const content_html = htmlToXml(rawBody, collected);
      const has_footnotes =
        rawBody.indexOf('<footnote') !== -1 || rawBody.indexOf('<note') !== -1;
      const data = {
        id,
        title,
        is_draft,
        author,
        pictures,
        has_footnotes,
        content_lang: 'da',
        content_html,
      };
      keywords_toc.push({
        id,
        title,
        is_draft,
      });
      const outFilename = `static/api/keywords/${id}.json`;
      console.log(outFilename);
      writeJSON(outFilename, data);
      collected_keywords.set(id, { id, title });
    });
    writeCachedJSON('collected.keywords', Array.from(collected_keywords));
    const outFilename = `static/api/keywords.json`;
    console.log(outFilename);
    writeJSON(outFilename, keywords_toc);
  }
  return collected_keywords;
};

const build_news = collected => {
  ['da', 'en'].forEach(lang => {
    const path = `data/news_${lang}.xml`;
    if (!isFileModified(path)) {
      return;
    }
    const doc = loadXMLDoc(path);
    const items = doc.get('//items');
    let list = [];
    items.childNodes().forEach(item => {
      if (item.name() !== 'item') {
        return;
      }
      const date = item.get('date').text();
      const body = item.get('body');
      const title = safeGetText(item, 'title');
      list.push({
        date,
        title,
        content_lang: lang,
        content_html: htmlToXml(
          body
            .toString()
            .replace('<body>', '')
            .replace('</body>', '')
            .trim(),
          collected
        ),
      });
    });
    const outfile = `static/api/news_${lang}.json`;
    writeJSON(outfile, list);
    console.log(outfile);
  });
};

const build_about_pages = collected => {
  safeMkdir(`static/api/about`);
  // Regenerate all about-pages if any work-file is modified, since our poem-counts then might be off
  const areAnyWorkModified = Array.from(collected.works.keys())
    .filter(key => {
      return isFileModified(`fdirs/${key}.xml`);
    })
    .reduce((result, b) => b || result, false);
  const folder = 'data/about';
  const filenames = fs
    .readdirSync(folder)
    .filter(x => x.endsWith('.xml'))
    .map(x => {
      return {
        xml: `${folder}/${x}`,
        json: `static/api/about/${x.replace(/.xml$/, '.json')}`,
      };
    })
    .filter(paths => isFileModified(paths.xml) || areAnyWorkModified)
    .forEach(paths => {
      let lang = 'da';
      const m = paths.xml.match(/_(..)\.xml$/);
      if (m) {
        lang = m[1];
      }
      const doc = loadXMLDoc(paths.xml);
      const about = doc.get('//about');
      const head = about.get('head');
      const body = about.get('body');
      const title = head.get('title').text();
      const pictures = get_pictures(
        head,
        '/static/images/about',
        paths.xml,
        collected
      );
      const author = safeGetText(head, 'author');
      const poemsNum = Array.from(collected.texts.values())
        .map(t => (t.type === 'poem' ? 1 : 0))
        .reduce((sum, v) => sum + v, 0);
      const poetsNum = Array.from(collected.poets.values())
        .map(t => (t.type === 'poet' ? 1 : 0))
        .reduce((sum, v) => sum + v, 0);
      const notes = get_notes(head, collected, {
        poemsNum: poemsNum.toLocaleString(lang),
        poetsNum: poetsNum.toLocaleString(lang),
        worksNum: collected.works.size.toLocaleString(lang),
        langsNum: 8 - 1, // gb og us er begge engelsk.
      });
      // Data er samme format som keywords
      const data = {
        id: paths.xml,
        title,
        author,
        has_footnotes: false,
        pictures,
        notes,
        content_lang: 'da',
        content_html: htmlToXml(
          body
            .toString()
            .replace('<body>', '')
            .replace('</body>', ''),
          collected
        ),
      };
      console.log(paths.json);
      writeJSON(paths.json, data);
    });
};

let b_results = [];
// Benchmarking
const b = (name, f, args) => {
  const beforeMillis = Date.now();
  const result = f(args);
  const afterMillis = Date.now();
  b_results.push({ name, millis: afterMillis - beforeMillis });
  return result;
};
const print_benchmarking_results = () => {
  let sum = 0;
  b_results.forEach(r => {
    sum += r.millis;
    console.log(`${r.name}: ${r.millis}ms`);
  });
  console.log(`sum: ${sum}ms`);
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

const build_todays_events_json = collected => {
  const portrait_descriptions = Array.from(collected.poets.values()).map(
    poet => {
      return `fdirs/${poet.id}/portraits.xml`;
    }
  );
  const poet_info_files = Array.from(collected.poets.values()).map(poet => {
    return `fdirs/${poet.id}/info.xml`;
  });
  if (!isFileModified(...poet_info_files, ...portrait_descriptions)) {
    return;
  }

  const langs = ['da', 'en'];

  safeMkdir('static/api/today');
  langs.forEach(lang => {
    safeMkdir(`static/api/today/${lang}`);
  });

  const collected_events = new Map();

  const add_event = (lang, monthAndDay, event) => {
    const key = `${lang}-${monthAndDay}`;
    let items = collected_events.get(key) || [];
    items.push(event);
    collected_events.set(key, items);
  };

  collected.poets.forEach((poet, poetId) => {
    if (poet.period != null) {
      const born = poet.period.born;
      const dead = poet.period.dead;
      if (born != null && born.date != null) {
        const m = born.date.match(/(\d\d\d\d)-(\d\d-\d\d)/);
        if (m != null) {
          const year = m[1];
          const monthAndDay = m[2];
          langs.forEach(lang => {
            content_html = `<a poet="${poetId}">${poetName(poet)}</a>`;
            content_html += lang === 'da' ? ' født' : ' born';
            if (born.place != null) {
              content_html += `, ${born.place}.`;
            } else {
              content_html += '.';
            }
            content_html = content_html.replace(/\.+$/, '.');
            add_event(lang, monthAndDay, {
              type: 'text',
              content_html: [[content_html, { html: true }]],
              content_lang: lang,
              date: born.date,
              context: { event_type: 'born', year, poet },
            });
          });
        }
      }
      if (dead != null && dead.date != null) {
        const m = dead.date.match(/(\d\d\d\d)-(\d\d-\d\d)/);
        if (m != null) {
          const year = m[1];
          const monthAndDay = m[2];
          langs.forEach(lang => {
            content_html = `<a poet="${poetId}">${poetName(poet)}</a>`;
            content_html += lang === 'da' ? ' død' : ' dead';
            if (dead.place != null) {
              content_html += `, ${dead.place}.`;
            } else {
              content_html += '.';
            }
            content_html = content_html.replace(/\.+$/, '.');
            add_event(lang, monthAndDay, {
              type: 'text',
              content_html: [[content_html, { html: true }]],
              date: dead.date,
              content_lang: lang,
              context: { event_type: 'dead', year, poet },
            });
          });
        }
      }
    }
  });

  langs.forEach(lang => {
    const preferredCountries =
      lang === 'da' ? ['se', 'de', 'dk'] : ['us', 'gb']; // Større index er større vægt
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? '0' + d : d;
        const mm = m < 10 ? '0' + m : m;
        const events = collected_events.get(`${lang}-${mm}-${dd}`) || [];
        if (events.filter(e => e.type === 'image').length === 0) {
          // There are no images from events in today.xml. Find the most relevant poet portrait.
          const weighted = events
            .filter(e => e.context.poet.has_portraits)
            .map(event => {
              const poet = event.context.poet;
              let weight = 0;
              weight += poet.has_portraits ? 12 : 6; // TODO: Find the one with a portrait description
              weight += poet.has_texts ? 10 : 5;
              weight += poet.has_works ? 6 : 3;
              weight += preferredCountries.indexOf(poet.country);
              weight += event.context.event_type === 'born' ? 3 : 0; // Foretræk fødselsdage
              return {
                weight,
                event,
              };
            })
            .sort((a, b) => (a.weight < b.weight ? 1 : -1));
          if (weighted.length > 0) {
            const event = weighted[0].event;
            const poet = event.context.poet;
            let content_html = null;
            const primary_portrait = build_portraits_json(
              poet,
              collected
            ).filter(p => p.primary)[0];
            if (
              primary_portrait != null &&
              primary_portrait.content_html[0][0].length > 0
            ) {
              content_html = primary_portrait.content_html;
            } else {
              content_html = [[poetName(poet)]];
            }
            if (primary_portrait != null) {
              const data = {
                type: 'image',
                src: primary_portrait.src,
                content_html,
                content_lang: lang,
                date: event.date,
              };
              add_event(lang, `${mm}-${dd}`, data);
            }
          }
        }
      }
    }
  });

  langs.forEach(lang => {
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? '0' + d : d;
        const mm = m < 10 ? '0' + m : m;
        const events = collected_events.get(`${lang}-${mm}-${dd}`) || [];
        const path = `static/api/today/${lang}/${mm}-${dd}.json`;
        console.log(path);
        writeJSON(path, events);
      }
    }
  });
};

const build_image_thumbnails = () => {
  buildThumbnails('static/images', isFileModified);
  buildThumbnails('static/kunst', isFileModified);
};

const build_sitemap_xml = collected => {
  safeMkdir(`static/sitemaps`);

  const write_sitemap = (filename, urls) => {
    let xmlUrls = urls.map(url => {
      return `  <url><loc>${url}</loc></url>`;
    });
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += xmlUrls.join('\n');
    xml += '\n</urlset>\n';
    writeText(filename, xml);
  };

  let urls = [];
  ['da', 'en'].forEach(lang => {
    urls.push(`https://kalliope.org/${lang}/`);
    urls.push(`https://kalliope.org/${lang}/keywords`);
    collected.keywords.forEach((keyword, keywordId) => {
      urls.push(`https://kalliope.org/${lang}/keyword/${keywordId}`);
    });
    collected.poets.forEach((poet, poetId) => {
      urls.push(`https://kalliope.org/${lang}/bio/${poetId}`);
      if (poet.has_mentions) {
        urls.push(`https://kalliope.org/${lang}/mentions/${poetId}`);
      }
    });
  });
  write_sitemap('static/sitemaps/global.xml', urls);

  collected.poets.forEach((poet, poetId) => {
    const filenames = collected.workids
      .get(poetId)
      .map(workId => `fdirs/${poetId}/${workId}.xml`);
    if (!isFileModified(...filenames)) {
      return;
    }
    const poet_text_urls = [];
    ['da', 'en'].forEach(lang => {
      if (poet.has_works || poet.has_artwork) {
        poet_text_urls.push(`https://kalliope.org/${lang}/works/${poetId}`);
      }
      if (poet.has_poems) {
        poet_text_urls.push(
          `https://kalliope.org/${lang}/texts/${poetId}/titles`
        );
        poet_text_urls.push(
          `https://kalliope.org/${lang}/texts/${poetId}/first`
        );
      }
      collected.workids.get(poetId).forEach(workId => {
        const work = collected.works.get(`${poetId}/${workId}`);
        if (work.has_content) {
          poet_text_urls.push(
            `https://kalliope.org/${lang}/work/${poetId}/${workId}`
          );
          const filename = `fdirs/${poetId}/${workId}.xml`;
          let doc = loadXMLDoc(filename);
          if (doc == null) {
            console.log("Couldn't load", filename);
          }
          doc.find('//poem|//prose').forEach(part => {
            const textId = part.attr('id').value();
            poet_text_urls.push(`https://kalliope.org/${lang}/text/${textId}`);
          });
        }
      });
    });
    write_sitemap(`static/sitemaps/${poetId}.xml`, poet_text_urls);
  });

  const sitemaps_urls_xml = Array.from(collected.poets.values())
    .filter(poet => poet.has_works || poet.has_artwork)
    .map(poet => {
      return `https://kalliope.org/static/sitemaps/${poet.id}.xml`;
    })
    .map(url => {
      return `  <sitemap><loc>${url}</loc></sitemap>`;
    });
  sitemaps_urls_xml.push(
    `  <sitemap><loc>https://kalliope.org/static/sitemaps/global.xml</loc></sitemap>`
  );
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml +=
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">>\n';
  xml += sitemaps_urls_xml.join('\n');
  xml += '\n</sitemapindex>\n';
  writeText('static/sitemap.xml', xml);
};

const build_anniversaries_ical = collected => {
  let events = [];
  let [nowYear, nowMonth, nowDay] = new Date()
    .toISOString()
    .split('T')[0]
    .split('-')
    .map(s => parseInt(s, 10));

  const handleDate = (poet, eventType, date) => {
    var [year, month, day] = date.split('-').map(s => parseInt(s, 10));
    if (month == null || day == null || year == null) {
      // Ignorer datoer som ikke er fulde datoer, såsom "1300?" og "1240 ca."
      return;
    }
    for (let eventYear = nowYear - 1; eventYear < nowYear + 3; eventYear++) {
      let eventDate = new Date();
      eventDate.setDate(day);
      eventDate.setMonth(month - 1);
      eventDate.setYear(eventYear);
      if ((eventYear - year) % 100 === 0 || (eventYear - year) % 250 === 0) {
        const eventTitle = eventType === 'born' ? 'født' : 'død';
        events.push({
          start: [eventYear, month, day],
          duration: { days: 1 },
          title: `${poetName(poet)} ${eventTitle} for ${eventYear -
            year} år siden`,
          description: `${poetName(poet)} ${eventTitle} ${parseInt(
            day,
            10
          )}/${parseInt(month, 10)} ${year}.`,
          url: `https://kalliope.org/da/bio/${poet.id}`,
          uid: `${poet.id}-${eventType}-${eventYear}@kalliope.org`,
        });
      }
    }
  };
  collected.poets.forEach((poet, poetId) => {
    if (
      poet.period != null &&
      poet.period.born != null &&
      poet.period.born.date !== '?'
    ) {
      handleDate(poet, 'born', poet.period.born.date);
    }
    if (
      poet.period != null &&
      poet.period.dead != null &&
      poet.period.dead.date !== '?'
    ) {
      handleDate(poet, 'dead', poet.period.dead.date);
    }
  });
  const { error, value } = ics.createEvents(events);
  if (error != null) {
    throw error;
  }
  writeText('static/Kalliope.ics', value);
};

const build_artwork = collected => {
  let collected_artwork = new Map(loadCachedJSON('collected.artwork') || []);
  const force_reload = collected_artwork.size == 0;

  collected.poets.forEach(person => {
    const personId = person.id;
    const personType = person.type;
    const artworkFilename = `fdirs/${personId}/artwork.xml`;
    const portraitsFile = `fdirs/${personId}/portraits.xml`;

    if (
      personType === 'artist' &&
      (force_reload || isFileModified(artworkFilename))
    ) {
      // Fjern eksisterende fra cache (i tilfælde af id er slettet)
      Array.from(collected_artwork.keys())
        .filter(k => k.indexOf(`${personId}/`) === 0)
        .forEach(k => {
          collected_artwork.delete(k);
        });

      const artworksDoc = loadXMLDoc(artworkFilename);
      if (artworksDoc != null) {
        artworksDoc.find('//pictures/picture').forEach(picture => {
          const pictureId = safeGetAttr(picture, 'id');
          const subjectAttr = safeGetAttr(picture, 'subject');
          let subjects = subjectAttr != null ? subjectAttr.split(',') : [];
          const year = safeGetAttr(picture, 'year');
          if (pictureId == null) {
            throw `fdirs/${personId}/artwork.xml har et billede uden id-attribut.`;
          }
          subjects.forEach(subjectId => {
            // Make sure we rebuild the affected bio page.
            markFileDirty(`fdirs/${subjectId}/portraits.xml`);
          });

          const src = `/static/images/${personId}/${pictureId}.jpg`;
          const size = imageSizeSync(src.replace(/^\//, ''));
          const remoteUrl = build_museum_url(picture);
          const museumLink = build_museum_link(picture) || '';
          const museumId = safeGetAttr(picture, 'museum');
          const artworkId = `${personId}/${pictureId}`;
          const artist = collected.poets.get(personId);
          const content_raw =
            picture
              .toString()
              .replace(/<picture[^>]*?>/, '')
              .replace('</picture>', '')
              .trim() + museumLink;
          const artworkJson = {
            id: `${personId}/${pictureId}`,
            artistId: personId,
            artist,
            museum: get_museum_json(museumId),
            remoteUrl,
            lang: person.lang,
            src,
            size,
            content_lang: 'da',
            subjects,
            year,
            content_raw,
            content_html: htmlToXml(content_raw, collected),
          };
          collected_artwork.set(artworkId, artworkJson);
        });
      }
    }
    if (force_reload || isFileModified(portraitsFile)) {
      // Fjern eksisterende portraits fra cache (i tilfælde af id er slettet)
      Array.from(collected_artwork.keys())
        .filter(k => k.indexOf(`portrait/${personId}/`) === 0)
        .forEach(k => {
          collected_artwork.delete(k);
        });

      // From portraits.xml
      const doc = loadXMLDoc(`fdirs/${personId}/portraits.xml`);
      if (doc != null) {
        onError = message => {
          throw `fdirs/${personId}/portraits.xml: ${message}`;
        };
        doc
          .find('//pictures/picture')
          .filter(picture => {
            return safeGetAttr(picture, 'ref') == null;
          })
          .forEach(pictureNode => {
            const src = safeGetAttr(pictureNode, 'src');
            const picture = get_picture(
              pictureNode,
              `/static/images/${personId}`,
              collected,
              onError
            );
            if (picture == null) {
              onError('har et billede uden src- eller ref-attribut.');
            }
            const key = `portrait/${personId}/${src}`;
            collected_artwork.set(key, picture);
          });
      }
    }

    // From works
    collected.workids.get(personId).forEach(workId => {
      const workFilename = `fdirs/${personId}/${workId}.xml`;
      if (force_reload || isFileModified(workFilename)) {
        // Fjern eksisterende work pictures fra cache
        Array.from(collected_artwork.keys())
          .filter(k => k.indexOf(`work/${personId}/${workId}`) === 0)
          .forEach(k => {
            collected_artwork.delete(k);
          });

        const doc = loadXMLDoc(workFilename);
        if (doc != null) {
          onError = message => {
            throw `${workFilename}: ${message}`;
          };
          doc
            .find('//pictures/picture')
            .filter(picture => {
              return safeGetAttr(picture, 'ref') == null;
            })
            .forEach(pictureNode => {
              const src = safeGetAttr(pictureNode, 'src');
              const picture = get_picture(
                pictureNode,
                `/static/images/${personId}`,
                collected,
                onError
              );
              if (picture == null) {
                onError('har et billede uden src- eller ref-attribut.');
              }
              const key = `work/${personId}/${workId}/${src}`;
              collected_artwork.set(key, picture);
            });
        }
      }
    });
  });
  writeCachedJSON('collected.artwork', Array.from(collected_artwork));
  return collected_artwork;
};

safeMkdir(`static/api`);
collected.workids = b('build_poet_workids', build_poet_workids);
// Build collected.works and collected.texts
Object.assign(collected, b('works_first_pass', works_first_pass, collected));
b('build_person_or_keyword_refs', build_person_or_keyword_refs, collected);
collected.poets = b('build_poets_json', build_poets_json, collected);
b('build_poets_by_country_json', build_poets_by_country_json, collected);
collected.artwork = b('build_artwork', build_artwork, collected);
b('build_museums', build_museums, collected);
collected.variants = b('build_variants', build_variants, collected);
b('build_mentions_json', build_mentions_json, collected);
collected.textrefs = b('build_textrefs', build_textrefs, collected);
build_dict_first_pass(collected);
collected.keywords = b('build_keywords', build_keywords);
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
print_benchmarking_results();
