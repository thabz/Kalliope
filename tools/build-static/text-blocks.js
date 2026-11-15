import { htmlToXml } from '../libs/helpers.js';
import { getChildren, getChildByTagName, safeGetAttr, safeGetInnerXML } from './xml.js';

// Front matter is kept as one XML fragment: splitting it into source lines
// would duplicate cast groups and detach their shared descriptions.
export const buildTextBlocks = (text, collected, context = {}) => {
  const blocks = (getChildren(text) ?? []).flatMap(node => {
    if (node.nodeName === 'front') return [node];
    if (node.nodeName === 'body') {
      return (getChildren(node) ?? []).filter(block =>
        ['poetry', 'prose', 'epigraph', 'castList', 'text', 'pb'].includes(block.nodeName));
    }
    return [];
  });
  let pageBreakPrefix = '';
  const withPageBreaks = xml => {
    const prefix = pageBreakPrefix;
    pageBreakPrefix = '';
    const leadingLines = /^(?:[ \t]*\r?\n|[ \t]*<!--[\s\S]*?-->[ \t]*(?:\r?\n|$))*/u;
    return xml.replace(leadingLines, leading => {
      if (prefix !== '' && xml.slice(leading.length).trim().length === 0) {
        throw new Error('A body page break must precede content.');
      }
      return leading + prefix;
    });
  };
  const result = blocks.flatMap(block => {
    if (block.nodeName === 'pb') {
      pageBreakPrefix += block.toString();
      return [];
    }
    if (block.nodeName === 'text') {
      const id = safeGetAttr(block, 'id');
      const poetry = getChildByTagName(getChildByTagName(block, 'body'), 'poetry');
      return [{
        type: 'poetry',
        anchor: id,
        lines: htmlToXml(withPageBreaks(contextPoetry(safeGetInnerXML(poetry), block)),
          collected, true, { ...context, textId: id, blockType: 'poetry' }),
        options: {
          fontSize: safeGetAttr(block, 'context-font-size') ?? safeGetAttr(poetry, 'font-size'),
          maxWidth: null,
        },
      }];
    }
    const type = block.nodeName;
    const rawBlock = type === 'castList' ? block.toString() : safeGetInnerXML(block);
    return {
      type,
      lines: htmlToXml(withPageBreaks(rawBlock),
        collected, type === 'poetry', { ...context, blockType: type }),
      options: {
        fontSize: safeGetAttr(block, 'font-size'),
        maxWidth: safeGetAttr(block, 'max-width'),
      },
    };
  });
  if (pageBreakPrefix !== '') {
    throw new Error('A body page break must precede a content block.');
  }
  return result;
};

// Presentation belonging to the surrounding drama never changes the shared verse.
export const contextPoetry = (xml, text) => {
  let lines = xml.replace(/^\n|\n$/g, '').split('\n');
  if (safeGetAttr(text, 'context-quotes') === 'stanzas') {
    lines = lines.map((line, index) => {
      if (line.trim().length === 0) return line;
      const first = index === 0 || lines[index - 1].trim().length === 0;
      const last = index === lines.length - 1 || lines[index + 1].trim().length === 0;
      return `${first === true ? '»' : ''}${line}${last === true ? '«' : ''}`;
    });
  }
  const indent = ' '.repeat(Number(safeGetAttr(text, 'context-indent') ?? 0));
  return lines.map(line => line.trim().length > 0 ? indent + line : line).join('\n');
};
