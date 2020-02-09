const {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
} = require('../libs/caching.js');
const { safeMkdir, writeJSON, htmlToXml } = require('../libs/helpers.js');
const { safeGetInnerXML, loadXMLDoc } = './xml.js';

const build_dict_first_pass = collected => {
  const path = `data/dict.xml`;
  if (!isFileModified(path)) {
    collected.dict = new Map(loadCachedJSON('collected.dict'));
    return;
  }

  safeMkdir('static/api/dict');
  const doc = loadXMLDoc(path);
  doc
    .get('//entries')
    .childNodes()
    .forEach(item => {
      if (item.name() !== 'entry') {
        return;
      }
      const id = item.attr('id').value();
      const title = item.get('ord').text();
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
  doc
    .get('//entries')
    .childNodes()
    .forEach(item => {
      if (item.name() !== 'entry') {
        return;
      }
      const id = item.attr('id').value();
      const body = item.get('forkl');
      const title = item.get('ord').text();
      let phrase = null;
      if (item.get('frase')) {
        phrase = item.get('frase').text();
      }
      const variants = item.find('var').map(varItem => varItem.text());
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
