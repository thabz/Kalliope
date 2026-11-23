import { filterTextElements } from './libs/text-ranges.js';

const normalizeMinDate = value => {
  if (value == null) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Ugyldig --min-date: ${value}. Brug formatet YYYY-MM-DD.`);
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Ugyldig --min-date: ${value}.`);
  }

  return value.replaceAll('-', '');
};

const dateFromTextId = textId => {
  const match = textId.match(/(\d{4})(\d{2})(\d{2})/);
  return match == null ? null : `${match[1]}${match[2]}${match[3]}`;
};

const textIdMatchesMinDate = (textId, minDate) => {
  if (minDate == null) {
    return true;
  }

  const textDate = dateFromTextId(textId);
  return textDate != null && textDate >= minDate;
};

const hasPdfFacsimile = data =>
  /<source\b[^>]*\bfacsimile="[^"]*\.pdf(?:"|\s)/iu.test(data);

const filterTextDataByMinDate = (data, minDate) => {
  if (minDate == null) return data;
  return filterTextElements(data, openingTag => {
    const textId = openingTag.match(/\sid="([^"]+)"/)?.[1] ?? '';
    return textIdMatchesMinDate(textId, minDate);
  });
};

export {
  dateFromTextId,
  filterTextDataByMinDate,
  hasPdfFacsimile,
  normalizeMinDate,
  textIdMatchesMinDate,
};
