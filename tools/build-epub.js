const fs = require('fs');
const entities = require('entities');
const archiver = require('archiver');
const rmdir = require('rimraf');
const Paths = require('../pages/helpers/paths.js');
const { safeMkdir, writeText, loadJSON } = require('./libs/helpers.js');

let poetId = null;
let workId = null;
let workJson = null;
let epubFolder = 'epub-tmp';
let epubFilename = 'epub-tmp.epub';

const writeContainerXML = () => {
  const containerXML =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
    '<rootfiles>' +
    '<rootfile full-path="content/content.opf" media-type="application/oebps-package+xml"/>' +
    '</rootfiles>' +
    '</container>';
  writeText(epubFolder + '/META-INF/container.xml', containerXML);
};

const writeMimetype = () => {
  writeText(epubFolder + '/mimetype', 'application/epub+zip');
};

const zipFolder = () => {
  var output = fs.createWriteStream(epubFilename);
  var archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level.
  });
  archive.directory(epubFolder, false);
  output.on('close', function() {
    console.info(epubFilename + ' done');
    //rmdir(epubFolder, () => {});
  });
  archive.pipe(output);
  archive.finalize();
};

const parseCommandline = () => {
  if (process.argv.length !== 4) {
    console.error('Skal kaldes med yarn build-epub poet-id work-id');
    process.exit();
  }
  poetId = process.argv[2];
  workId = process.argv[3];
  epubFolder = `${poetId}-${workId}`;
  epubFilename = epubFolder + '.epub';
};

const readTocJson = () => {
  const filename = `static/api/${poetId}/${workId}-toc.json`;
  console.log(filename);
  workJson = loadJSON(filename);
};

const iterateWork = callback => {
  let id_seq = 1;
  const recurse = section => {
    section.forEach(item => {
      if (item.type === 'text') {
        callback(item.id, item);
      } else if (item.type === 'section') {
        const id = item.id || id_seq++;
        callback('section-' + id, item);
        recurse(item.content);
      }
    });
  };
  recurse(workJson.toc);
};

const writeToc = () => {
  let id_seq2 = 1;

  // Returnerer altid en liste af <li>
  const recurse = section => {
    let toc = '';
    section.forEach(item => {
      if (item.type === 'text') {
        toc += `<li id="${item.id}"><a href="${item.id}.xhtml">${
          item.title
        }</a></li>\n`;
      } else if (item.type === 'section') {
        const id = item.id || id_seq2++;
        const fullId = 'section-' + id;
        toc += '<li>\n';
        toc += `<a href="${fullId}.xhtml">${item.title}</a>`;
        toc += '<ol>\n';
        toc += recurse(item.content);
        toc += '</ol></li>\n';
      }
    });
    return toc;
  };
  const toc = recurse(workJson.toc);

  let xml =
    '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">\n';
  xml += '<head><title>Indhold</title></head>';
  xml += '<body>';
  xml += '<section epub:type="frontmatter toc">';
  xml += '<header><h1>Indhold</h1></header>';
  xml += '<nav epub:type="toc" id="toc">';
  xml += '<ol>';
  xml += toc;
  xml += '</ol>';
  xml += '</nav>';
  xml += '</section>';
  xml += '</body>';
  xml += '</html>';
  writeText(`${epubFolder}/content/xhtml/toc.xhtml`, xml);
};

const buildManifestXml = () => {
  let items = [];
  iterateWork((id, item) => {
    items.push(id);
  });
  let itemsXml = items
    .map(id => {
      return `    <item id="${id}" href="xhtml/${id}.xhtml" media-type="application/xhtml+xml"/>`;
    })
    .join('\n');
  itemsXml +=
    '<item id="book.css" href="styles/books.css"  media-type="text/css"/>\n';
  itemsXml +=
    '<item id="toc" properties="nav" href="xhtml/toc.xhtml"  media-type="application/xhtml+xml"/>\n';
  return `  <manifest>\n${itemsXml}\n  </manifest>\n`;
};

const buildSpineXml = () => {
  let items = [];
  iterateWork((id, item) => {
    items.push(id);
  });
  let chapters = items
    .map(id => {
      return `    <itemref idref="${id}" />`;
    })
    .join('\n');
  // TODO: Add cover
  // TODO: Add frontispiece
  // TODO: Add colophone
  itemsXml = '<itemref idref="toc" />\n';

  itemsXml += chapters;
  return `  <spine>\n${itemsXml}\n  </spine>\n`;
};

