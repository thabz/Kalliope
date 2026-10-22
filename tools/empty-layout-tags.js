import { parseWorkXml } from './work-validation.js';

export const layoutTagsRequiringContent = new Set([
  'center', 'right', 'nonum', 'wrap', 'block-center', 'blockquote',
  'two-columns', 'column', 'i', 'b', 'u', 'o', 'sup', 'sub', 'strike',
  'quote', 'span', 's', 'small', 'w', 'sc', 'colored', 'metrik', 'biblio',
]);

const visibleMarkers = new Set(['img', 'picture', 'asterism']);
const hasContent = node => {
  if (node.nodeType === 3 || node.nodeType === 4) {
    return (node.nodeValue ?? '').trim().length > 0;
  }
  if (node.nodeType !== 1) return false;
  if (visibleMarkers.has(node.nodeName) === true) return true;
  if (node.nodeName === 'pb' || node.nodeName === 'br') return false;
  return Array.from(node.childNodes).some(hasContent);
};

export const findEmptyLayoutTags = (content, filename = '') => {
  const document = parseWorkXml(content);
  return Array.from(document.getElementsByTagName('*'))
    .filter(node => layoutTagsRequiringContent.has(node.nodeName) === true && hasContent(node) === false)
    .map(node => ({ filename, line: node.lineNumber, tag: node.nodeName }));
};
