import { DOMParser } from '@xmldom/xmldom';

const dateStampPattern = /^(\d{4})(\d{2})(\d{2})$/;

export const isValidDateStamp = dateStamp => {
  const match = dateStamp.match(dateStampPattern);
  if (match == null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
};

export const copenhagenDateStamp = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Copenhagen',
    year: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

  return `${values.year}${values.month}${values.day}`;
};

export const normalizeDateStamp = value => {
  const dateStamp = value.replaceAll('-', '');
  if (isValidDateStamp(dateStamp) !== true) {
    throw new Error(`Ugyldig dato "${value}". Brug YYYY-MM-DD.`);
  }
  return dateStamp;
};

export const textIdError = ({ id, poetId }) => {
  if (poetId.length === 0) {
    return `Teksten ${id} har intet effektivt digter-id.`;
  }
  if (id.startsWith(poetId) !== true) {
    return `Tekst-id'et ${id} skal begynde med det effektive digter-id ${poetId}.`;
  }

  const suffix = id.slice(poetId.length);
  const match = suffix.match(/^(\d{8})(\d{2,})$/);
  if (match == null) {
    return `Tekst-id'et ${id} skal bestå af digter-id, YYYYMMDD og et løbenummer på mindst to cifre.`;
  }
  if (isValidDateStamp(match[1]) !== true) {
    return `Tekst-id'et ${id} indeholder den ugyldige dato ${match[1]}.`;
  }
  if (Number(match[2]) < 1) {
    return `Tekst-id'et ${id} skal have et positivt løbenummer.`;
  }

  return null;
};

export const textIdParts = ({ id, poetId }) => {
  if (textIdError({ id, poetId }) != null) {
    return null;
  }

  const suffix = id.slice(poetId.length);
  const match = suffix.match(/^(\d{8})(\d{2,})$/);
  return {
    dateStamp: match[1],
    sequence: Number(match[2]),
  };
};

export const nextTextId = ({ poetId, dateStamp, existingIds }) => {
  if (poetId.length === 0) {
    throw new Error('Digter-id må ikke være tomt.');
  }
  if (isValidDateStamp(dateStamp) !== true) {
    throw new Error(`Ugyldigt datostempel "${dateStamp}".`);
  }

  const prefix = `${poetId}${dateStamp}`;
  const sequenceNumbers = existingIds
    .filter(id => id.startsWith(prefix) === true)
    .map(id => id.slice(prefix.length))
    .filter(sequence => /^\d{2,}$/.test(sequence) === true)
    .map(Number)
    .filter(sequence => sequence >= 1);
  const nextSequence = sequenceNumbers.length === 0
    ? 1
    : Math.max(...sequenceNumbers) + 1;

  return `${prefix}${String(nextSequence).padStart(2, '0')}`;
};

export const parseWorkTextIds = (xml, filename = '(ukendt fil)') => {
  if (/<kalliopework\b/.test(xml) !== true) {
    return { author: null, texts: [] };
  }

  const document = new DOMParser().parseFromString(xml, 'text/xml');
  const work = document.documentElement;
  if (work == null || work.nodeName !== 'kalliopework') {
    return { author: null, texts: [] };
  }

  const workAuthor = work.getAttribute('author') ?? '';
  const texts = Array.from(work.getElementsByTagName('text'))
    .map(text => {
      const id = text.getAttribute('id') ?? '';
      const textAuthor = text.getAttribute('author');
      const poetId = textAuthor != null && textAuthor.length > 0
        ? textAuthor
        : workAuthor;

      return { filename, id, poetId };
    })
    .filter(text => text.id.length > 0);

  return { author: workAuthor.length > 0 ? workAuthor : null, texts };
};
