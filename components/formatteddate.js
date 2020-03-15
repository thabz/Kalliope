// @flow

import React, { useContext } from 'react';
import type { Lang } from '../common/types.js';
import LangContext from '../common/LangContext.js';

type parseDateReturnType = {
  day: ?number,
  month: ?number,
  year: ?number,
  prefix: ?string,
};
export const parseDate = (date: ?string): ?parseDateReturnType => {
  if (date == null) {
    return null;
  }
  let prefix: ?string = null,
    day: ?number = null,
    month: ?number = null,
    year: ?number = null;

  let m: ?Array<string>;
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

type FormattedDateProps = {
  date: ?string,
};

const FormattedDate = (props: FormattedDateProps) => {
  const { date } = props;
  const lang = useContext(LangContext);

  let m = null;
  let day: ?number = null,
    month: ?number = null,
    year: ?number = null;
  let prefix: ?string = null;
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
    prefix = 'c.';
  }

  let result = null;

  if (day != null && month != null && year != null) {
    result = (
      <span>
        <span>{day}</span>/<span>{month}</span> {year}
      </span>
    );
  } else if (year != null) {
    result = <span>{year}</span>;
  } else {
    //console.log(`Ukendt dato format '${date}'`);
  }
  return (
    <span className={className}>
      {prefix}
      {result}
    </span>
  );
};

export const extractYear = (date: string) => {
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

export const formattedYear = (date: string) => {
  const [formatted] = extractYear(date);
  return formatted;
};

export const formattedYearRange = (born: string, dead: string) => {
  const [
    bornYearFormatted,
    bornYearNumeric,
    bornYearApproximated,
  ] = extractYear(born);
  const [
    deadYearFormatted,
    deadYearNumeric,
    deadYearApproximated,
  ] = extractYear(dead);
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

export default FormattedDate;
