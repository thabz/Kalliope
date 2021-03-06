const {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
} = require('../libs/caching.js');
const { safeMkdir, writeJSON, htmlToXml } = require('../libs/helpers.js');
const {
  safeGetAttr,
  safeGetText,
  getElementsByTagName,
  getChildByTagName,
  getChildrenByTagName,
  tagName,
  safeGetInnerXML,
  loadXMLDoc,
} = require('./xml.js');

const build_dict_first_pass = collected => {
  const path = `data/dict.xml`;
  if (!isFileModified(path)) {
    collected.dict = new Map(loadCachedJSON('collected.dict'));
    return;
  }

  safeMkdir('static/api/dict');
  const doc = loadXMLDoc(path);
  getElementsByTagName(doc, 'entry').forEach(item => {
    const id = safeGetAttr(item, 'id');
    const title = safeGetText(item, 'ord');
    const simpleData = {
      id,
      title,
    };
    collected.dict.set(id, simpleData);
  });
  writeCachedJSON('collected.dict', Array.from(collected.dict));
};

const build_dict_second_pass = collected => {
  const path = `data/dict.xml`;
  if (!isFileModified(path)) {
    return;
  }
  console.log('Building dict');
  safeMkdir('static/api/dict');

  let items = new Array();

  const createItem = (id, title, phrase, variants, body, collected) => {
    const content_html = htmlToXml(safeGetInnerXML(body), collected);
    const has_footnotes =
      content_html.indexOf('<footnote') !== -1 ||
      content_html.indexOf('<note') !== -1;
    const data = {
      item: {
        id,
        title,
        phrase,
        variants,
        has_footnotes,
        content_html,
      },
    };
    writeJSON(`static/api/dict/${id}.json`, data);
    const simpleData = {
      id,
      title,
    };
    items.push(simpleData);
  };

  const doc = loadXMLDoc(path);

  getElementsByTagName(doc, 'entry').forEach(item => {
    const id = safeGetAttr(item, 'id');
    const body = getChildByTagName(item, 'forkl');
    const title = safeGetText(item, 'ord');
    const phrase = safeGetText(item, 'frase');
    const variants = getChildrenByTagName(item, 'var').map(varItem =>
      safeGetText(varItem)
    );
    variants.forEach(variant => {
      createItem(
        variant,
        variant,
        null,
        null,
        `<b>${variant}</b>: se <a dict="${id}">${title}</a>.`,
        collected
      );
    });
    createItem(id, title, phrase, variants, body, collected);
  });
  writeJSON(`static/api/dict.json`, items);
};

module.exports = {
  build_dict_first_pass,
  build_dict_second_pass,
};
