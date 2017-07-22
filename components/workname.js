// @flow
import React from 'react';
import type { Work } from '../pages/helpers/types.js';

export default class WorkName extends React.Component {
  props: {
    work: Work,
    cursive?: boolean,
  };
  render() {
    const { work, cursive } = this.props;
    const { title, year } = work;
    let titlePart = <span>{title}</span>;
    let yearPart = null;
    if (year && year !== '?') {
      yearPart = <span>({year})</span>;
    }

    const parts = [titlePart, yearPart].map((p, i) => {
      let className = i === 0 ? 'title' : 'year';
      if (cursive === true && i === 0) {
        className += ' cursive';
      }
      return p ? <span key={i} className={className}>{p} </span> : null;
    });
    return (
      <span className="workname">
        {parts}
        <style jsx>{`
          .workname :global(.year) {
            opacity: 0.5;
          }
          .workname :global(.title.cursive) {
            font-style: italic;
          }
        `}</style>
      </span>
    );
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
