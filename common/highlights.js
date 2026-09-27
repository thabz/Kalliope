export const parseHighlightIntervals = highlight => {
  if (highlight == null) {
    return [];
  }

  const selectors = highlight.split(',').map(selector => selector.trim());
  const misplacedOpenRange = selectors.some(
    (selector, index) => /^\d+ff$/.test(selector) && index < selectors.length - 1,
  );
  if (misplacedOpenRange === true) {
    return [];
  }

  return selectors.flatMap(selector => {
    let match = selector.match(/^(\d+)-(\d+)$/);
    if (match != null) {
      return [{ from: parseInt(match[1]), to: parseInt(match[2]) }];
    }

    match = selector.match(/^(\d+)ff$/);
    if (match != null) {
      return [{ from: parseInt(match[1]), to: Number.MAX_VALUE }];
    }

    match = selector.match(/^(\d+)$/);
    if (match != null) {
      const line = parseInt(match[1]);
      return [{ from: line, to: line }];
    }

    return [];
  });
};
