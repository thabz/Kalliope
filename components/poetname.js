// @flow

import React from 'react';
import { poetNameParts } from './poetname-helpers.js';

const PoetName = (props) => {
  const { poet, lastNameFirst, includePeriod } = props;
  let pp = null;
  const p = poetNameParts(poet, lastNameFirst, includePeriod);
  const p0 =
    p[0] != null ? (
      <span key={0} className="name">
        {p[0]}
      </span>
    ) : null;
  // nowrap herunder, da det ser bedst ud i overskrifter, at parentesen
  // med leveår ikke knækker over.
  const p1 =
    p[1] != null ? (
      <span key={1} className="lighter" style={{ whiteSpace: 'nowrap' }}>
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
};

export default PoetName;
