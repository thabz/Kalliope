// @flow

import React from 'react';
import { Link } from '../routes';
import type { SectionForRendering } from '../pages/helpers/types.js';
import TwoColumns from './twocolumns.js';

export default class SectionedList extends React.Component {
  props: {
    sections: Array<SectionForRendering>,
  };
  render() {
    const { sections } = this.props;
    let renderedGroups = sections.map((group, i) => {
      const { title, items } = group;
      const list = items.map(item => {
        const content = item.url != null
          ? <Link route={item.url}><a>{item.html}</a></Link>
          : item.html;
        return <div key={item.id}>{content}</div>;
      });
      return (
        <div className="list-section" key={i + title}>
          <h3>{title}</h3>
          {list}
        </div>
      );
    });
    return (
      <TwoColumns>
        {renderedGroups}
        <style jsx>{`
          :global(.list-section) {
            break-inside: avoid;
          }
          :global(.list-section), :global(.list-section-line) {
            line-height: 1.5;
          } /* Fix vertical aligment layout problem in Safari and Chrome */
          :global(.list-section:before) {
            content: '';
            display: block;
            height: 1px;
          }
          :global(.list-section) :global(h3) {
            font-weight: lighter;
            font-size: 18px;
            border-bottom: 1px solid black;
          }
        `}</style>
      </TwoColumns>
    );
  }
}
