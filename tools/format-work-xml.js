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
  'indextitle',
  'keywords',
  'linktitle',
  'nofirstline',
  'notes',
  'pagebreaks',
  'pictures',
  'quality',
  'source',
  'subtitle',
  'suptitle',
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
    /(<\/text>)\r?\n(?:[ \t]*\r?\n)*(?=<text(?:[ \t>]))/g,
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

const nonumWrapperNames = [
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
const wrappedNonumPattern = new RegExp(
  `((?:<(?:${nonumWrapperAlternation})(?:[ \\t][^<>]*)?>)+)` +
    `<nonum>([^\\r\\n]*?)<\\/nonum>` +
    `((?:<\\/(?:${nonumWrapperAlternation})>)+)`,
  'g',
);

const normalizeNonumWrappers = xml =>
  xml.replace(wrappedNonumPattern, (match, openingMarkup, content, closingMarkup) => {
    const openings = [...openingMarkup.matchAll(
      new RegExp(`<(${nonumWrapperAlternation})(?:[ \\t][^<>]*)?>`, 'g'),
    )].map(wrapper => ({ markup: wrapper[0], name: wrapper[1] }));
    const closings = [...closingMarkup.matchAll(
      new RegExp(`<\\/(${nonumWrapperAlternation})>`, 'g'),
    )].map(wrapper => wrapper[1]);

    if (
      openings.length !== closings.length ||
      openings.some((wrapper, index) =>
        wrapper.name !== closings[closings.length - index - 1]
      )
    ) {
      return match;
    }

    const alignments = openings.filter(
      wrapper => wrapper.name === 'center' || wrapper.name === 'right',
    );
    const appearances = openings.filter(
      wrapper => wrapper.name !== 'center' && wrapper.name !== 'right',
    );
    const canonicalWrappers = [...alignments, ...appearances];
    const canonicalOpening = canonicalWrappers.map(wrapper => wrapper.markup).join('');
    const canonicalClosing = canonicalWrappers
      .toReversed()
      .map(wrapper => `</${wrapper.name}>`)
      .join('');

    return `<nonum>${canonicalOpening}${content}${canonicalClosing}</nonum>`;
  });

const splitPoetryLines = xml =>
  normalizeNonumWrappers(xml)
    .replace(/(<poetry(?:[ \t][^<>]*)?>)(?!\r?\n)/g, '$1\n')
    .replace(/<\/nonum>(?!\r?\n)/g, '</nonum>\n');

export const poetryAlignmentConflicts = xml => {
  const conflicts = [];

  for (const poetry of xml.matchAll(/<poetry(?:[ \t][^<>]*)?>([\s\S]*?)<\/poetry>/g)) {
    poetry[1].split(/\r?\n/).forEach(line => {
      if (/<right(?:[ \t>])/.test(line) && /<center(?:[ \t>])/.test(line)) {
        conflicts.push(line);
      }
    });
  }

  return conflicts;
};

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
  const withPoetryLines = splitPoetryLines(withSplitMetadata);
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
