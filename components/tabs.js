// @flow
import React from 'react';
import * as Links from './links.js';
import type { Lang, Poet } from '../pages/helpers/types.js';

export default class Tabs extends React.Component {
  props: {
    items: Array<{ id: string, url: string, title: string }>,
    selected: string,
  };
  render() {
    const { items, selected } = this.props;

    const itemsRendered = items.map((item, i) => {
      const className = item.id === selected ? 'tab selected' : 'tab';
      return (
        <div className={className} key={item.url}>
          <a href={item.url}><h2>{item.title}</h2></a>
        </div>
      );
    });

    return <div className="tabs">{itemsRendered}</div>;
  }
}

export class PoetTabs extends React.Component {
  props: {
    poet: Poet,
    lang: Lang,
    selected: 'works' | 'titles' | 'first',
  };

  render() {
    const { lang, poet, selected } = this.props;
    const tabs = [
      { id: 'works', title: 'Værker', url: Links.worksURL(lang, poet.id) },
      {
        id: 'titles',
        title: 'Digttitler',
        url: Links.linesURL(lang, poet.id, 'titles'),
      },
      {
        id: 'first',
        title: 'Førstelinjer',
        url: Links.linesURL(lang, poet.id, 'first'),
      },
    ];
    return <Tabs items={tabs} selected={selected} />;
  }
}
