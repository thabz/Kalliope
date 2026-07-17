import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';
import * as bible from './bible-abbr.js';
import path from 'path';
import plimit from 'p-limit';
import sharp from 'sharp';
import * as CommonData from '../../common/commondata.js';
import * as ImagePaths from '../../common/imagepaths.js';

const envInt = (name, fallback) => {
  const value = parseInt(process.env[name], 10);
  return Number.isNaN(value) ? fallback : value;
};

sharp.cache({
  memory: Math.max(0, envInt('KALLIOPE_SHARP_CACHE_MEMORY', 64)),
  files: Math.max(0, envInt('KALLIOPE_SHARP_CACHE_FILES', 0)),
  items: Math.max(0, envInt('KALLIOPE_SHARP_CACHE_ITEMS', 0)),
});
sharp.concurrency(Math.max(1, envInt('KALLIOPE_SHARP_CONCURRENCY', 1)));

const safeMkdir = dirname => {
  try {
    fs.mkdirSync(dirname, { recursive: true });
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

const xmlEntityMap = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  quot: '"',
};

const decodeXmlCharacterReferences = text =>
  text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[A-Za-z][A-Za-z0-9]+);/g, (m, e) => {
    if (e.startsWith('#x')) {
      return String.fromCodePoint(parseInt(e.slice(2), 16));
    }
    if (e.startsWith('#')) {
      return String.fromCodePoint(parseInt(e.slice(1), 10));
    }
    if (xmlEntityMap[e] != null) {
      return xmlEntityMap[e];
    }
    throw new Error(`Unknown XML entity ${m}`);
  });

const replaceDashes = html => {
  if (html == null) {
    return null;
  }
  return decodeXmlCharacterReferences(
    html
      .replace(/ -&#160;/g, ' —&#160;')
      .replace(/ -\u00a0/g, ' —\u00a0')
      .replace(/ - /g, ' — ')
      .replace(/ -/g, ' —')
      .replace(/^- /gm, '— ')
      .replace(/>- /g, '>— ')
      .replace(/,,- /g, ',,— ')
      .replace(/,,/g, '„')
      .replace(/''/g, '”')
      .replace(/``/g, '“')
      .replace(/'/g, '’')
      .replace(/&#160;- /g, '&#160;— ')
      .replace(/\u00a0- /g, '\u00a0— ')
      .replace(/ -“/g, ' —“')
      .replace(/ -$/gm, ' —')
      .replace(/ -([\!;\?\.»«,:\n])/g, / —$1/)
      .replace(/ \. \. \./gm, '\u00a0.\u00a0.\u00a0.') // Undgå ombrydning af ". . ."
      .replace(/ —/g, '\u00a0—') // Undgå tankestreger som ombrydes til sin egen linje
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
    .replace(/\n/g, '::NEWLINE-PLACEHOLDER::')
    .replace(
      /(^|::NEWLINE-PLACEHOLDER::)[ \t]*<!--.*?-->[ \t]*(::NEWLINE-PLACEHOLDER::|$)/g,
      (match, before) => before
    )
    .replace(/[ \t]*<!--.*?-->[ \t]*/g, match => {
      return /^[ \t]+<!--.*?-->[ \t]+$/.test(match) ? ' ' : '';
    })
    .replace(/::NEWLINE-PLACEHOLDER::/g, '\n');
  let decoded = decodeXmlCharacterReferences(
    replaceDashes(
      html
        .replace(/\n *(----*) *\n/g, (match, p1) => {
          return `\n<hr width="${p1.length}"/>\n`;
        })
        .replace(/\n *(====*) *\n/g, (match, p1) => {
          return `\n<hr width="${p1.length}" class="double"/>\n`;
        })
        .replace(/^( +)/gm, (match, p1) => {
          return '\u00a0'.repeat(2 * p1.length);
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
  const lines = decoded.split('\n').map(l => {
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
  try {
    await sharp(inputfile)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .toFile(outputfile);
    console.log(outputfile);
    return outputfile;
  } catch (err) {
    console.log(err);
    console.log(outputfile);
    throw err;
  }
};

const thumbnailConcurrency = Math.max(
  1,
  parseInt(process.env.KALLIOPE_THUMBNAIL_CONCURRENCY, 10) || 1
);
const limit = plimit(thumbnailConcurrency);

const defaultThumbnailOutputPath = (fullFilename, width, ext) => {
  return `public${ImagePaths.thumbnailSrc(
    fullFilename.replace(/^public/, ''),
    width,
    ext
  )}`;
};

const buildThumbnails = async (
  topFolder,
  isFileModifiedMethod,
  options = {}
) => {
  const tasks = [];
  const thumbnailOutputPath =
    options.thumbnailOutputPath || defaultThumbnailOutputPath;
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
        const hasModificationCache = isFileModifiedMethod != null;
        const sourceModified =
          hasModificationCache && isFileModifiedMethod(fullFilename);
        const sourceMtime = fileModifiedTime(fullFilename);
        CommonData.availableImageFormats.forEach((ext, i) => {
          CommonData.availableImageWidths.forEach(width => {
            const outputfile = thumbnailOutputPath(fullFilename, width, ext);
            safeMkdir(outputfile.replace(/\/[^\/]+?$/, ''));
            const outputMtime = fileModifiedTime(outputfile);
            if (
              outputMtime == null ||
              (hasModificationCache
                ? sourceModified
                : sourceMtime > outputMtime)
            ) {
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

export {
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
