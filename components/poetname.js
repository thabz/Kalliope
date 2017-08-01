// @flow

import React from 'react';
import type { Poet, Lang } from '../pages/helpers/types.js';

const parts = (
  poet: Poet,
  lastNameFirst: boolean = false,
  includePeriod: boolean = false
): Array<?string> => {
  const { name } = poet;
  const { firstname, lastname } = name;

  let namePart = null;
  let periodPart = null;

  if (lastname) {
    if (firstname) {
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
    if (born.date === '?' && dead.date === '?') {
      periodPart = '(Ukendt levetid)';
    } else {
      let bornYear = born.date === '?'
        ? 'Ukendt år'
        : born.date.substring(0, 4);
      let deadYear = dead.date === '?'
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

export default class PoetName extends React.Component {
  props: {
    poet: Poet,
    lastNameFirst?: boolean,
    includePeriod?: boolean,
  };
  render() {
    const { poet, lastNameFirst, includePeriod } = this.props;
    let pp = null;
    const p = parts(poet, lastNameFirst, includePeriod);
    const p0 = p[0] ? <span key={0} className="name">{p[0]}</span> : null;
    const p1 = p[1] ? <span key={1} className="period"> {p[1]}</span> : null;
    if (p0 && p1) {
      pp = [p0, p1];
    } else if (p0) {
      pp = p0;
    }
    return (
      <span className="poetname">
        {pp}
        <style jsx>{`
          .poetname :global(.period) {
            opacity: 0.5;
          }
        `}</style>

      </span>
    );
  }
}

export function poetNameString(
  poet: Poet,
  lastNameFirst: boolean = false,
  includePeriod: boolean = false
): string {
  const p = parts(poet, lastNameFirst, includePeriod);
  if (p[0] && p[1]) {
    return p[0] + ' ' + p[1];
  } else if (p[0]) {
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

export function poetGenetiveLastName(poet: Poet, lang: Lang): string {
  const { firstname, lastname } = poet.name;
  let name: string = lastname || firstname || 'Ukendt';
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
  }
}
