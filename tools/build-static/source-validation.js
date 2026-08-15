const sourceId = sourceNode => sourceNode.getAttribute('in') ?? 'default';

const parsePageNumber = value => {
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  if (!/^[ivxlcdm]+$/i.test(value)) {
    return null;
  }

  const values = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
  const characters = value.toLowerCase().split('');
  return characters.reduce((total, character, index) => {
    const current = values[character];
    const next = values[characters[index + 1]] ?? 0;
    return total + (current < next ? -current : current);
  }, 0);
};

const parsePageInterval = value => {
  if (value == null || value.trim() === '') {
    return null;
  }
  const labels = value.trim().split(/\s*[-–]\s*/);
  if (labels.length > 2) {
    return null;
  }
  const from = parsePageNumber(labels[0]);
  const to = parsePageNumber(labels[1] ?? labels[0]);
  if (from == null || to == null || to < from) {
    return null;
  }
  return { from, to };
};

const pageIntervalError = ({ filename, textId, textSource }) => {
  const pages = textSource.getAttribute('pages');
  if (pages == null || parsePageInterval(pages) != null) {
    return null;
  }
  return `${filename} ${textId} has an invalid source pages interval: ${pages}.`;
};

const isPageOnlySource = sourceNode =>
  sourceNode.getAttribute('pages') != null &&
  sourceNode.textContent.trim() === '';

const hasWorkheadSource = (workhead, textSource) => {
  const wantedId = sourceId(textSource);
  return Array.from(workhead.childNodes).some(
    child =>
      child.nodeType === 1 &&
      child.nodeName === 'source' &&
      (child.getAttribute('id') ?? 'default') === wantedId,
  );
};

const hasSourceForText = ({ workhead, workSources, textSource }) => {
  if (workhead != null) {
    return hasWorkheadSource(workhead, textSource);
  }
  const source = workSources?.[sourceId(textSource)];
  return source != null;
};

const pageOnlySourceError = ({
  filename,
  textId,
  textSource,
  workhead,
  workSources,
}) => {
  if (
    !isPageOnlySource(textSource) ||
    hasSourceForText({ workhead, workSources, textSource })
  ) {
    return null;
  }

  return `${filename} ${textId} has a page-only source but no matching source in <workhead>.`;
};

export {
  hasSourceForText,
  hasWorkheadSource,
  isPageOnlySource,
  pageIntervalError,
  pageOnlySourceError,
  parsePageInterval,
};
