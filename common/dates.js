const defaultTranslate = (text, lang, vars = {}) => {
  return text.replace(/\{(.*?)\}/g, (match, key) => vars[key] ?? match);
};

const yearTranslations = {
  da: {
    bce: 'f.Kr.',
    ce: 'e.Kr.',
    circa: 'c.',
    unknownYear: 'Ukendt år',
    unknownLifetime: 'Ukendt levetid',
  },
  de: {
    bce: 'v. Chr.',
    ce: 'n. Chr.',
    circa: 'ca.',
    unknownYear: 'Unbekanntes Jahr',
    unknownLifetime: 'Unbekannte Lebenszeit',
  },
  en: {
    bce: 'BC',
    ce: 'AD',
    circa: 'c.',
    unknownYear: 'Unknown year',
    unknownLifetime: 'Unknown lifetime',
  },
  fr: {
    bce: 'av. J.-C.',
    ce: 'apr. J.-C.',
    circa: 'v.',
    unknownYear: 'Année inconnue',
    unknownLifetime: 'Durée de vie inconnue',
  },
};

const yearTranslation = (lang = 'da') => {
  return yearTranslations[lang] || yearTranslations.da;
};

const parseDate = (date) => {
  if (date == null) {
    return null;
  }
  let prefix = null,
    day = null,
    month = null,
    year = null;

  let m;
  if ((m = date.match(/ca/i))) {
    prefix = 'c.';
  }
  if ((m = date.match(/(-?\d{3,4})-(\d{2})-(\d{2})/))) {
    day = parseInt(m[3]);
    month = parseInt(m[2]);
    year = parseInt(m[1]);
  } else if ((m = date.match(/(-?\d{3,4})-(\d{2})/))) {
    month = parseInt(m[2]);
    year = parseInt(m[1]);
  } else if ((m = date.match(/(\d\d)-(\d\d)-(-?\d\d\d\d)/))) {
    day = parseInt(m[1]);
    month = parseInt(m[2]);
    year = parseInt(m[3]);
  } else if ((m = date.match(/(-?\d\d\d\d)/))) {
    year = parseInt(m[1]);
  }
  return { prefix, year, month, day };
};

const formattedDate = (date) => {
  if (date == null) {
    return null;
  }
  let { year, month, day, prefix } = parseDate(date);

  let result = null;

  if (year < 0) {
    year = formatYearEra(Math.abs(year), 'bce');
  }

  if (day != null && month != null && year != null) {
    result = `${day}/${month} ${year}`;
  } else if (year != null) {
    result = `${year}`;
  } else {
    return null;
  }
  return `${prefix ?? ''}${result}`;
};

const formatYearEra = (year, era, lang = 'da') => {
  const translations = yearTranslation(lang);
  if (era === 'bce') {
    return `${year} ${translations.bce}`;
  }
  if (era === 'ce') {
    return `${year} ${translations.ce}`;
  }
  return year;
};

const formatYearInterval = (startYear, endYear) => {
  if (startYear < 0 && endYear < 0) {
    return `${formatYearEra(
      Math.abs(startYear),
      'bce'
    )} - ${formatYearEra(Math.abs(endYear), 'bce')}`;
  }
  if (startYear === 0) {
    return `1 - ${endYear}`;
  }
  if (startYear < 0) {
    return `${formatYearEra(
      Math.abs(startYear),
      'bce'
    )} - ${formatYearEra(endYear, 'ce')}`;
  }
  return `${startYear} - ${endYear}`;
};

const formatTitleAndYear = (title, date, lang = 'da') => {
  const [year, numericYear, , bce] = extractYear(date, null, lang);
  if (numericYear == null) {
    return title;
  }
  return `${title} (${formatYearEra(year, bce ? 'bce' : null, lang)})`;
};

const extractYear = (date, unknownYear = 'Ukendt år', lang = 'da') => {
  let m = null,
    numericYear = null,
    prefix = null,
    bce = false;
  if (date == null || date === '?') {
    return [unknownYear, null, true];
  } else if ((m = date.match(/(-?\d\d\d\d)/))) {
    numericYear = parseInt(m[1]);
  }
  if ((m = date.match(/ca/i))) {
    prefix = yearTranslation(lang).circa + ' ';
  }
  if (numericYear == null) {
    return [unknownYear, null, true];
  }
  if (numericYear < 0) {
    bce = true;
    numericYear = -numericYear;
  }
  return [`${prefix ?? ''}${numericYear}`, numericYear, prefix != null, bce];
};

const formattedYear = (date, lang = 'da') => {
  const [formatted, x, y, bce] = extractYear(
    date,
    yearTranslation(lang).unknownYear,
    lang
  );
  return formatYearEra(formatted, bce ? 'bce' : null, lang);
};

