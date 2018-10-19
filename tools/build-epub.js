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
    rmdir(epubFolder, () => {});
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

const writeContentOpf = () => {
  const poetFirstName = workJson.poet.name.firstname;
  const poetLastName = workJson.poet.name.lastname;
  const fullName = [poetFirstName, poetLastName]
    .filter(x => x != null)
    .join(' ');
  const reverseFullName = [poetFirstName, poetLastName]
    .filter(x => x != null)
    .join(', ');

  let xml = '<?xml version="1.0" encoding="utf-8" standalone="yes"?>';
  xml +=
    '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">';
  xml += '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">';
  xml += `<dc:identifier id="bookid">urn:kalliope:org:${poetId}:${workId}</dc:identifier>`;
  xml += `<dc:title>${workJson.work.title}</dc:title>`;
  xml += `<dc:creator xmlns:opf="http://www.idpf.org/2007/opf" opf:file-as="${reverseFullName}" opf:role="aut">${fullName}</dc:creator>`;
  xml += `<dc:publisher>Kalliope</dc:publisher>`;
  xml += '</metadata>';
  xml += '</package>';
  writeText(`${epubFolder}/content/content.opf`, xml);
};

const main = () => {
  // 0. Find commandline args
  parseCommandline();

  // 1. Lav mappe
  safeMkdir(epubFolder);
  safeMkdir(`${epubFolder}/META-INF`);
  safeMkdir(`${epubFolder}/content`);

  // 1.5. Læs TOC JSON
  readTocJson();

  // 2. Fyld filer i mappen
  writeMimetype();
  writeContainerXML();
  writeContentOpf();

  // 3. zip og fjern mappen og
  zipFolder();
};

main();
