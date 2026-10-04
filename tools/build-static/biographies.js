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

export const buildBiographies = (bio, collected) => {
  const biographies = getChildByTagName(bio, 'biographies');
  return (getChildrenByTagName(biographies, 'biography') ?? [])
    .filter(biography => safeGetAttr(biography, 'hidden') !== 'true')
    .map(biography => {
      const head = getChildByTagName(biography, 'head');
      const body = getChildByTagName(biography, 'body');
      return {
        content_html: htmlToXml(safeGetInnerXML(body), collected),
        content_lang: safeGetAttr(body, 'lang') ?? 'da',
        sources: buildSources(head, collected),
      };
    });
};
