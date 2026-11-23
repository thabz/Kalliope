import { appendSourcePages, removeBibliographyLinks } from '../../common/source-reference.js';
import { poetName, workLinkName } from './formatting.js';
import { escapeXml, formatSourceBibliography, resolveSourceReference } from './source.js';
import { sourceWorkKey } from './work-cache.js';
import { safeGetAttr } from './xml.js';

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
      volumeLabel: 'bd.',
    });
  } else if (source.source != null && source.source.trim().length > 0) {
    reference = source.source;
  } else {
    const publicationHasAuthor = collected.poets.get(work.poet_id ?? meta.poetId)?.type !== 'collection';
    const bibliography = {
      title: work.linktitle ?? work.title,
      ...(work.year == null ? {} : { year: work.year }),
      ...(publicationHasAuthor && !['anthology', 'periodical', 'newspaper'].includes(work.type)
        ? { authors: [{ name: poet, id: meta.poetId }] } : {}),
    };
    reference = formatSourceBibliography(bibliography, collected.poets);
  }
  reference = appendSourcePages(removeBibliographyLinks(reference), source.pages == null ? null : escapeXml(source.pages));
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
