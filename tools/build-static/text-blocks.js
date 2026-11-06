import { htmlToXml } from '../libs/helpers.js';
import { getChildren, safeGetAttr, safeGetInnerXML } from './xml.js';

// Front matter is kept as one XML fragment: splitting it into source lines
// would duplicate cast groups and detach their shared descriptions.
export const buildTextBlocks = (text, collected, context = {}) => {
  const blocks = (getChildren(text) ?? []).flatMap(node => {
    if (node.nodeName === 'front') return [node];
    if (node.nodeName === 'body') {
      return (getChildren(node) ?? []).filter(block =>
        ['poetry', 'prose', 'epigraph', 'castList'].includes(block.nodeName));
    }
    return [];
  });
  return blocks.map(block => {
    const type = block.nodeName;
    const rawBlock = type === 'castList' ? block.toString() : safeGetInnerXML(block);
    return {
      type,
      lines: htmlToXml(rawBlock,
        collected, type === 'poetry', { ...context, blockType: type }),
      options: {
        fontSize: safeGetAttr(block, 'font-size'),
        maxWidth: safeGetAttr(block, 'max-width'),
      },
    };
  });
};
