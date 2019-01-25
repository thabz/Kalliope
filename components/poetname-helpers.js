// @flow

import type { Poet, Lang } from '../pages/helpers/types.js'

const nvl = <T>(x: ?T, v: T): T => {
  return x == null ? v : x;
};

export function poetNameParts(
  poet: Poet,
  lastNameFirst: boolean = false,
  includePeriod: boolean = false
): Array<?string> {
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
    if (
      born != null &&
      born.date === '?' &&
      dead != null &&
      dead.date === '?'
    ) {
      periodPart = '(Ukendt levetid)';
    } else {
      let bornYear =
        born == null || born.date === '?'
          ? 'Ukendt år'
          : born.date.substring(0, 4);
      let deadYear =
        dead == null || dead.date === '?'
          ? 'ukendt år'
          : dead.date.substring(0, 4);
      if (deadYear.substring(0, 2) === bornYear.substring(0, 2)) {
        deadYear = deadYear.substring(2, 4);
      }
      periodPart = `(${bornYear}–${deadYear})`;
    }
  }
  return [namePart, periodPart];
};


export function poetNameString(
  poet: Poet,
  lastNameFirst: boolean = false,
  includePeriod: boolean = false
): string {
  const p = poetNameParts(poet, lastNameFirst, includePeriod);
  if (p[0] != null && p[1] != null) {
    return p[0] + ' ' + p[1];
  } else if (p[0] != null) {
    return p[0];
  } else {
    return '';
  }
}

export const navnMedEjefald = (navn: ?string): ?string => {
  if (navn == null) {
    return null;
  }
  if (navn.match(/[szx]$/)) {
    return `${navn}’`;
  } else {
    return `${navn}s`;
  }
};

export function poetLastNameString(poet: Poet): string {
  const { firstname, lastname } = poet.name;
  return nvl(lastname, nvl(firstname, 'Ukendt'));
}

export function poetGenetiveLastName(poet: Poet, lang: Lang): string {
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

