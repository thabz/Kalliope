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
  'proofreadings',
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

const textHeadMetadataOrder = [
  'suptitle',
  'title',
  'subtitle',
  'toctitle',
  'indextitle',
  'linktitle',
  'breadcrumbtitle',
  'firstline',
  'nofirstline',
  'year',
  'dates',
  'written',
  'performed',
  'event',
  'begivenhed',
  'notes',
  'pictures',
  'source',
  'keywords',
  'form',
  'metre',
  'rhyme',
  'structure',
  'syllables',
  'quality',
];

const textHeadMetadataRanks = new Map(
  textHeadMetadataOrder.map((name, index) => [name, index]),
);

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

const splitProofreadings = xml => xml
  .replace(/(<proofreadings>)(?!\r?\n)/g, '$1\n')
  .replace(/(<proofreading\b[^<>]*\/>)(?!\r?\n)/g, '$1\n');

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
    .replace(/<\/nonum>(?!<resetnum\/>)(?!\r?\n)/g, '</nonum>\n');

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
    const selfClosingWithOptionalComment =
      /\/>[ \t]*(?:<!--.*-->)?[ \t]*$/.test(content);
    if (
      closingTag == null &&
      openingTag != null &&
      selfClosingWithOptionalComment !== true &&
      content.includes(`</${openingTag[1]}>`) !== true
    ) {
      metadataDepth += 1;
    }

    return formatted;
  }).join('\n');
};

const tagEnd = (xml, start) => {
  let quote = null;

  for (let index = start + 1; index < xml.length; index += 1) {
    const character = xml[index];
    if (quote != null) {
      if (character === quote) {
        quote = null;
      }
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index + 1;
    }
  }

  return xml.length;
};

const directChildElements = xml => {
  const elements = [];
  let depth = 0;
  let current = null;
  let index = 0;

  while (index < xml.length) {
    const opening = xml.indexOf('<', index);
    if (opening === -1) {
      break;
    }
    if (xml.startsWith('<!--', opening)) {
      const closing = xml.indexOf('-->', opening + 4);
      index = closing === -1 ? xml.length : closing + 3;
      continue;
    }
    if (xml.startsWith('<![CDATA[', opening)) {
      const closing = xml.indexOf(']]>', opening + 9);
      index = closing === -1 ? xml.length : closing + 3;
      continue;
    }
    if (xml.startsWith('<?', opening)) {
      const closing = xml.indexOf('?>', opening + 2);
      index = closing === -1 ? xml.length : closing + 2;
      continue;
    }
    if (xml.startsWith('<!', opening)) {
      index = tagEnd(xml, opening);
      continue;
    }

    const closingTag = xml.startsWith('</', opening);
    const end = tagEnd(xml, opening);
    const markup = xml.slice(opening, end);
    if (closingTag === true) {
      depth = Math.max(0, depth - 1);
      if (depth === 0 && current != null) {
        elements.push({ ...current, end });
        current = null;
      }
    } else {
      const name = markup.match(/^<([A-Za-z][A-Za-z0-9-]*)/)?.[1];
      const selfClosing = /\/\s*>$/.test(markup);
      if (depth === 0 && name != null) {
        current = { name, start: opening };
        if (selfClosing === true) {
          elements.push({ ...current, end });
          current = null;
        }
      }
      if (selfClosing !== true) {
        depth += 1;
      }
    }
    index = end;
  }

  return elements;
};

const commentlessText = xml => xml.replace(/<!--[\s\S]*?-->/g, '');

const splitInterElementContent = xml => {
  const firstComment = xml.indexOf('<!--');
  if (
    firstComment !== -1 &&
    xml.slice(0, firstComment).includes('\n') !== true
  ) {
    const commentEnd = xml.indexOf('-->', firstComment + 4);
    if (commentEnd !== -1) {
      return {
        previous: xml.slice(0, commentEnd + 3),
        next: xml.slice(commentEnd + 3),
      };
    }
  }

  const withoutComments = commentlessText(xml);
  if (withoutComments.trim().length === 0) {
    return { previous: '', next: xml };
  }

  let splitAt = xml.length;
  while (/\s/.test(xml[splitAt - 1] ?? '')) {
    splitAt -= 1;
  }
  return {
    previous: xml.slice(0, splitAt),
    next: xml.slice(splitAt),
  };
};

const sortTextHeadContent = xml => {
  const elements = directChildElements(xml);
  if (elements.length < 2) {
    return xml;
  }

  const units = elements.map(element => ({
    name: element.name,
    prefix: '',
    content: xml.slice(element.start, element.end),
    suffix: '',
  }));
  units[0].prefix = xml.slice(0, elements[0].start);

  for (let index = 1; index < elements.length; index += 1) {
    const between = xml.slice(elements[index - 1].end, elements[index].start);
    const split = splitInterElementContent(between);
    units[index - 1].suffix = split.previous;
    units[index].prefix = split.next;
  }

  const trailingSplit = splitInterElementContent(
    xml.slice(elements.at(-1).end),
  );
  units.at(-1).suffix += trailingSplit.previous;
  const trailing = trailingSplit.next;
  const qualityRank = textHeadMetadataRanks.get('quality');
  const sorted = units.toSorted((left, right) => {
    const leftRank = textHeadMetadataRanks.get(left.name) ?? qualityRank - 1;
    const rightRank = textHeadMetadataRanks.get(right.name) ?? qualityRank - 1;
    return leftRank - rightRank;
  });

  return sorted
    .map(unit => `${unit.prefix}${unit.content}${unit.suffix}`)
    .join('') + trailing;
};

const sortTextHeadMetadata = xml => xml.replace(
  /(<text\b[^>]*>\r?\n<head(?:[ \t][^>]*)?>)([\s\S]*?)(<\/head>)/g,
  (_match, opening, content, closing) =>
    `${opening}${sortTextHeadContent(content)}${closing}`,
);

export const formatWorkXml = xml => {
  const withoutStructuralIndentation = xml.replace(structuralTagPattern, '');
  const withSplitMetadata = splitAdjacentMetadataFields(
    withoutStructuralIndentation,
  );
  const withPoetryLines = splitPoetryLines(
    splitProofreadings(splitAnalysisMetadata(withSplitMetadata)),
  );
  const withMetadataIndentation = indentMetadata(withPoetryLines);
  const withSortedTextHeadMetadata = sortTextHeadMetadata(
    withMetadataIndentation,
  );
  return addSectionSpacing(addTextSpacing(withSortedTextHeadMetadata))
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
