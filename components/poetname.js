// @flow

import React from 'react';
import type { Poet } from '../pages/helpers/types.js';

export default class PoetName extends React.Component {
  props: {
    poet: Poet,
    lastNameFirst?: boolean,
    includePeriod?: boolean,
  };
  render() {
    const { poet, lastNameFirst, includePeriod } = this.props;
    const { name } = poet;
    const { firstname, lastname } = name;
    let namePart = null;
    if (lastname) {
      if (firstname) {
        if (lastNameFirst) {
          namePart = <span>{lastname}, {firstname}</span>;
        } else {
          namePart = <span>{firstname} {lastname}</span>;
        }
      } else {
        namePart = <span>{lastname}</span>;
      }
    } else {
      namePart = <span>{firstname}</span>;
    }
    let periodPart = null;
    if (includePeriod && poet.period != null) {
      const { born, dead } = poet.period;
      if (born.date === '?' && dead.date === '?') {
        periodPart = <span>(Ukendt levetid)</span>;
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
        periodPart = <span>({bornYear}–{deadYear})</span>;
      }
    }
    const parts = [namePart, periodPart].map((p, i) => {
      const className = i === 0 ? 'name' : 'period';
      return p ? <span key={i} className={className}>{p} </span> : null;
    });
    return <span className="poetname">{parts}</span>;
  }
}
