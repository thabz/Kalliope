import {
  getChildByTagName,
  getChildren,
  safeGetAttr,
  safeGetInnerXMLWithout,
} from './xml.js';

const kbDigitalPermalink = (recordId) =>
  `https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma${encodeURIComponent(recordId)}`;

const normalizeUrl = (url) => (url == null ? null : url.trim());

const isRexUrl = (url) => {
  if (url == null || url.length === 0) {
    return false;
  }
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname.includes('rexlibris.kb.dk') ||
      parsedUrl.pathname.includes('/search/eng') ||
      parsedUrl.pathname.includes('/work/')
    );
  } catch {
    return /rexlibris\.kb\.dk/i.test(url);
  }
};

const isDirectPdfUrl = (url) => {
  if (url == null || url.length === 0) {
    return false;
  }
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.toLowerCase().endsWith('.pdf');
  } catch {
    return /\.pdf(?:[?#]|$)/i.test(url);
  }
};

const scoreDigitalUrl = (url) => {
  if (isRexUrl(url)) {
    return 3;
  }
  if (isDirectPdfUrl(url)) {
    return 1;
  }
  return 2;
};

const preferPreferredDigitalUrl = (urls) => {
  if (!Array.isArray(urls)) {
    const normalizedUrl = normalizeUrl(urls);
    return normalizedUrl == null || normalizedUrl.length === 0 ? null : normalizedUrl;
  }
  let digitalUrl = null;
  let bestScore = -1;
  for (const candidate of urls) {
    const candidateUrl = normalizeUrl(candidate);
    if (candidateUrl == null || candidateUrl.length === 0) {
      continue;
    }
    const score = scoreDigitalUrl(candidateUrl);
    if (score > bestScore) {
      digitalUrl = candidateUrl;
      bestScore = score;
    }
  }
  return digitalUrl;
};

const getKbAlmaIdentifier = (sourceNode) => {
  const identifiersNode = getChildByTagName(sourceNode, 'identifiers');
  const kbAlmaNode = getChildByTagName(identifiersNode, 'kb-alma');
  const recordId = kbAlmaNode?.textContent?.trim();
  return recordId == null || recordId.length === 0 ? null : recordId;
};

export const resolveSourceDigitalUrl = ({
  sourceNode,
  inheritedDigitalUrl,
}) => {
  const explicitDigitalUrl =
    sourceNode == null ? null : safeGetAttr(sourceNode, 'href');
  if (explicitDigitalUrl != null && explicitDigitalUrl.length > 0) {
    return explicitDigitalUrl.trim();
  }
  const kbAlma = getKbAlmaIdentifier(sourceNode);
  if (kbAlma != null) {
    return kbDigitalPermalink(kbAlma);
  }
  return preferPreferredDigitalUrl(inheritedDigitalUrl);
};

export const collectSourceDigitalUrl = (sourceNode) => {
  if (sourceNode == null) {
    return null;
  }
  const explicitDigitalUrl = normalizeUrl(safeGetAttr(sourceNode, 'href'));
  if (explicitDigitalUrl != null && explicitDigitalUrl.length > 0) {
    return explicitDigitalUrl;
  }
  const kbAlma = getKbAlmaIdentifier(sourceNode);
  return kbAlma == null ? null : kbDigitalPermalink(kbAlma);
};

export const resolveSourceDigitalUrlForText = ({
  sourceNode,
  sourceForText,
}) => {
  const inheritedDigitalUrl =
    sourceForText == null ? null : sourceForText.digitalUrl;
  return resolveSourceDigitalUrl({
    sourceNode,
    inheritedDigitalUrl,
  });
};

export const resolveSourceFacsimileForText = ({
  sourceNode,
  sourceForText,
}) => {
  let facsimile =
    safeGetAttr(sourceNode, 'facsimile') ?? sourceForText?.facsimile ?? null;
  if (facsimile != null) {
    facsimile = facsimile.replace(/\.pdf$/, '');
  }
  const pageCount = safeGetAttr(sourceNode, 'facsimile-pages-num');
  const pagesOffset = safeGetAttr(sourceNode, 'facsimile-pages-offset');
  return {
    facsimile,
    facsimilePageCount:
      pageCount == null
        ? (sourceForText?.facsimilePageCount ?? null)
        : parseInt(pageCount, 10),
    facsimilePagesOffset:
      pagesOffset == null
        ? (sourceForText?.facsimilePagesOffset ?? null)
        : parseInt(pagesOffset, 10),
  };
};

const personRoles = { author: 'authors', editor: 'editors', translator: 'translators' };
const bibliographyFields = ['title', 'edition', 'volume', 'place', 'publisher', 'printer', 'year'];
const escapeXml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const parseSourceBibliography = sourceNode => {
  const children = getChildren(sourceNode) ?? [];
  const bibliographicChildren = children.filter(child =>
    Object.hasOwn(personRoles, child.tagName) || bibliographyFields.includes(child.tagName)
  );
  if (bibliographicChildren.length === 0) {
    return null;
  }
  const bibliography = {};
  for (const child of children) {
    if (child.tagName === 'identifiers') {
      continue;
    }
    const value = child.textContent.trim();
    if (value.length === 0 || (getChildren(child) ?? []).length > 0) {
      throw new Error(`Bibliografisk kildefelt <${child.tagName}> skal indeholde ikke-tom tekst.`);
    }
    if (Object.hasOwn(personRoles, child.tagName)) {
      const role = personRoles[child.tagName];
      const id = safeGetAttr(child, 'id');
      const type = safeGetAttr(child, 'type');
      if (type != null && (child.tagName !== 'editor' || type !== 'editor')) {
        throw new Error(`Ugyldig bibliografisk persontype: ${type}.`);
      }
      bibliography[role] ??= [];
      bibliography[role].push({
        name: value,
        ...(id == null ? {} : { id }),
        ...(type == null ? {} : { type }),
      });
    } else if (bibliographyFields.includes(child.tagName)) {
      if (bibliography[child.tagName] != null) {
        throw new Error(`Gentaget bibliografisk kildefelt <${child.tagName}>.`);
      }
      bibliography[child.tagName] = value;
    } else {
      throw new Error(`Ukendt bibliografisk kildefelt <${child.tagName}>.`);
    }
  }
  const hasFreeText = Array.from(sourceNode.childNodes).some(child =>
    (child.nodeType === 3 || child.nodeType === 4) && child.textContent.trim().length > 0
  );
  if (hasFreeText || bibliography.title == null) {
    throw new Error('En struktureret kilde kræver en titel og må ikke indeholde fritekst.');
  }
  return bibliography;
};

// Return the same inline XML consumed by TextInline for legacy references.
export const formatSourceBibliography = (bibliography, poets = new Map()) => {
  const personName = person => {
    const name = escapeXml(person.name);
    return person.id != null && poets.has(person.id)
      ? `<a poet="${escapeXml(person.id)}">${name}</a>` : name;
  };
  const names = people => {
    const rendered = people.map(personName);
    return rendered.length < 2 ? rendered.join('')
      : `${rendered.slice(0, -1).join(', ')} og ${rendered.at(-1)}`;
  };
  const authors = bibliography.authors ?? [];
  const parts = [`${authors.length === 0 ? '' : `${names(authors)}: `}<i>${escapeXml(bibliography.title)}</i>`];
  const editorGroups = new Map();
  for (const editor of bibliography.editors ?? []) {
    const label = editor.type === 'editor' ? 'red. af' : 'udg. af';
    if (!editorGroups.has(label)) {
      editorGroups.set(label, []);
    }
    editorGroups.get(label).push(editor);
  }
  for (const [label, editors] of editorGroups) {
    parts.push(`${label} ${names(editors)}`);
  }
  const translators = bibliography.translators ?? [];
  if (translators.length > 0) {
    parts.push(`overs. af ${names(translators)}`);
  }
  if (bibliography.edition != null) parts.push(escapeXml(bibliography.edition));
  if (bibliography.volume != null) parts.push(`bind ${escapeXml(bibliography.volume)}`);
  const imprint = bibliography.publisher != null ? escapeXml(bibliography.publisher)
    : bibliography.printer == null ? null : `trykt hos ${escapeXml(bibliography.printer)}`;
  if (bibliography.place != null) {
    parts.push(`${escapeXml(bibliography.place)}${imprint == null ? '' : `: ${imprint}`}`);
  } else if (imprint != null) {
    parts.push(imprint);
  }
  if (bibliography.year != null) parts.push(escapeXml(bibliography.year));
  return `${parts.join(', ').replace(/\.$/, '')}.`;
};

export const resolveSourceReference = ({ sourceNode, inheritedSource, poets }) => {
  const bibliography = parseSourceBibliography(sourceNode);
  if (bibliography != null) {
    return { source: formatSourceBibliography(bibliography, poets), bibliography };
  }
  const legacyReference = safeGetInnerXMLWithout(sourceNode, ['identifiers'])?.trim();
  if (legacyReference != null && legacyReference.length > 0) {
    return { source: legacyReference };
  }
  return {
    source: inheritedSource?.source ?? null,
    ...(inheritedSource?.bibliography == null ? {} : { bibliography: inheritedSource.bibliography }),
  };
};
