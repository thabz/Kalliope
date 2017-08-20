// @flow

import React from 'react';
import type { Lang } from './helpers/types.js';

export default class FormattedDate extends React.Component {
  props: {
    lang: Lang,
    date: ?string,
  };

  render() {
    const { lang, date } = this.props;

    let m = null;
    let day: ?number = null,
      month: ?number = null,
      year: ?number = null;
    let prefix = null;
    if (date == null) {
      return null;
    } else if ((m = date.match(/(\d\d\d\d)-(\d\d)-(\d\d)/))) {
      day = parseInt(m[3]);
      month = parseInt(m[2]);
      year = parseInt(m[1]);
    } else if ((m = date.match(/(\d\d)-(\d\d)-(\d\d\d\d)/))) {
      day = m[1];
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
      result = (
        <span>
          {year}
        </span>
      );
    } else {
      console.log(`Ukendt dato format '${date}'`);
    }
    return (
      <span className={className}>
        {prefix}
        {result}
      </span>
    );
  }
}
