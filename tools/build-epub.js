const fs = require('fs');
const entities = require('entities');
const archiver = require('archiver');
const rmdir = require('rimraf');
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

const buildManifestXml = () => {
  let items = [];
  iterateWork((id, item) => {
    items.push(id);
  });
  const itemsXml = items
    .map(id => {
      return `    <item id="${id}" href="xhtml/${id}.xhtml" media-type="application/xhtml+xml"/>`;
    })
    .join('\n');
  return `  <manifest>\n${itemsXml}\n  </manifest>\n`;
};

const buildSpineXml = () => {
  let items = [];
  iterateWork((id, item) => {
    items.push(id);
  });
  const itemsXml = items
    .map(id => {
      return `    <itemref idref="${id}" />`;
    })
    .join('\n');
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
    '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">';
  xml += '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">';
  xml += `<dc:identifier id="bookid">urn:kalliope:org:${poetId}:${workId}</dc:identifier>`;
  xml += `<dc:title>${work.title}</dc:title>`;
  if (work.year != null && work.year !== '?') {
    xml += `<dc:date xmlns:opf="http://www.idpf.org/2007/opf" opf:event="publication">${
      work.year
    }</dc:date>`;
  }
  xml += `<dc:date xmlns:opf="http://www.idpf.org/2007/opf" opf:event="modification">${workJson.modified.substring(
    0,
    10
  )}</dc:date>`;
  xml += `<dc:language>${language}</dc:language>`;
  xml += `<dc:creator xmlns:opf="http://www.idpf.org/2007/opf" opf:file-as="${reverseFullName}" opf:role="aut">${fullName}</dc:creator>`;
  xml += `<dc:publisher>Kalliope</dc:publisher>`;
  xml += `<dc:rights>public domain</dc:rights>`;
  xml += '</metadata>\n';
  xml += buildManifestXml();
  xml += buildSpineXml();
  xml += '</package>';
  writeText(`${epubFolder}/content/content.opf`, xml);
};

const wrapPageInBoilerplace = (title, body) => {
  let xml = '<?xml version="1.0" encoding="utf-8" standalone="yes"?>\n';
  xml +=
    '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">\n';
  xml += `<head><title>${title}</title></head>\n`;
  xml += '<body>';
  xml += '<div epub:type="chapter">';
  xml += body;
  xml += '</div>';
  xml += '</body>';
  xml += '</html>';
  return xml;
};

const writeTextPage = (id, item) => {
  const content = `<h1>${item.title}</h1>`;
  const xml = wrapPageInBoilerplace(id, content);
  writeText(`${epubFolder}/content/xhtml/${id}.xhtml`, xml);
};

const writeSectionPage = (id, item) => {
  const content = `<h1>${item.title}</h1>`;
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

  // 1.5. Læs TOC JSON
  readTocJson();

  // 2. Fyld filer i mappen
  writeMimetype();
  writeContainerXML();
  writeContentOpf();
  writePages();

  // 3. zip og fjern mappen og
  zipFolder();
};

main();
