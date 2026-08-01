const sourceId = sourceNode => sourceNode.getAttribute('in') ?? 'default';

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
  pageOnlySourceError,
};
