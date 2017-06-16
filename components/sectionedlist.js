// @flow

import React from 'react';
import type { SectionForRendering } from '../pages/helpers/types.js';

export default class extends React.Component {
  props: {
    sections: Array<SectionForRendering>,
  };
  render() {
    const { sections } = this.props;
    let renderedGroups = sections.map((group, i) => {
      const { title, items } = group;
      const list = items.map(item => {
        const content = item.url != null
          ? <a href={item.url}>{item.html}</a>
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
      <div className="two-columns">
        {renderedGroups}
        <style jsx>{`
            div.two-columns {
              width: 100%;
              columns: 2;
              column-gap: 20px;
            }

            @media (max-width: 480px) {
              div.two-columns {
                columns: 1 !important;
              }
            }

            :global(.list-section) {
              break-inside: avoid;
            }

            :global(.list-section), :global(.list-section-line) {
              line-height: 1.5;
            }
            /* Fix vertical aligment layout problem in Safari and Chrome */
            :global(.list-section:before) {
              content: '';
              display: block;
              height: 1px;
            }
        `}</style>
      </div>
    );
  }
}
