const fs = require('fs');
const entities = require('entities');
const libxml = require('libxmljs');
const bible = require('./bible-abbr.js');

const safeMkdir = dirname => {
  try {
    fs.mkdirSync(dirname);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
};

const fileExists = filename => {
  return fs.existsSync(filename);
};

const fileModifiedTime = filename => {
  if (fileExists(filename)) {
    // Older node.js has no mtimeMs so we use mtime.getTime()
    return (
      fs.statSync(filename).mtimeMs || fs.statSync(filename).mtime.getTime()
    );
  } else {
    return null;
  }
};

const loadFile = filename => {
  if (!fileExists(filename)) {
    return null;
  }
  return fs.readFileSync(filename);
};

const loadJSON = filename => {
  const data = loadFile(filename);
  return data ? JSON.parse(data) : null;
};

const writeJSON = (filename, data) => {
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, json);
};

const loadXMLDoc = filename => {
  const data = loadFile(filename);
  if (data == null) {
    return null;
  }
  try {
    return libxml.parseXmlString(data);
  } catch (err) {
    console.log(`Problem with ${filename}`);
    throw err;
  }
};

const replaceDashes = html => {
  if (html == null) {
    return null;
  }
  return entities.decodeHTML(
    html
      .replace(/ -&nbsp;/g, ' —&nbsp;')
      .replace(/ - /g, ' — ')
      .replace(/ -/g, ' —')
      .replace(/^- /gm, '— ')
      .replace(/>- /g, '>— ')
      .replace(/,,- /g, ',,— ')
      .replace(/,,/g, '&bdquo;')
      .replace(/''/g, '&ldquo;')
      .replace(/'/g, '&rsquo;')
      .replace(/&nbsp;- /g, '&nbsp;— ')
      .replace(/ -&ldquo;/g, ' —&ldquo;')
      .replace(/ -$/gm, ' —')
      .replace(/ -([\!;\?\.»«,:\n])/g, / —$1/)
  );
};

const htmlToXml = (html, collected, isPoetry = false, isBible = false) => {
  const regexp = /<xref\s+(digt|poem|keyword|work|bibel|dict)=['"]([^'"]*)['"][^>]*>/;
  if (isPoetry && !isBible) {
    // Marker strofe numre
    html = html
      .replace(/^(\d+\.?)\s*$/gm, '<num>$1</num>')
      .replace(/^[ \t]*([IVXLCDM]+\.?) *$/gm, '<num>$1</num>')
      .replace(/^\[(\d+\.?)\]\s*$/gm, '<num>[$1]</num>');
  }
  html = html
    .replace(/\n/g, '::NEWLINE-PLACEHOLDER::') // Regexp nedenunder spænder ikke over flere linjer... underligt.
    .replace(/<!--.*?-->/g, '')
    .replace(/::NEWLINE-PLACEHOLDER::/g, '\n');
  let decoded = entities.decodeHTML(
    replaceDashes(
      html
        .replace(/\n *(----*) *\n/g, (match, p1) => {
          return `\n<hr width="${p1.length}"/>\n`;
        })
        .replace(/^( *[_\*\- ]+ *)$/gm, (match, p1) => {
          // <nonum> på afskillerlinjer som f.eks. "* * *" eller "___"
          return `<nonum>${p1}</nonum>`;
        })
        .replace(/^\n/, '')
        .replace(/^ *(<right>.*)$/gm, '$1')
        .replace(/^ *(<center>.*)$/gm, '$1')
        .replace(/^( +)/gm, (match, p1) => {
          return '&nbsp;'.repeat(p1.length);
        })
    )
  );

  while (decoded.match(regexp)) {
    decoded = decoded.replace(regexp, (_, type, id) => {
      if (type === 'poem') {
        const originalAttribute = `${id}`;
        let highlight = id.match(/,(.*)$/);
        if (highlight != null) {
          id = id.replace(',' + highlight[1], '');
        }
        const meta = collected.texts.get(id);
        if (meta == null) {
          const error = `xref dead poem link: ${id}`;
          throw error;
        } else {
          return `<a ${type}="${originalAttribute}">»${meta.title}«</a>`;
        }
      } else if (type === 'keyword') {
        const meta = collected.keywords.get(id);
        if (meta == null) {
          const error = `xref dead keyword link: ${id}`;
          throw error;
        } else {
          return `<a ${type}="${id}">${meta.title}</a>`;
        }
      } else if (type === 'dict') {
        const meta = collected.dict.get(id);
        if (meta == null) {
          const error = `xref dead dictionary link: ${id}`;
          throw error;
        } else {
          return `<a dict="${id}">${meta.title}</a>`;
        }
      } else if (type === 'bibel') {
        const originalAttribute = `${id}`;
        id = id.replace(/^bibel/, '');
        let verses = id.match(/,(.*)$/);
        if (verses != null) {
          id = id.replace(',' + verses[1], '');
          verses = verses[1];
        }
        let chapter = id.match(/(\d*)$/);
        if (chapter != null) {
          id = id.replace(chapter[1], '');
          chapter = chapter[1].replace(/^0*/, '');
        } else {
          const error = `xref dead bible link: ${originalAttribute}`;
          throw error;
        }
        const abbr = bible.abbrevations[id];
        if (abbr == null) {
          const error = `xref dead bible link: ${originalAttribute}`;
          throw error;
        } else if (verses == null) {
          return `<a bible="${originalAttribute}">${abbr}${chapter}</a>`;
        } else {
          return `<a bible="${originalAttribute}">${abbr}${chapter},${verses}</a>`;
        }
      }
    });
  }

  if (isBible) {
    // Saml linjer som hører til samme vers.
    const collectedLines = [];
    let curLine = '';
    decoded.split(/\n/).forEach(line => {
      if (line.match(/^\s*$/)) {
        if (curLine !== '') {
          collectedLines.push(curLine);
          curLine = '';
        }
        collectedLines.push(line);
      } else if (line.match(/^\s*\d+,?\d*\.\s*/)) {
        if (curLine !== '') {
          collectedLines.push(curLine);
        }
        curLine = line;
      } else {
        curLine += line.replace(/\s+/, ' ');
      }
    });
    collectedLines.push(curLine);
    decoded = collectedLines.join('\n');
  }

  let lineNum = 1;
  lines = decoded.split('\n').map(l => {
    let options = {};
    if (l.indexOf('<resetnum/>') > -1) {
      lineNum = 1;
      l = l.replace('<resetnum/>', '');
    }
    const hasNonum =
      l.indexOf('<nonum>') > -1 ||
      l.indexOf('<wrap>') > -1 ||
      l.indexOf('<num>') > -1 ||
      l.match(/^\s*$/) ||
      l.match(/^\s*<hr[^>]*>\s*$/);
    if (!hasNonum) {
      if (isPoetry) {
        options.num = lineNum;
      }
      lineNum += 1;
    } else {
      l = l.replace(/<nonum>/g, '').replace(/<\/nonum>/g, '');
    }
    if (isBible) {
      const match = l.match(/^\s*(\d+,?\d*)\.\s*/);
      if (match) {
        options.num = match[1];
        options.bible = true;
        l = l.replace(/^\s*\d+,?\d*\.\s*/, '');
      }
    }
    if (l.indexOf('<center>') > -1) {
      l = l.replace('<center>', '').replace('</center>', '');
      options.center = true;
    }
    if (l.indexOf('<right>') > -1) {
      l = l.replace('<right>', '').replace('</right>', '');
      options.right = true;
    }
    if (l.indexOf('<wrap>') > -1) {
      l = l.replace('<wrap>', '').replace('</wrap>', '');
      options.wrap = true;
    }
    if (l.indexOf('<hr ') > -1) {
      options.hr = true;
    }
    // Marker linjer som skal igennem XML parseren client-side.
    if (l.match(/<.*>/)) {
      options.html = true;
    }
    if (Object.keys(options).length > 0) {
      return [l, options];
    } else {
      return [l];
    }
  });
  return lines;
};

module.exports = {
  safeMkdir,
  fileExists,
  fileModifiedTime,
  loadJSON,
  loadFile,
  writeJSON,
  loadXMLDoc,
  htmlToXml,
  replaceDashes,
};
