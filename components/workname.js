// @flow
import React from 'react';
import type { Work } from '../pages/helpers/types.js';

export default class WorkName extends React.Component {
  props: {
    work: Work,
  };
  render() {
    const { work } = this.props;
    const { title, year } = work;
    let titlePart = <span>{title}</span>;
    let yearPart = null;
    if (year && year !== '?') {
      yearPart = <span>({year})</span>;
    }

    const parts = [titlePart, yearPart].map((p, i) => {
      const className = i === 0 ? 'title' : 'year';
      return p ? <span key={i} className={className}>{p} </span> : null;
    });
    return <span className="workname">{parts}</span>;
  }
}

export function workTitleString(work: Work): string {
  const { title, year } = work;
  let yearPart = '';
  if (year && year !== '?') {
    yearPart = ` (${year})`;
  }
  return title + yearPart;
}
