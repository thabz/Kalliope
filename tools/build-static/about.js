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
      const about = getChildByTagName(doc, 'about');
      const head = getChildByTagName(about, 'head');
      const body = getChildByTagName(about, 'body');
      const title = safeGetText(head, 'title');
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
        content_html: htmlToXml(safeGetInnerXML(body), collected),
      };
      console.log(paths.json);
      writeJSON(paths.json, data);
    });
};

module.exports = {
  build_about_pages,
};
