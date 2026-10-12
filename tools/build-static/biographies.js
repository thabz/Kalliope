import { htmlToXml } from '../libs/helpers.js';
import {
  getChildByTagName,
  getChildrenByTagName,
  getIdentifiers,
  identifierAllowlist,
  safeGetAttr,
  safeGetInnerXML,
  safeGetInnerXMLWithout,
} from './xml.js';

const buildSources = (head, collected) =>
  (getChildrenByTagName(head, 'source') ?? []).map(source => ({
    content_html: htmlToXml(
      safeGetInnerXMLWithout(source, ['identifiers']),
      collected
    ),
    href: safeGetAttr(source, 'href'),
    identifiers: getIdentifiers(source, identifierAllowlist.source),
  }));

const trimBlankLines = lines => {
  if (lines == null) return lines;
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start][0].trim() === '') start += 1;
  while (end > start && lines[end - 1][0].trim() === '') end -= 1;
  return lines.slice(start, end);
};

export const buildBiographies = (bio, collected) => {
  const biographies = getChildByTagName(bio, 'biographies');
  return (getChildrenByTagName(biographies, 'biography') ?? [])
    .filter(biography => safeGetAttr(biography, 'hidden') !== 'true')
    .map(biography => {
      const head = getChildByTagName(biography, 'head');
      const body = getChildByTagName(biography, 'body');
      return {
        content_html: trimBlankLines(htmlToXml(safeGetInnerXML(body), collected)),
        content_lang: safeGetAttr(body, 'lang') ?? 'da',
        sources: buildSources(head, collected),
      };
    });
};
