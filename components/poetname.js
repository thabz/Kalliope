// @flow

import React from 'react';
import type { Poet, Lang } from '../helpers/types.js';
import { poetNameParts } from './poetname-helpers.js';

const nvl = <T>(x: ?T, v: T): T => {
  return x == null ? v : x;
};

type PoetNameProps = {
  poet: Poet,
  lastNameFirst?: boolean,
  includePeriod?: boolean,
};
export default class PoetName extends React.Component<PoetNameProps> {
  render() {
    const { poet, lastNameFirst, includePeriod } = this.props;
    let pp = null;
    const p = poetNameParts(poet, lastNameFirst, includePeriod);
    const p0 =
      p[0] != null ? (
        <span key={0} className="name">
          {p[0]}
        </span>
      ) : null;
    const p1 =
      p[1] != null ? (
        <span key={1} className="lighter">
          {' '}
          {p[1]}
        </span>
      ) : null;
    if (p0 && p1) {
      pp = [p0, p1];
    } else if (p0) {
      pp = p0;
    }
    return <span className="poetname">{pp}</span>;
  }
}


