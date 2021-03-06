const fs = require('fs');
const { safeMkdir, htmlToXml, writeJSON } = require('../libs/helpers.js');
const {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
} = require('../libs/caching.js');
const { get_pictures } = require('./parsing.js');
const {
  loadXMLDoc,
  safeGetInnerXML,
  safeGetText,
  safeGetAttr,
  getChildByTagName,
} = require('./xml.js');

const build_keywords = async collected => {
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
    await Promise.all(
      filenames.map(async path => {
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
            '/static/images/keywords',
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
        const outFilename = `static/api/keywords/${id}.json`;
        console.log(outFilename);
        writeJSON(outFilename, data);
        collected_keywords.set(id, { id, title });
      })
    );
    writeCachedJSON('collected.keywords', Array.from(collected_keywords));
    const outFilename = `static/api/keywords.json`;
    console.log(outFilename);
    writeJSON(outFilename, keywords_toc);
  }
  return collected_keywords;
};

module.exports = {
  build_keywords,
};
