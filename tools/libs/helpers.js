const fs = require('fs');
const entities = require('entities');
const libxml = require('libxmljs');
const bible = require('./bible-abbr.js');
const async = require('async');
const path = require('path');
const sharp = require('sharp');
const CommonData = require('../../pages/helpers/commondata.js');
const deasync = require('deasync');

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

const loadText = filename => {
  if (!fileExists(filename)) {
    return null;
  }
  return fs.readFileSync(filename, { encoding: 'UTF-8' });
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

const writeText = (filename, text) => {
  fs.writeFileSync(filename, text);
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

const safeGetText = (element, child) => {
  if (element) {
    const childElement = element.get(child);
    if (childElement) {
      return childElement.text();
    }
  }
  return null;
};

const safeGetAttr = (element, attrName) => {
  if (element) {
    const attrElement = element.attr(attrName);
    if (attrElement) {
      return attrElement.value();
    }
  }
  return null;
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
      .replace(/''/g, '&rdquo;')
      .replace(/``/g, '&ldquo;')
      .replace(/'/g, '&rsquo;')
      .replace(/&nbsp;- /g, '&nbsp;— ')
      .replace(/ -&ldquo;/g, ' —&ldquo;')
      .replace(/ -$/gm, ' —')
      .replace(/ -([\!;\?\.»«,:\n])/g, / —$1/)
  );
};

const htmlToXml = (
  html,
  collected,
  isPoetry = false,
  isBible = false,
  isFolkevise = false
) => {
  const regexp = /<xref.*?(digt|poem|keyword|work|bibel|dict)=['"]([^'"]*)['"][^>]*>/;
  if (isPoetry && !isBible && !isFolkevise) {
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
        .replace(/\n *(====*) *\n/g, (match, p1) => {
          return `\n<hr width="${p1.length}" class="double"/>\n`;
        })
        .replace(/^( *[_\*\- ]+ *)$/gm, (match, p1) => {
          // <nonum> på afskillerlinjer som f.eks. "* * *" eller "___"
          return `<nonum>${p1}</nonum>`;
        })
        .replace(/^\n/, '')
        .replace(/^ *(<right>.*)$/gm, '$1')
        .replace(/^ *(<center>.*)$/gm, '$1')
        .replace(/^( +)/gm, (match, p1) => {
          return '&nbsp;'.repeat(2 * p1.length);
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
  } else if (isFolkevise) {
    // Flyt strofe-nummer fra egen linje ind i starten af strofens første linje.
    let foundNum = '';
    const collectedLines = [];
    decoded.split(/\n/).forEach(line => {
      const match = line.match(/^\s*(\d+)\.?\s*/);
      if (match) {
        // Linjen er et strofe-nummer, så gem det.
        foundNum = match[1];
        return;
      } else {
        const curLine = foundNum + line;
        collectedLines.push(curLine);
        foundNum = '';
      }
    });
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
      if (isPoetry && !isFolkevise) {
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
    if (isFolkevise) {
      const match = l.match(/^\s*(\d+)\.?\s*/);
      if (match) {
        options.num = match[1];
        options.folkevise = true;
        l = l.replace(/^\s*\d+\.?\s*/, '');
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

const imageSizeAsync = (filename, callback) => {
  if (!fileExists(filename)) {
    const error = `image size failed for file: ${filename}`;
    throw error;
  }
  sharp(filename)
    .metadata()
    .then(metadata => {
      callback(null, { width: metadata.width, height: metadata.height });
    });
};

const imageSizeSync = deasync(imageSizeAsync);

let resizeImageQueue = async.queue((task, callback) => {
  sharp(task.inputfile)
    .resize(task.maxWidth, 10000)
    .max()
    .withoutEnlargement()
    .toFile(task.outputfile, function(err) {
      if (err != null) {
        console.log(err);
      }
      console.log(task.outputfile);
      callback();
    });
}, 2);

const resizeImage = (inputfile, outputfile, maxWidth) => {
  resizeImageQueue.push({ inputfile, outputfile, maxWidth });
};

const buildThumbnails = (topFolder, isFileModified) => {
  const pipeJoinedExts = CommonData.availableImageFormats.join('|');
  const skipRegExps = new RegExp(`-w\\d+\\.(${pipeJoinedExts})$`);

  const handleDirRecursive = dirname => {
    if (!fs.existsSync(dirname)) {
      console.log(`${dirname} mangler, så genererer ingen thumbs deri.`);
      return;
    }
    if (dirname.match(/\/social$/)) {
      return;
    }
    fs.readdirSync(dirname).forEach(filename => {
      const fullFilename = path.join(dirname, filename);
      const stats = fs.statSync(fullFilename);
      if (stats.isDirectory()) {
        handleDirRecursive(fullFilename);
      } else if (
        stats.isFile() &&
        filename.endsWith('.jpg') &&
        !skipRegExps.test(filename)
      ) {
        CommonData.availableImageFormats.forEach((ext, i) => {
          CommonData.availableImageWidths.forEach(width => {
            const outputfile = fullFilename
              .replace(/\.jpg$/, `-w${width}.${ext}`)
              .replace(/\/([^\/]+)$/, '/t/$1');
            safeMkdir(outputfile.replace(/\/[^\/]+?$/, ''));
            if (
              (isFileModified != null && isFileModified(fullFilename)) ||
              !fileExists(outputfile)
            ) {
              resizeImage(fullFilename, outputfile, width);
            }
          });
        });
      }
    });
  };

  handleDirRecursive(topFolder);
};

module.exports = {
  safeMkdir,
  fileExists,
  fileModifiedTime,
  loadJSON,
  loadText,
  loadFile,
  writeJSON,
  writeText,
  loadXMLDoc,
  htmlToXml,
  safeGetText,
  safeGetAttr,
  replaceDashes,
  imageSizeSync,
  buildThumbnails,
  resizeImage,
};