const formattedYearRange = (
  born,
  dead,
  lang = 'da',
  unknownLifetime = yearTranslation(lang).unknownLifetime
) => {
  const [
    bornYearFormatted,
    bornYearNumeric,
    bornYearApproximated,
    bornYearBCE,
  ] = extractYear(born, yearTranslation(lang).unknownYear, lang);
  const [
    deadYearFormatted,
    deadYearNumeric,
    deadYearApproximated,
    deadYearBCE,
  ] = extractYear(dead, yearTranslation(lang).unknownYear, lang);
  if (bornYearNumeric == null && deadYearNumeric == null) {
    return `(${unknownLifetime})`;
  } else {
    let deadYearShortened = deadYearFormatted;
    if (
      !deadYearApproximated &&
      !bornYearApproximated &&
      !bornYearBCE &&
      !deadYearBCE &&
      bornYearNumeric != null &&
      bornYearNumeric > 1000 &&
      deadYearNumeric != null &&
      deadYearNumeric > 1000 &&
      deadYearFormatted.substring(0, 2) === bornYearFormatted.substring(0, 2)
    ) {
      deadYearShortened = deadYearFormatted.substring(2, 4);
    }
    let bornYearEra = null;
    let deadYearEra = null;
    if (bornYearBCE && deadYearBCE) {
      deadYearEra = 'bce';
    } else if (bornYearBCE && !deadYearBCE) {
      bornYearEra = 'bce';
      deadYearEra = 'ce';
    }
    return `(${formatYearEra(
      bornYearFormatted,
      bornYearEra,
      lang
    )}–${formatYearEra(
      deadYearShortened.toLowerCase(),
      deadYearEra,
      lang
    )})`;
  }
};

const diffYearsNoYearZero = (bornYear, deadYear) => {
  let diff = deadYear - bornYear;

  // Hvis vi krydser fra BCE til CE, skal vi trække 1 fra
  if (bornYear < 0 && deadYear > 0) {
    diff -= 1;
  }

  return diff;
};

const formattedAge = (period, translate = defaultTranslate, lang = 'da') => {
  let age = null;
  if (
    period != null &&
    period.born != null &&
    period.dead != null &&
    period.born.date != null &&
    period.dead.date != null &&
    period.born.date !== '?' &&
    period.dead.date !== '?'
  ) {
    let born = parseDate(period.born.date);
    const dead = parseDate(period.dead.date);
    born.month = born.month || 0;
    born.day = born.day || 0;
    dead.month = dead.month || 0;
    dead.day = dead.day || 0;
    if (born != null && dead != null) {
      let yearDiff = diffYearsNoYearZero(born.year, dead.year);
      const deadBeforeBirthday =
        dead.month < born.month ||
        (dead.month == born.month && dead.day <= born.day);
      if (deadBeforeBirthday) {
        yearDiff -= 1;
      }
      let ca = '';
      if (
        born.prefix != null ||
        dead.prefix != null ||
        born.month === 0 ||
        dead.month === 0 ||
        born.day === 0 ||
        dead.day === 0
      ) {
        ca = translate('ca.', lang) + ' ';
      }
      age = translate(`(blev {ca}{yearDiff} år)`, lang, {
        ca,
        yearDiff: yearDiff + '',
      });
    }
  }
  return age;
};

const normalizedYear = (year) => {
  const sign = year < 0 ? '-' : '';
  const absYear = Math.abs(year);
  const yearText =
    absYear < 1000 ? String(absYear).padStart(4, '0') : String(absYear);
  return sign + yearText;
};

// Accepterer sYYYY, sYYYY-MM, sYYYY-MM-DD og returnerer altid sYYYY-MM-DD
const normalizeTimelineDate = (date) => {
  const parsed = parseDate(date);
  if (parsed == null || parsed.year == null) {
    return null;
  }

  return `${normalizedYear(parsed.year)}-${String(parsed.month || 1).padStart(
    2,
    '0'
  )}-${String(parsed.day || 1).padStart(2, '0')}`;
};

const compareNormalizedDate = (a, b) => {
  const pa = parseDate(a);
  const pb = parseDate(b);

  if (pa.year !== pb.year) {
    return pa.year < pb.year ? -1 : 1;
  }
  if (pa.month !== pb.month) {
    return pa.month < pb.month ? -1 : 1;
  }
  if (pa.day !== pb.day) {
    return pa.day < pb.day ? -1 : 1;
  }
  return 0;
};

module.exports = {
  compareNormalizedDate,
  extractYear,
  formatYearInterval,
  formatYearEra,
  formatTitleAndYear,
  formattedAge,
  formattedDate,
  formattedYear,
  formattedYearRange,
  normalizeTimelineDate,
  normalizedYear,
  parseDate,
};
