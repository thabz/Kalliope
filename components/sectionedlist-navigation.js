const normalizeSearchText = (text) => text.normalize('NFC').toLowerCase();

export const listenForListNavigation = (
  target,
  sections,
  headings,
  itemElements
) => {
  const searchableItems = sections.flatMap((section) =>
    section.items
      .filter((item) => typeof item.searchText === 'string')
      .map((item) => ({ item, text: normalizeSearchText(item.searchText) }))
  );
  let prefix = '';
  let lastKeyTime = 0;

  const reset = () => {
    prefix = '';
    lastKeyTime = 0;
  };

  const onKeyDown = (event) => {
    if (
      event.defaultPrevented === true ||
      event.isComposing === true ||
      event.repeat === true ||
      event.altKey === true ||
      event.ctrlKey === true ||
      event.metaKey === true ||
      event.target?.isContentEditable === true ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName)
    ) {
      return;
    }

    if (event.key === 'Escape') {
      reset();
      return;
    }
    if (event.key.length !== 1) return;

    const now = Date.now();
    if (now - lastKeyTime > 1000) reset();
    if (prefix.length === 0 && event.key === ' ') return;

    const isFirstKey = prefix.length === 0;
    prefix += event.key;
    lastKeyTime = now;
    const normalizedPrefix = normalizeSearchText(prefix);

    // Keep the single-letter heading jump; subsequent keys refine the search.
    const match = isFirstKey
      ? headings.get(event.key.toUpperCase())
      : itemElements.get(
          searchableItems.find(({ text }) =>
            text.startsWith(normalizedPrefix)
          )?.item
        );
    if (match != null) match.scrollIntoView();
    event.preventDefault();
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('blur', reset);
  return () => {
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('blur', reset);
    reset();
  };
};
