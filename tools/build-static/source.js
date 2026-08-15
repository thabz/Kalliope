import { safeGetAttr } from './xml.js';

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

export const resolveSourceDigitalUrl = ({
  sourceNode,
  inheritedDigitalUrl,
}) => {
  const explicitDigitalUrl =
    sourceNode == null ? null : safeGetAttr(sourceNode, 'href');
  if (explicitDigitalUrl != null && explicitDigitalUrl.length > 0) {
    return explicitDigitalUrl.trim();
  }
  return preferPreferredDigitalUrl(inheritedDigitalUrl);
};

export const collectSourceDigitalUrl = (sourceNode) =>
  sourceNode == null ? null : normalizeUrl(safeGetAttr(sourceNode, 'href'));

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
