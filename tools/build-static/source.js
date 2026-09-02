import { getChildByTagName, safeGetAttr } from './xml.js';

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
