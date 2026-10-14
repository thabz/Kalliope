import { DOMParser } from '@xmldom/xmldom';

export const removeSourcePoetLinks = (reference, poetId) => {
  if (poetId == null) {
    return reference;
  }
  const root = new DOMParser().parseFromString(`<source>${reference}</source>`, 'text/xml').documentElement;
  const links = Array.from(root.getElementsByTagName('a'));
  for (const link of links) {
    if (link.getAttribute('poet') !== poetId && link.getAttribute('person') !== poetId) {
      continue;
    }
    while (link.firstChild != null) {
      link.parentNode.insertBefore(link.firstChild, link);
    }
    link.parentNode.removeChild(link);
  }
  return Array.from(root.childNodes, node => node.toString()).join('');
};

export const appendSourcePages = (reference, pages) => {
  if (pages == null || pages.trim().length === 0) {
    return reference;
  }
  const pageRange = pages.trim().replace(/\s*[-–]\s*/g, '–');
  const prefix = reference.trim().replace(/\.$/, '');
  return `${prefix.length === 0 ? '' : `${prefix}, `}s. ${pageRange}.`;
};
