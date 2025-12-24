import _ from '../common/translations.js';

export const parseDate = (date) => {
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
  } else if ((m = date.match(/(\d\d)-(\d\d)-(-?\d\d\d\d)/))) {
    day = parseInt(m[1]);
    month = parseInt(m[2]);
    year = parseInt(m[3]);
  } else if ((m = date.match(/(-?\d\d\d\d)/))) {
    year = parseInt(m[1]);
  }
  return { prefix, year, month, day };
};

export const formattedDate = (date) => {
  if (date == null) {
    return null;
  }
  let { year, month, day, prefix } = parseDate(date);

  let result = null;

  if (year < 0) {
    year = Math.abs(year) + ' f.Kr.';
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

export const extractYear = (date) => {
  let m = null,
    numericYear = null,
    prefix = '';
  if (date == null || date === '?') {
    return ['Ukendt år', null, true];
  } else if ((m = date.match(/(\d\d\d\d)/))) {
    numericYear = parseInt(m[1]);
  }
  if ((m = date.match(/ca/i))) {
    prefix = 'c. ';
  }
  if (numericYear == null) {
    return ['Ukendt år', null, true];
  }
  return [`${prefix}${numericYear}`, numericYear, prefix !== ''];
};

export const formattedYear = (date) => {
  const [formatted] = extractYear(date);
  return formatted;
};

export const formattedYearRange = (born, dead) => {
  const [bornYearFormatted, bornYearNumeric, bornYearApproximated] =
    extractYear(born);
  const [deadYearFormatted, deadYearNumeric, deadYearApproximated] =
    extractYear(dead);
  if (bornYearNumeric == null && deadYearNumeric == null) {
    return '(Ukendt levetid)';
  } else {
    let deadYearShortened = deadYearFormatted;
    if (
      !deadYearApproximated &&
      !bornYearApproximated &&
      bornYearNumeric != null &&
      bornYearNumeric > 1000 &&
      deadYearNumeric != null &&
      deadYearNumeric > 1000 &&
      deadYearFormatted.substring(0, 2) === bornYearFormatted.substring(0, 2)
    ) {
      deadYearShortened = deadYearFormatted.substring(2, 4);
    }
    return `(${bornYearFormatted}–${deadYearShortened.toLowerCase()})`;
  }
};

export function formattedAge(period, lang) {
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
    function diffYearsNoYearZero(bornYear, deadYear) {
      let diff = deadYear - bornYear;

      // Hvis vi krydser fra BCE til CE, skal vi trække 1 fra
      if (bornYear < 0 && deadYear > 0) {
        diff -= 1;
      }

      return diff;
    }

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
        (born.month == dead.month && dead.day <= born.day);
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
        ca = _('ca.', lang) + ' ';
      }
      age = _(`(blev {ca}{yearDiff} år)`, lang, {
        ca,
        yearDiff: yearDiff + '',
      });
    }
  }
  return age;
}
