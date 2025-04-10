import { formattedYearRange } from './formatteddate.js';

const nvl = (x, v) => {
  return x == null ? v : x;
};

export function poetNameParts(
  poet,
  lastNameFirst = false,
  includePeriod = false
) {
  const { name } = poet;
  const { firstname, lastname } = name;

  let namePart = null;
  let periodPart = null;

  if (lastname != null) {
    if (firstname != null) {
      if (lastNameFirst) {
        namePart = `${lastname}, ${firstname}`;
      } else {
        namePart = `${firstname} ${lastname}`;
      }
    } else {
      namePart = lastname;
    }
  } else {
    namePart = firstname;
  }

  if (includePeriod && poet.period != null) {
    const { born, dead } = poet.period;
    periodPart = formattedYearRange(nvl(born, {}).date, nvl(dead, {}).date);
  }
  return [namePart, periodPart];
}

export function poetNameString(
  poet,
  lastNameFirst = false,
  includePeriod = false
) {
  const p = poetNameParts(poet, lastNameFirst, includePeriod);
  if (p[0] != null && p[1] != null) {
    return p[0] + ' ' + p[1];
  } else if (p[0] != null) {
    return p[0];
  } else {
    return '';
  }
}

export const navnMedEjefald = (navn) => {
  if (navn == null) {
    return null;
  }
  if (navn.match(/[szx]$/)) {
    return `${navn}’`;
  } else {
    return `${navn}s`;
  }
};

export function poetLastNameString(poet) {
  const { firstname, lastname } = poet.name;
  return nvl(lastname, nvl(firstname, 'Ukendt'));
}

export function poetGenetiveLastName(poet, lang) {
  const { firstname, lastname } = poet.name;
  let name = nvl(lastname, nvl(firstname, 'Ukendt'));
  if (lang === 'da') {
    if (name.match(/[szx]$/)) {
      return `${name}’`;
    } else {
      return `${name}s`;
    }
  } else if (lang === 'en') {
    if (name.match(/s$/)) {
      return `${name}’`;
    } else {
      return `${name}’s`;
    }
  } else {
    throw `Ukendt sprog: ${lang}`;
  }
}
