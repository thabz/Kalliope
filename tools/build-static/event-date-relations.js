const normalizedEventDate = textDates => {
  const eventDate = textDates?.event;
  if (typeof eventDate !== 'string') {
    return null;
  }
  const normalized = eventDate.trim();
  return normalized.length > 0 ? normalized : null;
};

const relatedEventEntries = ({
  textId,
  textDates,
  dates,
  resolveVariants,
}) => {
  const eventDate = normalizedEventDate(textDates);
  if (eventDate == null) {
    return [];
  }

  const variantIds = new Set(resolveVariants(textId) ?? [textId]);
  variantIds.add(textId);

  const result = [];
  const seen = new Set();
  const entries = dates.get(eventDate) ?? [];
  entries.forEach(entry => {
    if (entry.dateType !== 'event' || entry.hasPoetry !== true) {
      return;
    }
    const entryVariantIds = resolveVariants(entry.id) ?? [entry.id];
    const entryVariantKey = entryVariantIds[0] ?? entry.id;
    if (
      entryVariantIds.some(variantId => variantIds.has(variantId)) ||
      seen.has(entryVariantKey)
    ) {
      return;
    }
    seen.add(entryVariantKey);
    result.push(entry);
  });
  return result;
};

export { normalizedEventDate, relatedEventEntries };
