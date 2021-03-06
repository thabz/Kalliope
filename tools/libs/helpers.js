const fs = require('fs');
const entities = require('entities');
const { DOMParser } = require('xmldom');
const bible = require('./bible-abbr.js');
const path = require('path');
const plimit = require('p-limit');
const jimp = require('jimp');
const CommonData = require('../../common/commondata.js');

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
      .replace(/ \. \. \./gm, '&nbsp;.&nbsp;.&nbsp;.') // Undgå ombrydning af ". . ."
      .replace(/ —/g, '&nbsp;—') // Undgå tankestreger som ombrydes til sin egen linje
  );
};

const htmlToXml = (html, collected, isPoetry) => {
  if (html == null) {
    return null;
  }
  const regexp = /<xref.*?(digt|poem|keyword|work|bibel|dict)=['"]([^'"]*)['"][^>]*>/;
  if (isPoetry) {
    // Marker strofe numre
    html = html
      .replace(/^(\d+\.?)\s*$/gm, '<versenum>$1</versenum>')
      .replace(/^[ \t]*([IVXLCDM]+\.?) *$/gm, '<versenum>$1</versenum>')
      .replace(/^\[(\d+\.?)\]\s*$/gm, '<versenum>[$1]</versenum>');
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
        .replace(/^( +)/gm, (match, p1) => {
          return '&nbsp;'.repeat(2 * p1.length);
        })
        .replace(/^( *[_\*\- ]+ *)$/gm, (match, p1) => {
          // <nonum> på afskillerlinjer som f.eks. "* * *" eller "___"
          return `<nonum>${p1}</nonum>`;
        })
        .replace(/^\n/, '')
        .replace(/^ *(<right>.*)$/gm, '$1')
        .replace(/^ *(<center>.*)$/gm, '$1')
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

  // Hvis teksten har sine egne linjenummeringer (f.eks. til Aarestrups strofenumre,
  // folkeviser, biblen eller margin-tekster) skal automatisk linjenummerering skippes.
  const hasOwnDisplayNums =
    decoded.indexOf('<num>') > -1 || decoded.indexOf('<margin>') > -1;

  let lineNum = 1;
  lines = decoded.split('\n').map(l => {
    let options = {};
    if (l.indexOf('<resetnum/>') > -1) {
      lineNum = 1;
      l = l.replace('<resetnum/>', '');
    }
    const skipNumForLine =
      l.indexOf('<versenum>') > -1 ||
      l.indexOf('<nonum>') > -1 ||
      l.indexOf('<asterism') > -1 ||
      l.indexOf('<wrap>') > -1 ||
      l.match(/^\s*$/) ||
      l.match(/^\s*<hr[^>]*>\s*$/);
    if (!skipNumForLine) {
      options.num = lineNum;
      if (isPoetry && lineNum % 5 == 0 && !hasOwnDisplayNums) {
        options.displayNum = lineNum;
      }
      lineNum += 1;
    }
    l = l.replace(/<nonum>/g, '').replace(/<\/nonum>/g, '');

    if (l.indexOf('<num>') > -1) {
      options.displayNum = l.match(/<num>(.*)<\/num>/)[1];
      l = l.replace(/<num>(.*)<\/num>/, '');
    }
    if (l.indexOf('<margin>') > -1) {
      options.margin = l.match(/<margin>(.*)<\/margin>/)[1];
      l = l.replace(/<margin>(.*)<\/margin>/, '');
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

const resizeImage = async (inputfile, outputfile, maxWidth) => {
  return new Promise((resolve, reject) => {
    const task = { inputfile, outputfile, maxWidth };
    jimp
      .read(task.inputfile)
      .then(image => {
        if (image.bitmap.width < maxWidth) {
          image.writeAsync(task.outputfile).then(() => {
            console.log(outputfile);
            resolve(outputfile);
          });
        } else {
          image
            .resize(task.maxWidth, jimp.AUTO)
            .writeAsync(task.outputfile)
            .then(() => {
              console.log(outputfile);
              resolve(outputfile);
            });
        }
      })
      .catch(err => {
        console.log(err);
        console.log(task.outputfile);
        reject(err);
      });
  });
};

const limit = plimit(5);

const buildThumbnails = async (topFolder, isFileModifiedMethod) => {
  const tasks = [];
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
      if (filename === 't') {
        return;
      }
      const fullFilename = path.join(dirname, filename);
      const stats = fs.statSync(fullFilename);
      if (stats.isDirectory()) {
        handleDirRecursive(fullFilename);
      } else if (
        stats.isFile() &&
        filename.endsWith('.jpg') &&
        !skipRegExps.test(filename)
      ) {
        if (
          isFileModifiedMethod != null &&
          !isFileModifiedMethod(fullFilename)
        ) {
          return;
        }
        CommonData.availableImageFormats.forEach((ext, i) => {
          CommonData.availableImageWidths.forEach(width => {
            const outputfile = fullFilename
              .replace(/\.jpg$/, `-w${width}.${ext}`)
              .replace(/\/([^\/]+)$/, '/t/$1');
            safeMkdir(outputfile.replace(/\/[^\/]+?$/, ''));
            if (!fileExists(outputfile)) {
              tasks.push(
                limit(() => {
                  return resizeImage(fullFilename, outputfile, width);
                })
              );
            }
          });
        });
      }
    });
  };

  handleDirRecursive(topFolder);

  await Promise.all(tasks);
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
  htmlToXml,
  replaceDashes,
  buildThumbnails,
  resizeImage,
};
