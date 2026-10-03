import fs from 'fs';
import { safeMkdir, htmlToXml, writeJSON } from '../libs/helpers.js';
import {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
} from '../libs/caching.js';
import { get_pictures } from './parsing.js';
import {
  loadXMLDoc,
  safeGetInnerXML,
  safeGetText,
  safeGetAttr,
  getChildByTagName,
  getChildrenByTagName,
} from './xml.js';
import { mapLimit } from './concurrency.js';

const danishTextCountForKeyword = (keywordId, collected) => {
  const refs = collected.person_or_keyword_refs.get(keywordId);
  if (refs == null) {
    return 0;
  }
  const textIds = new Set(
    refs.mention.filter(textId => {
      const text = collected.texts.get(textId);
      if (text == null || text.indexable === false) {
        return false;
      }
      return collected.poets.get(text.poetId)?.country === 'dk';
    })
  );
  return textIds.size;
};

const referenceSourcesModified = collected => {
  for (const [poetId, workIds] of collected.workids) {
    if (isFileModified(`fdirs/${poetId}/info.xml`)) {
      return true;
    }
    for (const workId of workIds) {
      if (isFileModified(`fdirs/${poetId}/${workId}.xml`)) {
        return true;
      }
    }
  }
  return false;
};

const build_keywords = async collected => {
  const outputFolder = 'public/api/keywords';
  safeMkdir(outputFolder);
  let collected_keywords = new Map(loadCachedJSON('collected.keywords') || []);
  const folder = 'content/keywords';
  const filenames = fs
    .readdirSync(folder)
    .filter(x => x.endsWith('.xml'))
    .map(x => `${folder}/${x}`);
  if (
    collected_keywords.size === 0 ||
    isFileModified('tools/build-static/keywords.js', ...filenames) ||
    referenceSourcesModified(collected)
  ) {
    collected_keywords = new Map();
    const parsedKeywords = filenames.map(path => {
      const doc = loadXMLDoc(path);
      const keyword = getChildByTagName(doc, 'keyword');
      const head = getChildByTagName(keyword, 'head');
      return {
        path,
        keyword,
        head,
        body: getChildByTagName(keyword, 'body'),
        id: safeGetAttr(keyword, 'id'),
        isDraft: safeGetAttr(keyword, 'draft') === 'true',
        title: safeGetText(head, 'title'),
        redirectURL: safeGetAttr(keyword, 'redirect-url'),
      };
    });
    parsedKeywords.forEach(({ id, title, redirectURL, isDraft, path }) => {
      collected_keywords.set(id, {
        id,
        title,
        redirectURL,
        isDraft,
        sourceFile: path,
      });
    });

    const keywords_toc = [];
    const outputFilenames = new Set();
    await mapLimit(
      parsedKeywords,
      async ({ path, keyword, head, body, id, isDraft, title, redirectURL }) => {
        let data = {
          id,
          title,
        };
        if (redirectURL != null) {
          data.redirectURL = redirectURL;
        } else {
          const pictures = await get_pictures(
            head,
            '/images/keywords',
            path,
            collected
          );
          const author = safeGetText(head, 'author');
          const rawBody = safeGetInnerXML(body) || '';
          const content_html = htmlToXml(rawBody, collected);
          const sources = (getChildrenByTagName(head, 'source') || []).map(
            source => ({
              content_html: htmlToXml(safeGetInnerXML(source), collected),
              href: safeGetAttr(source, 'href'),
            })
          );
          const has_footnotes =
            rawBody.indexOf('<footnote') !== -1 ||
            rawBody.indexOf('<note') !== -1;
          const related = getChildrenByTagName(head, 'related').map(element => {
            const relatedId = safeGetText(element).trim();
            const relatedKeyword = collected_keywords.get(relatedId);
            if (relatedKeyword == null) {
              throw new Error(
                `${path}: Ukendt relateret nøgleord ${relatedId}`
              );
            }
            return {
              id: relatedId,
              title: relatedKeyword.title,
              redirectURL: relatedKeyword.redirectURL,
            };
          });
          data = {
            ...data,
            is_draft: isDraft,
            author,
            sources,
            pictures,
            has_footnotes,
            danish_text_count: danishTextCountForKeyword(id, collected),
            related,
            content_lang: 'da',
            content_html,
          };
        }

        keywords_toc.push({
          id,
          title,
          redirectURL,
          is_draft: isDraft,
        });
        const outFilename = `${outputFolder}/${id}.json`;
        outputFilenames.add(`${id}.json`);
        writeJSON(outFilename, data);
      }
    );
    for (const filename of fs.readdirSync(outputFolder)) {
      if (filename.endsWith('.json') && !outputFilenames.has(filename)) {
        const staleFilename = `${outputFolder}/${filename}`;
        fs.unlinkSync(staleFilename);
      }
    }
    writeCachedJSON('collected.keywords', Array.from(collected_keywords));
    const outFilename = `public/api/keywords.json`;
    writeJSON(outFilename, keywords_toc);
  }
  return collected_keywords;
};

export {
  build_keywords,
  danishTextCountForKeyword,
};
