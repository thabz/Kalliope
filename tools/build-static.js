import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import mkdirp from 'mkdirp';
import * as Paths from '../common/paths.js';
import * as CommonData from '../common/commondata.js';
import { extractYear, formattedYear } from '../common/dates.js';
import { supportedLanguages } from '../common/languages.js';
import {
  isFileModified,
  markFileDirty,
  refreshFilesModifiedCache,
  force_reload as globalForceReload,
  loadCachedJSON,
  writeCachedJSON,
} from './libs/caching.js';
import {
  fileExists,
  safeMkdir,
  writeJSON,
  writeText,
  htmlToXml,
  replaceDashes,
  buildThumbnails,
} from './libs/helpers.js';
import {
  all_poet_ids,
  build_poets_first_pass,
  build_poets_json,
  build_poets_by_country_json,
  build_literary_periods_json,
} from './build-static/poets.js';
import {
  build_dict_first_pass,
  build_dict_second_pass,
} from './build-static/dict.js';
import {
  loadXMLDoc,
  safeGetText,
  safeGetAttr,
  getChildren,
  getChildByTagName,
  getChildrenByTagName,
  getChildrenByTagNames,
  getElementByTagName,
  getElementsByTagNames,
  safeGetInnerXML,
  tagName,
} from './build-static/xml.js';
import { build_sitemap_xml } from './build-static/sitemap.js';
import { build_keywords } from './build-static/keywords.js';
import { build_about_pages } from './build-static/about.js';
import { build_portraits_json } from './build-static/portraits.js';
import { build_todays_events_json } from './build-static/today.js';
import {
  extractDates,
  extractTitle,
  extractSubtitles,
  get_notes,
  get_pictures,
} from './build-static/parsing.js';
import {
  build_person_or_keyword_refs,
  build_mentions_json,
} from './build-static/mentions.js';
import {
  build_variants,
  resolve_variants,
  primaryTextVariantId,
} from './build-static/variants.js';
import { build_artwork } from './build-static/artwork.js';
import { flushImageSizeCache, imageSizeSync } from './build-static/image.js';
import {
  poetName,
  workName,
  workLinkName,
} from './build-static/formatting.js';
import {
  build_global_lines_json,
  build_poet_lines_json,
} from './build-static/lines.js';
import {
  build_museums,
  build_museum_pages,
  build_museum_url,
} from './build-static/museums.js';
import {
  b,
  print_benchmarking_results,
} from './build-static/benchmarking.js';
import { mapLimit } from './build-static/concurrency.js';
import { build_works_toc, build_section_toc } from './build-static/toc.js';
import { update_elasticsearch } from './build-static/elastic.js';
import { loadExternalIdentifiers } from './build-static/external-identifiers.js';
import {
  build_textrefs,
  mark_ref_destinations_dirty,
} from './build-static/textrefs.js';
import { build_anniversaries_ical } from './build-static/ical.js';
import {
  build_global_timeline,
  build_poet_timeline_json,
} from './build-static/timeline.js';
import {
  ANTHOLOGY_WORK_ID,
  buildVirtualAnthologyWorks,
  isAnthologyText,
  publicationTextId,
  sourceFilesForText,
  worksForPoet,
} from './build-static/anthologies.js';

const envFlag = (name) => {
  return ['1', 'true', 'yes'].includes(
    (process.env[name] || '').toLowerCase(),
  );
};

const skipImageThumbnails = envFlag('KALLIOPE_SKIP_IMAGE_THUMBNAILS');
const skipElasticsearch = envFlag('KALLIOPE_SKIP_ELASTICSEARCH');

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

const parseAliases = (value) => {
  if (value == null) {
    return [];
  }
  return value
    .split(',')
    .map((alias) => alias.trim())
    .filter((alias) => alias.length > 0);
};

const buildTextAliasRedirects = (redirects, texts) => {
  const textIds = new Set(texts.keys());
  const aliases = new Map();

  texts.forEach((text) => {
    (text.aliases || []).forEach((alias) => {
      if (alias === text.id || textIds.has(alias)) {
        throw new Error(
          `Text alias "${alias}" conflicts with an existing text id.`
        );
      }
      if (aliases.has(alias)) {
        throw new Error(
          `Text alias "${alias}" is used by both ${aliases.get(alias)} and ${
            text.id
          }.`
        );
      }
      aliases.set(alias, text.id);
      supportedLanguages.forEach((lang) => {
        redirects[`/${lang}/text/${alias}`] = `/${lang}/text/${text.id}`;
      });
    });
  });
};

