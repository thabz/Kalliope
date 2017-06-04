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

    return (
      <div className="tabs">
        {itemsRendered}
        <style jsx>{`
          .tabs {
            border-bottom: 1px solid black;
            margin-bottom: 40px;
          }

          .tabs > :global(.tab) {
            display: inline-block;
            margin-right: 40px;
            border-bottom: 2px solid transparent;
          }

          .tabs > :global(.tab) :global(h2) {
            margin-top: 10px;
            margin-bottom: 20px;
            line-height: 32px;
            font-size: 32px;
            font-weight: lighter;
          }

          @media (max-width: 480px) {
            .tabs > :global(.tab) {
              margin-right: 10px;
            }
            .tabs > :global(.tab) :global(h2) {
              margin-top: 5px;
              margin-bottom: 10px;
              line-height: 16px;
              font-size: 16px;
              font-weight: lighter;
            }
          }

          .tabs > :global(.tab.selected) {
            border-bottom: 2px solid black;
          }

          .tabs :global(.tab.selected a) {
            color: black;
          }

          .tabs > :global(.tab) :global(a) {
            color: #888;
          }
        `}</style>
      </div>
    );
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

export class KalliopeTabs extends React.Component {
  props: {
    lang: Lang,
    selected: 'index' | 'poets' | 'keywords',
  };
  render() {
    const { lang, selected } = this.props;
    const tabs = [
      { id: 'index', title: 'Kalliope', url: '/' },
      { id: 'poets', title: 'Digtere', url: Links.poetsURL(lang, 'year') },
      { id: 'keywords', title: 'Nøgleord', url: Links.keywordsURL(lang) },
    ];
    return <Tabs items={tabs} selected={selected} />;
  }
}
