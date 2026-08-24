import fs from 'fs';
import { fileURLToPath } from 'url';

const structuralElements = [
  'body',
  'content',
  'head',
  'poetry',
  'prose',
  'quote',
  'section',
  'subwork',
  'text',
  'workbody',
  'workhead',
];

const structuralTagPattern = new RegExp(
  `^[ \\t]+(?=<\\/?(?:${structuralElements.join('|')})(?:[ \\t>/]))`,
  'gm',
);

const anyStructuralTagPattern = new RegExp(
  `<\\/?(?:${structuralElements.join('|')})(?:[ \\t>/])`,
  'g',
);

const metadataFields = [
  'breadcrumbtitle',
  'dates',
  'firstline',
  'form',
  'indextitle',
  'keywords',
  'linktitle',
  'metre',
  'nofirstline',
  'notes',
  'pagebreaks',
  'pictures',
  'quality',
  'rhyme',
  'source',
  'structure',
  'subtitle',
  'suptitle',
  'syllables',
  'title',
  'toctitle',
  'year',
];

const metadataFieldPattern = metadataFields.join('|');
const adjacentMetadataFieldsPattern = new RegExp(
  `(<(?:${metadataFieldPattern})(?:[ \\t][^<>]*)?\\/>|` +
    `<\\/(?:${metadataFieldPattern})>)(?=<(?:${metadataFieldPattern})(?:[ \\t>/]))`,
  'g',
);

export const structuralTagsOutsideColumnZero = xml => {
  const violations = [];
  let match;

  while ((match = anyStructuralTagPattern.exec(xml)) != null) {
    const lineStart = xml.lastIndexOf('\n', match.index - 1) + 1;
    if (match.index !== lineStart) {
      violations.push(xml.slice(lineStart, xml.indexOf('\n', match.index)));
    }
  }

  return violations;
};

const addTextSpacing = xml =>
  xml.replace(
    /(<\/text>)\r?\n(?:[ \t]*\r?\n)*/g,
    '$1\n\n',
  );

const addSectionSpacing = xml =>
  xml
    .replace(
      /([^\n])\r?\n(?:[ \t]*\r?\n)*(?=<section(?:[ \t>]))/g,
      '$1\n\n',
    )
    .replace(
      /(<\/section>)\r?\n(?:[ \t]*\r?\n)*/g,
      '$1\n\n',
    );

const splitAdjacentMetadataFields = xml =>
  xml.replace(adjacentMetadataFieldsPattern, '$1\n');

const splitAnalysisMetadata = xml => xml
  .replace(
    /(<(?:form|metre|rhyme|structure|syllables)(?:[ \t][^<>]*)?>)(?!\r?\n)/g,
    '$1\n',
  )
  .replace(/(<analysis\b[^<>]*\/>)(?!\r?\n)/g, '$1\n');

const nonumWrapperNames = [
  'nonum',
  'center',
  'right',
  'wrap',
  'small',
  'i',
  'w',
  'b',
  'sc',
  'span',
];
const nonumWrapperAlternation = nonumWrapperNames.join('|');

const normalizeLineWrappers = xml => xml.split(/\r?\n/).map(line => {
  const pageBreakPrefix = line.match(/^(?:<pb\b[^>]*\/>)+/)?.[0] ?? '';
  let content = line.slice(pageBreakPrefix.length);
  const wrappers = [];
  const openingPattern = new RegExp(
    `^<(${nonumWrapperAlternation})(?:[ \\t][^<>]*)?>`,
  );

  while (true) {
    const opening = content.match(openingPattern);
    if (opening == null) {
      break;
    }
    const closingMarkup = `</${opening[1]}>`;
    if (content.endsWith(closingMarkup) !== true) {
      break;
    }
    wrappers.push({ markup: opening[0], name: opening[1] });
    content = content.slice(opening[0].length, -closingMarkup.length);
  }

  if (wrappers.length === 0) {
    return line;
  }

  const lineMarkers = wrappers.filter(wrapper => wrapper.name === 'nonum');
  const alignments = wrappers.filter(
    wrapper => wrapper.name === 'center' || wrapper.name === 'right',
  );
  const wraps = wrappers.filter(wrapper => wrapper.name === 'wrap');
  const appearances = wrappers.filter(
    wrapper =>
      wrapper.name !== 'nonum' &&
      wrapper.name !== 'center' &&
      wrapper.name !== 'right' &&
      wrapper.name !== 'wrap',
  );
  const canonicalWrappers = [
    ...lineMarkers,
    ...alignments,
    ...wraps,
    ...appearances,
  ];
  const canonicalOpening = canonicalWrappers
    .map(wrapper => wrapper.markup)
    .join('');
  const canonicalClosing = canonicalWrappers
    .toReversed()
    .map(wrapper => `</${wrapper.name}>`)
    .join('');

  return `${pageBreakPrefix}${canonicalOpening}${content}${canonicalClosing}`;
}).join('\n');

const splitPoetryLines = xml =>
  normalizeLineWrappers(xml)
    .replace(/(<poetry(?:[ \t][^<>]*)?>)(?!\r?\n)/g, '$1\n')
    .replace(/<\/nonum>(?!\r?\n)/g, '</nonum>\n');

const indentMetadata = xml => {
  let metadataDepth = 0;
  let withinMetadata = false;

  return xml.split('\n').map(line => {
    const content = line.trimStart();

    if (/^<(?:head|workhead)(?:[ \t>])/.test(content)) {
      metadataDepth = 0;
      withinMetadata = true;
      return line;
    }
    if (/^<\/(?:head|workhead)>/.test(content)) {
      metadataDepth = 0;
      withinMetadata = false;
      return line;
    }
    if (withinMetadata !== true || content.length === 0) {
      return line;
    }

    const closingTag = content.match(/^<\/([A-Za-z][A-Za-z0-9-]*)>/);
    if (closingTag != null) {
      metadataDepth = Math.max(0, metadataDepth - 1);
    }

    const formatted = `${'  '.repeat(metadataDepth + 1)}${content}`;
    const openingTag = content.match(/^<([A-Za-z][A-Za-z0-9-]*)(?:[ \t>])/);
    if (
      closingTag == null &&
      openingTag != null &&
      content.endsWith('/>') !== true &&
      content.includes(`</${openingTag[1]}>`) !== true
    ) {
      metadataDepth += 1;
    }

    return formatted;
  }).join('\n');
};

export const formatWorkXml = xml => {
  const withoutStructuralIndentation = xml.replace(structuralTagPattern, '');
  const withSplitMetadata = splitAdjacentMetadataFields(
    withoutStructuralIndentation,
  );
  const withPoetryLines = splitPoetryLines(splitAnalysisMetadata(withSplitMetadata));
  const withMetadataIndentation = indentMetadata(withPoetryLines);
  return addSectionSpacing(addTextSpacing(withMetadataIndentation))
    .trimEnd() + '\n';
};

const isMainModule = process.argv[1] != null &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  process.argv.slice(2).forEach(filename => {
    const xml = fs.readFileSync(filename, 'utf8');
    fs.writeFileSync(filename, formatWorkXml(xml));
  });
}
