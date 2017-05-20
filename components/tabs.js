// @flow
import React from 'react';

export default class extends React.Component {
  props: {
    items: Array<{ url: string, title: string }>,
    selectedIndex: number,
  };
  render() {
    const { items, selectedIndex } = this.props;

    const itemsRendered = items.map((item, i) => {
      const className = i === selectedIndex ? 'tab selected' : 'tab';
      return (
        <div className={className} key={i}>
          <a href={item.url}><h2>{item.title}</h2></a>
        </div>
      );
    });

    return <div className="tabs">{itemsRendered}</div>;
  }
}
