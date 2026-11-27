// Preserve the first-date fields used by existing caches, retaining any repetitions.
const textDateEntries = (dates, types = ['written', 'performed', 'event']) => {
  const candidates = [
    ...types.map(type => ({ type, date: dates?.[type] })),
    ...(dates?.additional ?? []),
  ];
  const seen = new Set();
  return candidates.flatMap(({ type, date }) => {
    if (types.includes(type) === false || typeof date !== 'string' || date.trim().length === 0) return [];
    const value = date.trim();
    const key = `${type}:${value}`;
    if (seen.has(key) === true) return [];
    seen.add(key);
    return [{ type, date: value }];
  });
};

const addTextDates = (dates, text, textDates) => {
  for (const { type, date } of textDateEntries(textDates)) {
    const items = dates.get(date) ?? [];
    const { type: textType, ...textData } = text;
    items.push({ dateType: type, textType, ...textData });
    dates.set(date, items);
  }
};

export { textDateEntries, addTextDates };