const writeContentOpf = () => {
  const poet = workJson.poet;
  const work = workJson.work;
  const poetFirstName = poet.name.firstname;
  const poetLastName = poet.name.lastname;
  const fullName = [poetFirstName, poetLastName]
    .filter(x => x != null)
    .join(' ');
  const reverseFullName = [poetLastName, poetFirstName]
    .filter(x => x != null)
    .join(', ');
  const language = poet.lang + '-' + poet.country.toUpperCase();

  let xml = '<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n';
  xml +=
    '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">';
  xml +=
    '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">';
  xml += `<dc:identifier id="bookid">urn:kalliope:org:${poetId}:${workId}</dc:identifier>`;
  xml += `<dc:title>${work.title}</dc:title>`;
  xml += `<dc:language>${language}</dc:language>`;
  xml += `<dc:creator opf:file-as="${reverseFullName}" opf:role="aut">${fullName}</dc:creator>`;
  xml += `<dc:publisher>Kalliope</dc:publisher>`;
  if (work.year != null && work.year !== '?') {
    xml += `<dc:date  opf:event="publication">${work.year}</dc:date>`;
  }
  xml += `<dc:date opf:event="modification">${workJson.modified.substring(
    0,
    10
  )}</dc:date>`;
  xml += `<dc:rights>public domain</dc:rights>`;
  xml += '</metadata>\n';
  xml += buildManifestXml();
  xml += buildSpineXml();
  xml += '</package>';
  writeText(`${epubFolder}/content/content.opf`, xml);
};

const writeStyles = () => {
  // TODO: div.hr
  let css = '';
  css += 'span.sc { font-variant: small-caps; }\n';
  css += 'p.poem-line { margin: 0; line-height: 1.5; }\n';
  css += 'p.half-height-blank { line-height: 0.8; }\n';
  css +=
    '.hr { height: 4px; padding-bottom: px; border-bottom: 1px solid black;  }\n';
  writeText(`${epubFolder}/content/styles/books.css`, css);
};

const wrapPageInBoilerplace = (title, body) => {
  let xml = '<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n';
  xml +=
    '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">\n';
  xml += '<head>\n';
  xml += `  <title>${title}</title>\n`;
  xml += '  <link href="../styles/book.css"/>\n';
  xml += '</head>\n';
  xml += '<body>\n';
  xml += '<div>';
  xml += body;
  xml += '</div>';
  xml += '</body>\n';
  xml += '</html>\n';
  return xml;
};

const expandHtml = s => {
  return s
    .replace(/<sc>/g, '<span class="sc">')
    .replace(/<\/sc>/g, '</span>')
    .replace(/^(\s+)/, (_, p1) => {
      return;
    })
    .replace(/<note.*?<\/note>/g, '') // TODO: Understøt noter
    .replace(/<hr width=\"([^"]*)"\/>/, (_, p1) => {
      return `<span class="hr hr-${p1}" />`;
    });
};

const writeTextPage = (textId, item) => {
  const filename = `${Paths.textFolder(textId)}/${textId}.json`;
  const textJson = loadJSON(filename);
  const lines = textJson.text.content_html.map(l => {
    const rawHtml = l[0];
    const options = l[1] || {};
    if (options.hr) {
      return '<div class="hr" />';
    }
    const expandedHtml = options.html ? expandHtml(rawHtml) : rawHtml;
    let className = 'poem-line';
    if (expandedHtml.trim().length == 0) {
      className += ' half-height-blank';
    }
    return `<p class="${className}">${expandedHtml}</p>`;
  });

  let content = `<h2>${item.title}</h2>\n`;
  content += `<!-- ${filename} -->\n`;
  content += lines.join('\n');
  const xml = wrapPageInBoilerplace(textId, content);
  writeText(`${epubFolder}/content/xhtml/${textId}.xhtml`, xml);
};

const writeSectionPage = (id, item) => {
  const content = `<h2>${item.title}</h2>\n`;
  const xml = wrapPageInBoilerplace(id, content);
  writeText(`${epubFolder}/content/xhtml/${id}.xhtml`, xml);
};

const writePages = () => {
  iterateWork((id, item) => {
    if (item.type === 'text') {
      writeTextPage(id, item);
    } else if (item.type === 'section') {
      writeSectionPage(id, item);
    }
  });
};

const main = () => {
  // 0. Find commandline args
  parseCommandline();

  // 1. Lav mappe
  safeMkdir(epubFolder);
  safeMkdir(`${epubFolder}/META-INF`);
  safeMkdir(`${epubFolder}/content`);
  safeMkdir(`${epubFolder}/content/xhtml`);
  safeMkdir(`${epubFolder}/content/styles`);

  // 1.5. Læs TOC JSON
  readTocJson();

  // 2. Fyld filer i mappen
  writeMimetype();
  writeContainerXML();
  writeContentOpf();
  writeToc();
  writeStyles();
  writePages();

  // 3. zip og fjern mappen og
  zipFolder();
};

main();