const build_bio_json = async (collected) => {
  const codeModified = isFileModified(
    'tools/build-static.js',
    'tools/build-static/artwork.js',
    'tools/build-static/museums.js',
    'tools/build-static/timeline.js',
    'tools/build-static/parsing.js',
    'tools/build-static/external-identifiers.js',
    'common/external-identifiers.js',
  );
  const artworkModified = isFileModified(
    'data/museums.xml',
    'data/artwork.xml',
    ...Array.from(collected.poets.keys()).map(
      (poetId) => `fdirs/${poetId}/artwork.xml`,
    ),
  );
  return mapLimit(
    Array.from(collected.poets.entries()),
    async (entry) => {
      const [poetId, poet] = entry;
      // Skip if all of the participating xml files aren't modified
      if (
        !codeModified &&
        !artworkModified &&
        !isFileModified(
          'data/events.xml',
          ...worksForPoet(collected, poetId).flatMap(
            work => work.sourceFiles || []
          ),
          `fdirs/${poet.id}/info.xml`,
          `fdirs/${poet.id}/events.xml`,
          `fdirs/${poet.id}/portraits.xml`,
          `fdirs/${poet.id}/bio.xml`,
        )
      ) {
        return;
      }

      safeMkdir(`public/api/${poet.id}`);
      const bioXmlPath = `fdirs/${poet.id}/bio.xml`;
      const data = {
        poet,
        content_html: null,
        identifiers: loadExternalIdentifiers(poet.id),
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
      data.timeline = await build_poet_timeline_json(poet, collected);
      data.portraits = await build_portraits_json(poet, collected);
      const destFilename = `public/api/${poet.id}/bio.json`;
      console.log(destFilename);
      writeJSON(destFilename, data);
    },
  );
};

const build_poet_workids = () => {
  let collected_workids =
    globalForceReload ?
      new Map()
    : new Map(loadCachedJSON('collected.workids') || []);
  let found_changes = false;
  all_poet_ids().forEach((poetId) => {
    const infoFilename = `fdirs/${poetId}/info.xml`;
    if (!fs.existsSync(infoFilename)) {
      throw new Error(`Missing info.xml in fdirs/${poetId}.`);
    }
    if (globalForceReload || isFileModified(infoFilename)) {
      const doc = loadXMLDoc(infoFilename);
      const workIds = safeGetText(doc, 'works') || '';
      let items = workIds.split(',').filter((x) => x.length > 0);
      collected_workids.set(poetId, items);
      found_changes = true;
    }
  });
  if (found_changes) {
    writeCachedJSON('collected.workids', Array.from(collected_workids));
  }
  return collected_workids;
};

const handle_text = async (
  poetId,
  workId,
  text,
  textType, // poem, prose, section
  resolve_prev_next,
  section_titles,
  placement = {},
) => {
  const sourcePoetId = placement.sourcePoetId || poetId;
  const sourceWorkId = placement.sourceWorkId || workId;
  const sourceTextId = safeGetAttr(text, 'id');
  const textId = placement.textId || sourceTextId;
  const sourceFiles =
    placement.sourceFiles || [
      `fdirs/${poetId}/info.xml`,
      `fdirs/${sourcePoetId}/info.xml`,
      `fdirs/${sourcePoetId}/${sourceWorkId}.xml`,
    ];
  if (!isFileModified(...sourceFiles)) {
    return;
  }
  const poet = collected.poets.get(poetId);
  const work = collected.works.get(`${poetId}/${workId}`);
  const sourceWork = collected_works.get(
    sourcePoetId + '-' + sourceWorkId
  );

  const head = getChildByTagName(text, 'head');
  const textDates = extractDates(head);
  const firstline = extractTitle(head, 'firstline');
  let title = extractTitle(head, 'title') || firstline; // {title: xxx, prefix: xxx}
  let indextitle = extractTitle(head, 'indextitle') || title;
  let linktitle = extractTitle(head, 'linktitle') || indextitle || title;

  const keywords = safeGetText(head, 'keywords');

  let subtitles = extractSubtitles(head, 'subtitle', collected);
  let suptitles = extractSubtitles(head, 'suptitle', collected);

  let keywordsArray = [];
  if (keywords) {
    keywordsArray = keywords.split(',').map((k) => {
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

  const textRefs = collected.textrefs.get(sourceTextId) || {
    mention: [],
    translation: [],
  };
  const textRefIdsByType = Array.isArray(textRefs)
    ? { mention: textRefs, translation: [] }
    : textRefs;
  const buildRefsArray = (refIds) =>
    refIds
    .filter((id) => {
      // Hvis en tekst har varianter som også henviser til denne,
      // vil vi kun vise den ældste variant.
      return primaryTextVariantId(id, collected) === id;
    })
    .map((id) => {
      const meta = collected.texts.get(id);
      const poet = poetName(collected.poets.get(meta.poetId));
      const workFormattet =
        meta.workId === 'andre' ?
          ''
        : ' - ' +
          workLinkName(collected.works.get(meta.poetId + '/' + meta.workId));

      return [
        [
          `${poet}: <a poem="${id}">»${meta.title}«</a>${workFormattet}`,
          { html: true },
        ],
      ];
    });
  let refsArray = buildRefsArray(textRefIdsByType.mention || []);
  let translationsArray = buildRefsArray(textRefIdsByType.translation || []);

  const variantsArray = (resolve_variants(sourceTextId, collected) || [])
    .filter((id) => {
      // Skip self
      return id !== sourceTextId;
    })
    .map((id) => {
      const meta = collected.texts.get(id);
      const poet = poetName(collected.poets.get(meta.poetId));
      const work = workLinkName(
        collected.works.get(meta.poetId + '/' + meta.workId),
      );
      return [
        [
          `${poet}: <a poem="${id}">»${meta.title}«</a> – ${work}`,
          { html: true },
        ],
      ];
    });
  const relatedDateTexts = relatedTextsForDates(
    sourceTextId,
    textDates,
    collected
  );

  const foldername = Paths.textFolder(textId);
  const prev_next = resolve_prev_next(textId);

  const sourceNode = getChildByTagName(head, 'source');
  let source = null;
  let workSource = null;
  if (sourceNode != null) {
    const sourceId = safeGetAttr(sourceNode, 'in') || 'default';
    workSource = sourceWork.sources[sourceId];
    if (workSource == null) {
      throw new Error(
        `fdirs/${sourcePoetId}/${sourceWorkId}.xml ${sourceTextId} references undefined source.`,
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
      const pagesParts = pagesAttr.split(/-/).map((n) => parseInt(n));
      const o = workSource.facsimilePagesOffset;
      const pFrom = pagesParts[0];
      const pTo = pagesParts[1] || pFrom;
      facsimilePages = [pFrom + o, pTo + o];
    } else if (facsimilePages != null) {
      const pagesParts = facsimilePages.split(/-/).map((n) => parseInt(n));
      const pFrom = pagesParts[0];
      const pTo = pagesParts[1] || pFrom;
      facsimilePages = [pFrom, pTo];
    }
    if (facsimilePages != null) {
      if (facsimilePages[0] > facsimilePages[1]) {
        throw new Error(
          `fdirs/${sourcePoetId}/${sourceWorkId}.xml ${sourceTextId} sideangivelser har fra > til.`,
        );
      }
      if (facsimilePages[1] > workSource.facsimilePageCount) {
        throw new Error(
          `fdirs/${sourcePoetId}/${sourceWorkId}.xml ${sourceTextId} sideangivelse ${facsimilePages[1]} rækker over antal facsimile-sider. Er facsimile-pages-offset ${workSource.facsimilePageCount} korrekt?`,
        );
      }
    }
    source = {
      source: sourceBookRef,
      pages: pagesAttr,
      facsimilePageCount: workSource.facsimilePageCount,
      facsimile,
      facsimilePages,
      facsimilePoetId: sourcePoetId,
    };
  } else if (workSource != null) {
    // Dette er ikke nødvendigvis en fejl.
    console.log(
      `fdirs/${sourcePoetId}/${sourceWorkId}: teksten ${sourceTextId} mangler source.`
    );
  }
  let blocks = null;
  let has_footnotes = false;
  let footnotes_count = 0;
  let toc = null;
  if (textType === 'section') {
    // A linkable section with id
    if (title == null) {
      throw `fdirs/${sourcePoetId}/${sourceWorkId}: section ${sourceTextId} mangler title.`;
    }
    const content = getChildByTagName(text, 'content');
    toc = build_section_toc(content);
  } else {
    // prose or poem
    const body = getChildByTagName(text, 'body');
    blocks = getChildrenByTagNames(body, ['poetry', 'prose', 'quote']).map(
      (block) => {
        const type = tagName(block);
        const rawBlock = safeGetInnerXML(block);
        footnotes_count += (rawBlock.match(/<footnote\b|<note\b/g) || [])
          .length;
        has_footnotes |=
          rawBlock.indexOf('<footnote') !== -1 ||
          rawBlock.indexOf('<note') !== -1;
        const fontSize = safeGetAttr(block, 'font-size');
        const marginLeft = safeGetAttr(block, 'margin-left');
        const marginRight = safeGetAttr(block, 'margin-right');
        const options = { fontSize, marginLeft, marginRight };
        return {
          type,
          lines: htmlToXml(rawBlock, collected, type === 'poetry'),
          options,
        };
      },
    );
  }
  mkdirp.sync(foldername);
  const notes = get_notes(head, collected);
  if (placement.systemNote != null) {
    notes.push(placement.systemNote);
  }
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
      text_type: textType,
      has_footnotes,
      footnotes_count,
      notes,
      source,
      keywords: keywordsArray || [],
      refs: refsArray,
      translations: translationsArray,
      variants: variantsArray,
      related_date_texts: relatedDateTexts,
      pictures: await get_pictures(
        head,
        `/images/${sourcePoetId}`,
        `fdirs/${sourcePoetId}/${sourceWorkId}.xml:${sourceTextId}`,
        collected,
      ),
      content_lang:
        safeGetAttr(text, 'lang') || collected.poets.get(sourcePoetId).lang,
      blocks,
      toc,
      placement: placement.type || 'canonical',
      canonical_id: placement.canonicalTextId || textId,
      indexable: placement.indexable !== false,
    },
  };
  console.log(Paths.textPath(textId));
  writeJSON(Paths.textPath(textId), text_data);
};

const handle_work = async (work) => {
  const type = safeGetAttr(work, 'type');
  const poetId = safeGetAttr(work, 'author');
  const workId = safeGetAttr(work, 'id');
  let lines = [];

  const systemNote = html => ({
    type: 'anthology',
    content_lang: 'da',
    content_html: htmlToXml(html, collected),
  });
  const escapeXml = value =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  const resolveAnthologyPrevNext = (authorId, textId) => {
    const anthologyWork = collected.works.get(
      `${authorId}/${ANTHOLOGY_WORK_ID}`
    );
    const items = (anthologyWork.textIds || []).map(id => {
      const meta = collected.texts.get(id);
      return { id, title: meta.linkTitle };
    });
    const index = items.findIndex(item => item.id === textId);
    return {
      prev: index > 0 ? items[index - 1] : null,
      next: index >= 0 && index < items.length - 1 ? items[index + 1] : null,
    };
  };

  const handle_section = async (section, resolve_prev_next, section_titles) => {
    let poems = [];
    let proses = [];
    let toc = [];

    for (const part of getChildren(section)) {
      const partName = tagName(part);
        if (partName === 'text') {
          const textId = safeGetAttr(part, 'id');
          const textAuthorId = safeGetAttr(part, 'author');
          const anthologyText = isAnthologyText(textAuthorId, poetId);
          const renderedTextId =
            anthologyText ? publicationTextId(textId) : textId;
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
          if (firstline != null) {
            // Kun digte skal indekseres
            lines.push({
              id: textId,
              work_id: workId,
              lang: collected.poets.get(poetId).lang,
              title: replaceDashes(indextitle.title),
              firstline:
                firstline == null ? null : replaceDashes(firstline.title),
            });
          }
          toc.push({
            type: 'text',
            id: renderedTextId,
            title: htmlToXml(toctitle.title),
            prefix: replaceDashes(toctitle.prefix),
          });
          if (anthologyText) {
            const sourceWork = collected.works.get(`${poetId}/${workId}`);
            const author = collected.poets.get(textAuthorId);
            const canonicalMeta = collected.texts.get(textId);
            const sourceWorkYear =
              sourceWork.year == null ?
                ''
              : ` (${formattedYear(sourceWork.year)})`;
            await handle_text(
              textAuthorId,
              ANTHOLOGY_WORK_ID,
              part,
              partName,
              id => resolveAnthologyPrevNext(textAuthorId, id),
              [],
              {
                type: 'author',
                sourcePoetId: poetId,
                sourceWorkId: workId,
                sourceFiles: canonicalMeta.sourceFiles,
                systemNote: systemNote(
                  `Fra <a work="${poetId}/${workId}"><i>${escapeXml(
                    sourceWork.title
                  )}</i>${escapeXml(sourceWorkYear)}</a>.`
                ),
              }
            );
            await handle_text(
              poetId,
              workId,
              part,
              partName,
              resolve_prev_next,
              section_titles,
              {
                type: 'publication',
                textId: renderedTextId,
                canonicalTextId: textId,
                indexable: false,
                sourcePoetId: poetId,
                sourceWorkId: workId,
                sourceFiles: collected.texts.get(renderedTextId).sourceFiles,
                systemNote: systemNote(
                  `Skrevet af <a poet="${textAuthorId}">${escapeXml(
                    poetName(author)
                  )}</a>.`
                ),
              }
            );
          } else {
            await handle_text(
              poetId,
              workId,
              part,
              partName,
              resolve_prev_next,
              section_titles,
            );
          }
        } else if (partName === 'section') {
          const head = getChildByTagName(part, 'head');
          const level = parseInt(safeGetAttr(head, 'level') || '1');
          const sectionId = safeGetAttr(part, 'id');
          const title = extractTitle(head, 'title');
          const toctitle = extractTitle(head, 'toctitle') || title;
          if (toctitle == null) {
            throw `En section mangler toctitle eller title i ${poetId}/${workId}.xml`;
          }
          const linktitle =
            extractTitle(head, 'linktitle') || title || toctitle;
          const breadcrumb = { title: linktitle.title, id: sectionId };
          const subtoc = await handle_section(
            getChildByTagName(part, 'content'),
            resolve_prev_next,
            [...section_titles, breadcrumb],
          );
          toc.push({
            type: 'section',
            id: sectionId,
            level: level,
            title: htmlToXml(toctitle.title),
            content: subtoc,
          });
          if (sectionId != null) {
            await handle_text(
              poetId,
              workId,
              part,
              partName,
              resolve_prev_next,
              section_titles,
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
          await handle_text(
            poetId,
            workId,
            part,
            partName,
            resolve_prev_next,
            section_titles,
          );
        }
    }
    return toc;
  };

  const workhead = getChildByTagName(work, 'workhead');
  const notes = get_notes(workhead, collected);
  const pictures = get_pictures(
    workhead,
    `/images/${poetId}`,
    `fdirs/${poetId}/${workId}`,
    collected,
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
  const resolve_prev_next = (function () {
    const items = getElementsByTagNames(workbody, ['text', 'section'])
      .filter((part) => safeGetAttr(part, 'id') != null)
      .map((part) => {
        const sourceTextId = safeGetAttr(part, 'id');
        const textAuthorId = safeGetAttr(part, 'author');
        const textId =
          isAnthologyText(textAuthorId, poetId) ?
            publicationTextId(sourceTextId)
          : sourceTextId;
        const head = getChildByTagName(part, 'head');
        const title = safeGetText(head, 'title');
        return { id: textId, title: title };
      });
    return (textId) => {
      const index = items.findIndex((x) => {
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

  const toc = await handle_section(workbody, resolve_prev_next, []);
  return { lines, toc, notes, pictures };
};

const validateWorkYear = (year, filename) => {
  if (year == null) {
    return;
  }
  if (year === '?') {
    throw new Error(`${filename} has unknown year marker in <year>.`);
  }
  const [, numericYear] = extractYear(year, null);
  if (numericYear == null) {
    throw new Error(`${filename} has invalid <year>: ${year}`);
  }
};

const removeWorkDates = (dates, poetId, workId) => {
  dates.forEach((items, date) => {
    const filtered = items.filter(
      item =>
        (item.sourcePoetId || item.poetId) !== poetId ||
        (item.sourceWorkId || item.workId) !== workId
    );
    if (filtered.length === 0) {
      dates.delete(date);
    } else {
      dates.set(date, filtered);
    }
  });
};

const addTextDates = (dates, text, textDates) => {
  ['written', 'performed', 'event'].forEach((type) => {
    const date = textDates[type] == null ? null : textDates[type].trim();
    if (date == null || date.length === 0) {
      return;
    }
    const items = dates.get(date) || [];
    const { type: textType, ...textData } = text;
    items.push({
      dateType: type,
      textType,
      ...textData,
    });
    dates.set(date, items);
  });
};

const sortCollectedDates = (dates) => {
  const sorted = new Map(
    Array.from(dates.entries()).sort(([dateA], [dateB]) =>
      dateA.localeCompare(dateB)
    )
  );
  sorted.forEach((items, date) => {
    sorted.set(
      date,
      items.sort((a, b) => {
        if (a.poetId !== b.poetId) {
          return a.poetId.localeCompare(b.poetId);
        }
        if (a.workId !== b.workId) {
          return a.workId.localeCompare(b.workId);
        }
        if (a.id !== b.id) {
          return a.id.localeCompare(b.id);
        }
        return a.dateType.localeCompare(b.dateType);
      })
    );
  });
  return sorted;
};

const relatedTextsForDates = (textId, textDates, collected) => {
  const variantIds = new Set(resolve_variants(textId, collected) || [textId]);
  variantIds.add(textId);

  const result = [];
  const seen = new Set();
  ['written', 'performed', 'event'].forEach((dateType) => {
    const date = textDates[dateType] == null ? null : textDates[dateType].trim();
    if (date == null || date.length === 0) {
      return;
    }
    const items = collected.dates.get(date) || [];
    items.forEach((item) => {
      const itemVariantIds = resolve_variants(item.id, collected) || [item.id];
      const itemVariantKey = itemVariantIds[0];
      if (
        itemVariantIds.some((variantId) => variantIds.has(variantId)) ||
        seen.has(itemVariantKey)
      ) {
        return;
      }
      seen.add(itemVariantKey);
      result.push({
        date,
        dateType: item.dateType,
        id: item.id,
        title: item.title,
        firstline: item.firstline,
        poetId: item.poetId,
        poetName: poetName(collected.poets.get(item.poetId)),
        workId: item.workId,
      });
    });
  });
  return result;
};

// Constructs collected.works and collected.texts to
// be used for resolving <xref poem="">, etc.
const works_first_pass = (collected) => {
  const texts =
    globalForceReload ?
      new Map()
    : new Map(loadCachedJSON('collected.texts') || []);
  const works =
    globalForceReload ?
      new Map()
    : new Map(loadCachedJSON('collected.works') || []);
  const dates = globalForceReload
    ? new Map()
    : new Map(loadCachedJSON('collected.dates') || []);

  let found_changes = false;
  const anthologyCodeModified = isFileModified(
    'tools/build-static.js',
    'tools/build-static/anthologies.js'
  );
  const force_reload =
    texts.size === 0 ||
    works.size === 0 ||
    dates.size === 0 ||
    anthologyCodeModified;

  let parentIdsToFillIn = new Map(); // Bruges til nedenstående second-pass som klistrer parent-data på

  collected.workids.forEach((workIds, poetId) => {
    const workFilenames = workIds.map(
      (workId) => `fdirs/${poetId}/${workId}.xml`,
    );
    const poetHasChangedWorks =
      force_reload || isFileModified(...workFilenames);

    workIds.forEach((workId) => {
      const workFilename = `fdirs/${poetId}/${workId}.xml`;
      if (!fileExists(workFilename)) {
        return;
      }
      if (!poetHasChangedWorks) {
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
      validateWorkYear(year, workFilename);
      const status = safeGetAttr(work, 'status');
      const type = safeGetAttr(work, 'type');
      const subtitles = extractSubtitles(head, 'subtitle', collected);
      const workDates = extractDates(head);
      // Sanity check
      if (safeGetAttr(work, 'author') !== poetId) {
        throw new Error(
          `fdirs/${poetId}/${workId}.xml has wrong author-attribute in <kalliopework>`,
        );
      }
      const workTexts = getElementsByTagNames(workBody, [
        'text',
        'section',
        'subwork',
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
        published: workDates.published || year,
        sourceFiles: [
          `fdirs/${poetId}/info.xml`,
          workFilename,
        ],
      });

      if (parentId != null) {
        parentIdsToFillIn.set(fullWorkId, `${poetId}/${parentId}`);
      }

      Array.from(texts.entries()).forEach(([cachedTextId, text]) => {
        if (
          (text.sourcePoetId || text.poetId) === poetId &&
          (text.sourceWorkId || text.workId) === workId
        ) {
          texts.delete(cachedTextId);
        }
      });
      removeWorkDates(dates, poetId, workId);

      workTexts.forEach((part, sourceOrder) => {
        const textId = safeGetAttr(part, 'id');
        if (tagName(part) === 'section' && textId == null) {
          return;
        }
        if (tagName(part) === 'subwork') {
          return;
        }
        const head = getChildByTagName(part, 'head');
        const firstline = extractTitle(head, 'firstline');
        const title = extractTitle(head, 'title');
        const linktitle = extractTitle(head, 'linktitle');
        const indextitle = extractTitle(head, 'indextitle');
        const aliases = parseAliases(safeGetAttr(part, 'aliases'));
        const textDates = extractDates(head);
        const textAuthorId = safeGetAttr(part, 'author');
        const anthologyText = isAnthologyText(textAuthorId, poetId);

        if (anthologyText && collected.poets.get(textAuthorId) == null) {
          throw new Error(
            `${workFilename} ${textId} har en ukendt forfatter: ${textAuthorId}.`
          );
        }

        const linkTitle = linktitle || title || firstline;
        const indexTitle = indextitle || title || firstline;

        if (linkTitle == null) {
          throw new Error(
            `fdirs/${poetId}/${workId}.xml has ${tagName(
              part,
            )} ${textId} without title.`,
          );
        }
        const baseText = {
          id: textId,
          title: replaceDashes(linkTitle.title),
          firstline: replaceDashes(firstline == null ? null : firstline.title),
          indexTitle: replaceDashes(indexTitle.title),
          linkTitle: replaceDashes(linkTitle.title),
          tocTitle: replaceDashes(
            (extractTitle(head, 'toctitle') || linkTitle).title
          ),
          tocPrefix: replaceDashes(
            (extractTitle(head, 'toctitle') || linkTitle).prefix
          ),
          aliases,
          type: tagName(part),
          hasPoetry: getElementsByTagNames(part, ['poetry']).length > 0,
          hasProse: getElementsByTagNames(part, ['prose']).length > 0,
          skipIndex: safeGetAttr(part, 'skip-index') != null,
          sourceOrder,
        };
        if (anthologyText) {
          const sourceFiles = [
            `fdirs/${textAuthorId}/info.xml`,
            `fdirs/${poetId}/info.xml`,
            workFilename,
          ];
          const authorPlacement = {
            ...baseText,
            poetId: textAuthorId,
            workId: ANTHOLOGY_WORK_ID,
            placement: 'author',
            sourcePoetId: poetId,
            sourceWorkId: workId,
            sourceTextId: textId,
            sourceFiles,
            indexable: true,
          };
          const publicationId = publicationTextId(textId);
          if (texts.has(textId)) {
            throw new Error(
              `${workFilename} kan ikke placere antologiteksten ${textId}; id'et findes allerede.`,
            );
          }
          if (texts.has(publicationId)) {
            throw new Error(
              `${workFilename} kan ikke oprette antologi-id'et ${publicationId}; id'et findes allerede.`,
            );
          }
          const publicationPlacement = {
            ...baseText,
            id: publicationId,
            aliases: [],
            poetId,
            workId,
            placement: 'publication',
            canonicalTextId: textId,
            sourcePoetId: poetId,
            sourceWorkId: workId,
            sourceTextId: textId,
            sourceFiles: [`fdirs/${poetId}/info.xml`, workFilename],
            indexable: false,
          };
          texts.set(textId, authorPlacement);
          texts.set(publicationId, publicationPlacement);
          addTextDates(dates, authorPlacement, textDates);
        } else {
          const text = {
            ...baseText,
            poetId,
            workId,
            sourceFiles: [`fdirs/${poetId}/info.xml`, workFilename],
            indexable: true,
          };
          texts.set(textId, text);
          addTextDates(dates, text, textDates);
        }
      });
    });
  });

  buildVirtualAnthologyWorks({ ...collected, works, texts });

  collected.poets.forEach((poet, poetId) => {
    const poetTexts = Array.from(texts.values()).filter(
      text => text.poetId === poetId && text.indexable !== false
    );
    poet.has_works =
      (collected.workids.get(poetId) || []).length > 0 ||
      works.has(`${poetId}/${ANTHOLOGY_WORK_ID}`);
    poet.has_poems = poetTexts.some(text => text.hasPoetry);
    poet.has_prose = poetTexts.some(text => text.hasProse);
    poet.has_texts = poet.has_poems || poet.has_prose;
    poet.has_anthology_texts = poetTexts.some(
      text => text.placement === 'author'
    );
  });

  // Second-pass som resolver parentIds til fulde parent objekter
  Array.from(parentIdsToFillIn.keys()).forEach((fullWorkId) => {
    const parentId = parentIdsToFillIn.get(fullWorkId);
    const data = works.get(fullWorkId);
    data.parent = works.get(parentId);
    works.set(fullWorkId, data);
  });

  if (found_changes || anthologyCodeModified) {
    writeCachedJSON('collected.texts', Array.from(texts));
    writeCachedJSON('collected.works', Array.from(works));
    writeCachedJSON('collected.dates', Array.from(sortCollectedDates(dates)));
    writeCachedJSON('collected.poets', Array.from(collected.poets));
  }
  return { works, texts, dates };
};

const works_second_pass = async (collected) => {
  const jobs = [];
  collected.poets.forEach((poet, poetId) => {
    safeMkdir(`public/api/${poetId}`);
    collected.workids.get(poetId).forEach((workId) => {
      jobs.push({ poetId, workId });
    });
  });

  return mapLimit(jobs, async ({ poetId, workId }) => {
    const filename = `fdirs/${poetId}/${workId}.xml`;
    if (!fileExists(filename)) {
      return;
    }
    const sourceFiles = new Set([
      'tools/build-static.js',
      'tools/build-static/anthologies.js',
      `fdirs/${poetId}/info.xml`,
      filename,
    ]);
    collected.texts.forEach(text => {
      if (
        (text.sourcePoetId || text.poetId) === poetId &&
        (text.sourceWorkId || text.workId) === workId
      ) {
        sourceFilesForText(text).forEach(sourceFile =>
          sourceFiles.add(sourceFile)
        );
      }
    });
    if (!isFileModified(...sourceFiles)) {
      return;
    }
    let doc = loadXMLDoc(filename);
    const work = getChildByTagName(doc, 'kalliopework');
    const head = getChildByTagName(work, 'workhead');
    const data = collected.works.get(`${poetId}/${workId}`);
    let sources = {};
    getChildrenByTagName(head, 'source').forEach((sourceNode) => {
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
    await handle_work(work); // Creates texts
    doc = null;
  });
};

const build_poet_works_json = (collected) => {
  collected.poets.forEach((poet, poetId) => {
    safeMkdir(`public/api/${poetId}`);

    const poetWorks = worksForPoet(collected, poetId);
    const workFilenames = Array.from(
      new Set(poetWorks.flatMap(work => work.sourceFiles || []))
    );
    if (
      !isFileModified(
        'tools/build-static.js',
        'tools/build-static/anthologies.js',
        `fdirs/${poetId}/info.xml`,
        `fdirs/${poetId}/artwork.xml`,
        ...workFilenames,
      )
    ) {
      return;
    }

    let works = [];
    poetWorks.forEach(data => {
      const workId = data.id;
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (data.virtualType == null) {
        if (!fileExists(filename)) {
          return;
        }
        // Copy the xml-file into public to allow for xml download.
        fs.createReadStream(filename).pipe(
          fs.createWriteStream(`public/api/${poetId}/${workId}.xml`)
        );
      }
      if (data.parent != null) {
        return;
      }
      works.push(data);
    });

    let artwork = [];
    if (poet.has_artwork) {
      artwork = Array.from(collected.artwork.values()).filter(
        (a) => a.artistId === poetId,
      );
    }

    const objectToWrite = {
      poet,
      works,
      artwork,
    };
    const worksOutFilename = `public/api/${poetId}/works.json`;
    console.log(worksOutFilename);
    writeJSON(worksOutFilename, objectToWrite);
  });
};

const build_news = (collected) => {
  supportedLanguages.forEach((lang) => {
    const path = `data/news_${lang}.xml`;
    if (!isFileModified(path)) {
      return;
    }
    const doc = loadXMLDoc(path);
    const items = getChildByTagName(doc, 'items');
    let list = [];
    getChildren(items).forEach((item) => {
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
    const outfile = `public/api/news_${lang}.json`;
    writeJSON(outfile, list);
    console.log(outfile);
  });
};

const build_redirects_json = (collected) => {
  let redirects = {};
  buildTextAliasRedirects(redirects, collected.texts);
  collected.poets.forEach((poet, poetId) => {
    if (!poet.has_works && !poet.has_artwork) {
      supportedLanguages.forEach((lang) => {
        redirects[`/${lang}/works/${poetId}`] = `/${lang}/bio/${poetId}`;
      });
    }
  });
  writeJSON('public/api/redirects.json', redirects);
};

const build_image_thumbnails = async () => {
  return Promise.all([
    buildThumbnails('public/images', isFileModified),
    buildThumbnails('public/kunst', isFileModified),
  ]);
};

const main = async () => {
  safeMkdir(`public/api`);
  collected.museums = await b('build_museums', build_museums, collected);
  collected.workids = await b('build_poet_workids', build_poet_workids);
  collected.poets = await b(
    'build_poets_first_pass',
    build_poets_first_pass,
    collected,
  );
  const { works, texts, dates } = await b(
    'works_first_pass',
    works_first_pass,
    collected,
  );
  collected.works = works;
  collected.texts = texts;
  collected.dates = dates;
  collected.artwork = await b('build_artwork', build_artwork, collected);
  await b(
    'build_person_or_keyword_refs',
    build_person_or_keyword_refs,
    collected,
  );
  await b('build_poets_json', build_poets_json, collected);
  await b(
    'mark_ref_destinations_dirty',
    mark_ref_destinations_dirty,
    collected,
  );
  await b(
    'build_poets_by_country_json',
    build_poets_by_country_json,
    collected,
  );
  await b(
    'build_literary_periods_json',
    build_literary_periods_json,
    collected
  );
  await b('build_museum_pages', build_museum_pages, collected);
  collected.variants = await b('build_variants', build_variants, collected);
  await b('build_mentions_json', build_mentions_json, collected);
  collected.textrefs = await b('build_textrefs', build_textrefs, collected);
  build_dict_first_pass(collected);
  collected.keywords = await b('build_keywords', build_keywords, collected);
  await b('build_poet_lines_json', build_poet_lines_json, collected);
  await b('build_poet_works_json', build_poet_works_json, collected);
  await b('works_second_pass', works_second_pass, collected);
  await b('build_works_toc', build_works_toc, collected);
  collected.timeline = await b(
    'build_global_timeline',
    build_global_timeline,
    collected,
  );
  await b('build_bio_json', build_bio_json, collected);
  await b('build_news', build_news, collected);
  await b('build_about_pages', build_about_pages, collected);
  await b('build_global_lines_json', build_global_lines_json, collected);
  await b('build_dict_second_pass', build_dict_second_pass, collected);
  await b('build_todays_events_json', build_todays_events_json, collected);
  await b('build_redirects_json', build_redirects_json, collected);
  await b('build_sitemap_xml', build_sitemap_xml, collected);
  await b('build_anniversaries_ical', build_anniversaries_ical, collected);
  refreshFilesModifiedCache();
  if (skipImageThumbnails) {
    console.log('Skipping image thumbnail build.');
  } else {
    await b('build_image_thumbnails', build_image_thumbnails);
  }
  if (skipElasticsearch) {
    console.log('Skipping Elasticsearch update.');
  } else {
    await b('update_elasticsearch', update_elasticsearch, collected);
  }
  refreshFilesModifiedCache();
  flushImageSizeCache();
  print_benchmarking_results();
};

main();
