const fs = require('fs');
const entities = require('entities');
const libxml = require('libxmljs');

const safeMkdir = dirname => {
  try {
    fs.mkdirSync(dirname);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
};

const writeJSON = (filename, data) => {
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, json);
};

const loadXMLDoc = filename => {
  const data = fs.readFileSync(filename);
  const doc = libxml.parseXmlString(data);
  return doc;
};

const replaceDashes = html => {
  if (html == null) {
    return null;
  }
  return html
    .replace(/ -&nbsp;/g, ' —&nbsp;')
    .replace(/ - /g, ' — ')
    .replace(/>- /g, '>— ')
    .replace(/&nbsp;- /g, '&nbsp;— ')
    .replace(/ -&ldquo;/g, ' —&ldquo;')
    .replace(/ -$/gm, ' —')
    .replace(/ -([\!;\?\.»«,:\n])/g, / —$1/);
};

const htmlToXml = (html, collected) => {
  const regexp = /<xref\s+(digt|poem|keyword|work|bibel)=['"]([^'"]*)['"][^>]*>/;
  let decoded = entities.decodeHTML(
    replaceDashes(
      html
        .replace(/^\n/, '')
        .replace(/^\s*(<right>.*)$/gm, '$1')
        .replace(/^\s*(<center>.*)$/gm, '$1')
        .replace(/\n( +)/g, (match, p1) => {
          return '\n' + '&nbsp;'.repeat(p1.length);
        })
        .replace(/\n *(----*) *\n/g, (match, p1) => {
          return `\n<hr width=${p1.length}/>\n`;
        })
        .replace(/\n/g, '<br/>')
        .replace(/,,/g, '&bdquo;')
        .replace(/''/g, '&ldquo;')
    )
  );
  while (decoded.match(regexp)) {
    decoded = decoded.replace(regexp, (_, type, id) => {
      if (type === 'poem') {
        const meta = collected.texts.get(id);
        if (meta == null) {
          return 'DEAD-LINK';
        } else {
          return `<a ${type}="${id}">»${meta.title}«</a>`;
        }
      } else if (type === 'keyword') {
        // TODO: Implement
      } else if (type === 'ord') {
        // TODO: Implement
      } else if (type === 'bibel') {
        // TODO: Implement
      }
    });
  }
  return decoded;
};

module.exports = { safeMkdir, writeJSON, loadXMLDoc, htmlToXml, replaceDashes };
