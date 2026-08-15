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
} from './xml.js';
import { mapLimit } from './concurrency.js';

const build_keywords = async collected => {
  const outputFolder = 'public/api/keywords';
  safeMkdir(outputFolder);
  let collected_keywords = new Map(loadCachedJSON('collected.keywords') || []);
  const folder = 'content/keywords';
  const filenames = fs
    .readdirSync(folder)
    .filter(x => x.endsWith('.xml'))
    .map(x => `${folder}/${x}`);
  if (collected_keywords.size === 0 || isFileModified(...filenames)) {
    collected_keywords = new Map();
    let keywords_toc = new Array();
    const outputFilenames = new Set();
    await mapLimit(
      filenames,
      async path => {
        if (!path.endsWith('.xml')) {
          return;
        }
        const doc = loadXMLDoc(path);
        const keyword = getChildByTagName(doc, 'keyword');
        const head = getChildByTagName(keyword, 'head');
        const body = getChildByTagName(keyword, 'body');
        const id = safeGetAttr(keyword, 'id');
        const is_draft = safeGetAttr(keyword, 'draft') === 'true';
        const title = safeGetText(head, 'title');
        const redirectURL = safeGetAttr(keyword, 'redirect-url');
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
          const has_footnotes =
            rawBody.indexOf('<footnote') !== -1 ||
            rawBody.indexOf('<note') !== -1;
          data = {
            ...data,
            is_draft,
            author,
            pictures,
            has_footnotes,
            content_lang: 'da',
            content_html,
          };
        }

        keywords_toc.push({
          id,
          title,
          redirectURL,
          is_draft,
        });
        const outFilename = `${outputFolder}/${id}.json`;
        outputFilenames.add(`${id}.json`);
        writeJSON(outFilename, data);
        collected_keywords.set(id, { id, title });
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
};
