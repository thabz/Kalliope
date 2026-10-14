import { appendSourcePages } from '../../common/source-reference.js';
import { poetName, workLinkName } from './formatting.js';
import { escapeXml, formatSourceBibliography, resolveSourceReference } from './source.js';
import { sourceWorkKey } from './work-cache.js';
import { getElementByTagName, getElementsByTagNames, parseXMLFragment, safeGetAttr, safeGetInnerXML } from './xml.js';

const linkLegacyTitle = (reference, workId) => {
  const doc = parseXMLFragment(`<source>${reference}</source>`);
  const title = getElementByTagName(doc.documentElement, 'i');
  if (title == null || getElementsByTagNames(title, ['a', 'xref']).length > 0) {
    return reference;
  }
  for (let parent = title.parentNode; parent != null; parent = parent.parentNode) {
    if (parent.tagName === 'a' || parent.tagName === 'xref') {
      return reference;
    }
  }
  const link = doc.createElement('a');
  link.setAttribute('work', workId);
  title.parentNode.insertBefore(link, title);
  link.appendChild(title);
  return safeGetInnerXML(doc.documentElement);
};

// Collect references before the output pass so editions do not depend on build order.
export const resolveEditionSource = ({ sourceNode, workSources, poets }) => ({
  ...resolveSourceReference({
    sourceNode,
    inheritedSource: workSources.get(safeGetAttr(sourceNode, 'in') ?? 'default'),
    poets,
  }),
  pages: safeGetAttr(sourceNode, 'pages'),
});

export const buildEditionReference = (meta, collected) => {
  const poet = poetName(collected.poets.get(meta.poetId));
  const workId = sourceWorkKey(meta);
  const work = collected.works.get(workId);
  const source = meta.editionSource ?? {};
  let reference;
  if (source.bibliography != null) {
    reference = formatSourceBibliography(source.bibliography, collected.poets, {
      workId, volumeLabel: 'bd.',
    });
  } else if (source.source != null && source.source.trim().length > 0) {
    // Keep free-form sources intact, linking their first italic title when safe.
    reference = linkLegacyTitle(source.source, workId);
  } else {
    const publicationHasAuthor = collected.poets.get(work.poet_id ?? meta.poetId)?.type !== 'collection';
    const bibliography = {
      title: work.linktitle ?? work.title,
      ...(work.year == null ? {} : { year: work.year }),
      ...(publicationHasAuthor && !['anthology', 'periodical', 'newspaper'].includes(work.type)
        ? { authors: [{ name: poet, id: meta.poetId }] } : {}),
    };
    reference = formatSourceBibliography(bibliography, collected.poets, { workId });
  }
  reference = appendSourcePages(reference, source.pages == null ? null : escapeXml(source.pages));
  reference = `${reference.trim().replace(/\.$/, '')}.`;
  return {
    id: meta.id,
    title: meta.title,
    poet,
    poetId: meta.poetId,
    work: workLinkName(work),
    citation: `<a poem="${escapeXml(meta.id)}">»${escapeXml(meta.title)}«</a>, i: ${reference}`,
  };
};
