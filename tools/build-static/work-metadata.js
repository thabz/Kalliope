import {
  getChildByTagName,
  getChildrenByTagName,
  getIdentifiers,
  identifierAllowlist,
  safeGetAttr,
} from './xml.js';
import { collectSourceDigitalUrl, resolveSourceReference } from './source.js';

// Resolve source metadata before parent links and output rendering. This also
// keeps cached sibling works complete when only one work in a directory changes.
export const buildWorkSourceMetadata = (work, poets, filename) => {
  const head = getChildByTagName(work, 'workhead');
  const identifiers = getIdentifiers(head, identifierAllowlist.workhead);
  const sources = {};
  getChildrenByTagName(head, 'source').forEach((sourceNode) => {
    let source = null;
    const sourceReference = resolveSourceReference({ sourceNode, poets });
    if (sourceReference.source != null) {
      source = {
        ...sourceReference,
        identifiers: getIdentifiers(sourceNode, identifierAllowlist.source),
      };
    }
    if (source == null || source.source == null) {
      throw new Error(
        `${filename} has source with no title.`
      );
    }
    source.digitalUrl = collectSourceDigitalUrl(sourceNode);
    const sourceId = safeGetAttr(sourceNode, 'id') ?? 'default';
    let facsimile = safeGetAttr(sourceNode, 'facsimile');
    if (facsimile != null) {
      facsimile = facsimile.replace(/.pdf$/, '');
      let facsimilePagesOffset = safeGetAttr(
        sourceNode,
        'facsimile-pages-offset'
      );
      if (facsimilePagesOffset != null) {
        facsimilePagesOffset = parseInt(facsimilePagesOffset, 10);
      }

      const facsimilePageCount = safeGetAttr(
        sourceNode,
        'facsimile-pages-num'
      );
      if (facsimilePageCount == null) {
        throw new Error(
          `${filename} is missing facsimile-pages-num in source.`
        );
      }
      source = {
        ...source,
        facsimile,
        facsimilePageCount: parseInt(facsimilePageCount, 10),
        facsimilePagesOffset,
      };
    }
    sources[sourceId] = source;
  });
  return { identifiers, sources };
};
