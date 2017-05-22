// @flow

import React from 'react';
import type { SectionForRendering } from '../pages/helpers/types.js';

export default class extends React.Component {
  props: {
    sections: Array<SectionForRendering>,
  };
  render() {
    const { sections } = this.props;
    let renderedGroups = [];
    sections.forEach(group => {
      const { title, items } = group;
      const list = items.map((item, i) => {
        return (
          <div key={item.id}>
            <a href={item.url}>{item.html}</a>
          </div>
        );
      });
      const renderedGroup = (
        <div className="list-section" key={title}>
          <h3>{title}</h3>
          {list}
        </div>
      );

      renderedGroups.push(renderedGroup);
    });
    return (
      <div className="two-columns">
        {renderedGroups}
      </div>
    );
  }
}
