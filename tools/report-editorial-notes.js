import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

const normalizedText = node => (node.textContent ?? '').replace(/\s+/g, ' ').trim();
const isDeclaration = text => /(?:noter|noterne).*?(?:asterisk|asteriks|(?:foranstillet|markeret med)\s+\*)/i.test(text);
const serializer = new XMLSerializer();

const notePositions = xml => {
  const lineStarts = [0];
  for (const match of xml.matchAll(/\r\n?|\n/g)) lineStarts.push(match.index + match[0].length);
  const positions = [];
  let lineIndex = 0;
  // Skip comments, CDATA and processing instructions, including example tags.
  const tokens = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<(?:[^"'<>]|"[^"]*"|'[^']*')*>/g;
  for (const match of xml.matchAll(tokens)) {
    if (/^<(?:note|footnote)(?=[\s/>])/.test(match[0]) === false) continue;
    while (lineIndex + 1 < lineStarts.length && lineStarts[lineIndex + 1] <= match.index) lineIndex += 1;
    positions.push({ line: lineIndex + 1, column: match.index - lineStarts[lineIndex] + 1 });
  }
  return positions;
};

// These are review groups, not rules for assigning provenance during a build.
export const inspectWork = (xml, filename) => {
  const errors = [];
  const document = new DOMParser({
    locator: {},
    onError: (level, message) => {
      if (level !== 'warning') errors.push(message);
    },
  }).parseFromString(xml, 'application/xml');
  if (errors.length > 0) throw new Error(`${filename}: ${errors.join('; ')}`);
  if (document.documentElement?.tagName !== 'kalliopework') return [];

  const rows = [];
  const visit = (node, scope = 'work') => {
    if (node.nodeType !== 1) return;
    const currentScope = node.tagName === 'text' ? node.getAttribute('id') : scope;
    if (node.tagName === 'note' || node.tagName === 'footnote') {
      const content = serializer.serializeToString(node);
      const text = normalizedText(node);
      rows.push({
        file: filename,
        index: rows.length,
        line: node.lineNumber,
        column: node.columnNumber,
        scope: currentScope,
        tag: node.tagName,
        metadata: node.parentNode?.nodeName === 'notes',
        type: node.getAttribute('type'),
        editorial: node.getAttribute('editorial') === 'true',
        authorMarker: /^\s*\*+(?:\))?/.exec(text)?.[0].trim() ?? null,
        translation: node.hasAttribute('unknown-original-by') ||
          Array.from(node.getElementsByTagName('xref')).some(xref => xref.getAttribute('type') === 'translation'),
        hash: createHash('sha256').update(content.replace(/ editorial="true"/g, '')).digest('hex'),
        text,
        xml: content,
      });
    }
    for (const child of Array.from(node.childNodes)) visit(child, currentScope);
  };
  visit(document.documentElement);

  const positions = notePositions(xml);
  if (positions.length !== rows.length) throw new Error(`${filename}: notepositioner stemmer ikke med XML-træet`);
  for (const row of rows) Object.assign(row, positions[row.index]);

  const declarations = rows.filter(row => row.metadata === true && isDeclaration(row.text));
  for (const row of rows) {
    const declaration = declarations.find(item => item.scope === row.scope) ??
      declarations.find(item => item.scope === 'work');
    row.declaration = declaration?.index ?? null;
    if (declarations.includes(row)) row.group = 'asterisk-declaration';
    else if (declaration != null && (row.authorMarker != null ||
      (row.tag === 'footnote' && /^Alle fodnoter og noter markeret/i.test(declaration.text)))) row.group = 'declared-source';
    else if (declaration != null) row.group = 'declared-editorial';
    else if (row.type === 'credits') row.group = 'credits';
    else if (row.type === 'errata') row.group = 'errata';
    else if (row.authorMarker != null) row.group = 'asterisk-without-declaration';
    else if (row.translation === true) row.group = 'translation-reference';
    else if (/^[^\[\]\n]{1,100}\]\s*\S/.test(row.text)) row.group = 'correction';
    else row.group = row.metadata === true ? 'other-metadata' : 'other-inline';
  }
  return rows;
};

export const collectNotes = (rootDir = process.cwd()) => {
  const rows = [];
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory() === true) walk(filename);
      else if (entry.isFile() === true && entry.name.endsWith('.xml')) {
        const xml = fs.readFileSync(filename, 'utf8');
        if (/<kalliopework\b/.test(xml)) rows.push(...inspectWork(xml, path.relative(rootDir, filename)));
      }
    }
  };
  walk(path.join(rootDir, 'fdirs'));
  return rows;
};

const exceptionKey = row => `${row.file}#${row.scope}#${row.hash}`;

export const inventoryHash = rows => createHash('sha256').update(
  rows.map(row => `${exceptionKey(row)}#${row.editorial}`).join('\n')
).digest('hex');

export const reviewExceptions = (rows, groups) => {
  const byKey = new Map(rows.map(row => [exceptionKey(row), row]));
  const result = new Map();
  for (const group of groups) {
    for (const [file, entries] of Object.entries(group.files)) {
      for (const entry of entries) {
        const key = exceptionKey({ file, ...entry });
        const row = byKey.get(key);
        if (row == null) throw new Error(`Uafklaret note er ændret eller mangler: ${file}, ${entry.scope}`);
        if (row.editorial === true) throw new Error(`Uafklaret note har editorial-markering: ${file}, ${entry.scope}`);
        if (result.has(key)) throw new Error(`Gentaget undtagelse: ${file}, ${entry.scope}`);
        result.set(key, { ...row, uncertainty: group.reason });
      }
    }
  }
  return [...result.values()];
};

const main = () => {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const unresolved = args.includes('--unresolved');
  const group = args.find(arg => arg.startsWith('--group='))?.slice(8);
  const unknown = args.filter(arg => arg !== '--json' && arg !== '--unresolved' && arg.startsWith('--group=') !== true);
  if (unknown.length > 0) throw new Error('Brug: node tools/report-editorial-notes.js [--json] [--unresolved] [--group=GRUPPE]');
  const allRows = collectNotes();
  const review = JSON.parse(fs.readFileSync('tools/data/editorial-note-exceptions.json', 'utf8'));
  const exceptions = new Map(reviewExceptions(allRows, review.groups).map(row => [exceptionKey(row), row]));
  const rows = allRows
    .filter(row => (group == null || row.group === group) && (unresolved === false || exceptions.has(exceptionKey(row))))
    .map(row => exceptions.get(exceptionKey(row)) ?? row);
  if (json === true) {
    for (const row of rows) console.log(JSON.stringify(row));
    return;
  }
  const counts = new Map();
  for (const row of rows) {
    const count = counts.get(row.group) ?? { total: 0, editorial: 0 };
    count.total += 1;
    if (row.editorial === true) count.editorial += 1;
    counts.set(row.group, count);
  }
  console.log(`Noter: ${rows.length}; værkfiler: ${new Set(rows.map(row => row.file)).size}`);
  console.log(`Inventar-SHA256: ${inventoryHash(allRows)}`);
  console.log(`Dokumenterede uafklarede noter: ${exceptions.size}`);
  if (inventoryHash(allRows) !== review.inventoryHash) console.log('Inventaret er ændret siden gennemgangen; rapportens dækningsantal gælder dens registrerede version.');
  console.log('Gennemgangsgruppe\tI alt\tMarkeret editorial');
  for (const [name, count] of [...counts].sort(([a], [b]) => a.localeCompare(b, 'en'))) {
    console.log(`${name}\t${count.total}\t${count.editorial}`);
  }
};

if (process.argv[1] != null && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
