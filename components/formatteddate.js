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
  if ((m = date.match(/(\d\d\d\d)-(\d\d)-(\d\d)/))) {
    day = parseInt(m[3]);
    month = parseInt(m[2]);
    year = parseInt(m[1]);
  } else if ((m = date.match(/(\d\d)-(\d\d)-(\d\d\d\d)/))) {
    day = parseInt(m[1]);
    month = parseInt(m[2]);
    year = parseInt(m[3]);
  } else if ((m = date.match(/(\d\d\d\d)/))) {
    year = parseInt(m[1]);
  }
  return { prefix, year, month, day };
};

export const formattedDate = (date) => {
  let m = null;
  let day = null,
    month = null,
    year = null;
  let prefix = '';
  if (date == null) {
    return null;
  } else if ((m = date.match(/(\d\d\d\d)-(\d\d)-(\d\d)/))) {
    day = parseInt(m[3]);
    month = parseInt(m[2]);
    year = parseInt(m[1]);
  } else if ((m = date.match(/(\d\d)-(\d\d)-(\d\d\d\d)/))) {
    day = parseInt(m[1]);
    month = parseInt(m[2]);
    year = parseInt(m[3]);
  } else if ((m = date.match(/(\d\d\d\d)/))) {
    year = parseInt(m[1]);
  }
  let className = null;
  if ((m = date.match(/ca/i))) {
    prefix = 'c. ';
  }

  let result = null;

  if (day != null && month != null && year != null) {
    result = `${day}/${month} ${year}`;
  } else if (year != null) {
    result = `${year}`;
  } else {
    return null;
  }
  return `${prefix}${result}`;
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
