// @flow
import React from 'react';
import { Link } from '../routes';
import * as Links from './links.js';
import type { Lang, Poet } from '../pages/helpers/types.js';

class LoupeSVG extends React.Component {
  props: {
    color: string,
  };
  render() {
    const { color } = this.props;
    const style = {
      fill: 'none',
      stroke: color,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: '2px',
    };
    return (
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <ellipse style={style} cx="19.55" cy="19.5" rx="18.55" ry="18.5" />
        <line style={style} x1="47" x2="32.96" y1="47" y2="33" />
      </svg>
    );
  }
}

export default class Tabs extends React.Component {
  props: {
    items: Array<{ id: string, url: string, title: string, hide?: boolean }>,
    selected: string,
  };

  constructor(props) {
    super(props);
    this.state = { showSearchField: false };
    this.searchField = null;
    this.onLoupeClick = this.onLoupeClick.bind(this);
  }

  onLoupeClick(e) {
    this.setState({ showSearchField: !this.state.showSearchField });
    this.searchField.focus();
    e.stopPropagation();
  }

  render() {
    const { items, selected } = this.props;

    const searchField = (
      <div>
        <input
          ref={x => {
            this.searchField = x;
          }}
          className="search-field"
          placeholder="Søg i Kalliope"
        />
      </div>
    );

    const itemsRendered = items.filter(item => !item.hide).map((item, i) => {
      const className = item.id === selected ? 'tab selected' : 'tab';
      return (
        <div className={className} key={item.url}>
          <Link route={item.url}><a><h2>{item.title}</h2></a></Link>
        </div>
      );
    });

    const leftSide = (
      <div className="leftside">
        <div
          className="tabs"
          style={{
            display: this.state.showSearchField ? 'none' : 'block',
          }}>
          {itemsRendered}
        </div>
        <div
          style={{
            display: this.state.showSearchField ? 'block' : 'none',
          }}>
          {searchField}
        </div>
      </div>
    );

    const loupeColor = this.state.showSearchField ? 'black' : '#707070';

    return (
      <div className="tabs-container">
        {leftSide}
        <div className="loupe">
          <span onClick={this.onLoupeClick} style={{ cursor: 'pointer' }}>
            <LoupeSVG color={loupeColor} />
          </span>
        </div>
        <style jsx>{`
          .tabs-container {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid black;
            margin-bottom: 40px; /* background-color: yellow; */
            flex-grow: 1;
          }
          .loupe {
            flex-basis: 28px;
            flex-shrink: 1;
            padding-top: 14px;
          }
          :global(.search-field) {
            font-size: 32px;
            height: 40px;
            width: 100%;
            border: 0;
            padding: 0;
            margin: 0;
            outline: 0;
            font-weight: lighter;
            margin-bottom: 18px;
            padding-bottom: 0px;
            margin-top: 6px;
          }
          .tabs {
          }
          :global(.tabs) > :global(.tab) {
            display: inline-block;
            margin-right: 40px;
            border-bottom: 2px solid transparent;
          }
          :global(.tabs) > :global(.tab) :global(h2) {
            margin-top: 10px;
            margin-bottom: 20px;
            line-height: 32px;
            font-size: 32px;
            font-weight: lighter;
          }
          @media (max-width: 321px) {
            .tabs > :global(.tab) {
              margin-right: 4px !important;
            }
          }
          @media (max-width: 480px) {
            .tabs > :global(.tab) {
              margin-right: 10px;
            }
            .tabs > :global(.tab) :global(h2) {
              margin-top: 5px;
              margin-bottom: 10px;
              line-height: 12px;
              font-size: 12px !important;
            }
          }
          :global(.tabs) > :global(.tab.selected) {
            border-bottom: 2px solid black;
          }
          :global(.tabs) :global(.tab.selected a) {
            color: black;
          }
          :global(.tabs) > :global(.tab) :global(a) {
            color: #707070;
          }
          @media (max-width: 800px) {
            .tabs > :global(.tab) :global(h2) {
              font-size: 28px;
            }
            .tabs > :global(.tab) {
              margin-right: 20px;
            }
          }
          @media (max-width: 700px) {
            .tabs > :global(.tab) :global(h2) {
              font-size: 24px;
            }
            .tabs > :global(.tab) {
              margin-right: 15px;
            }
          }
          @media (max-width: 600px) {
            .tabs > :global(.tab) :global(h2) {
              font-size: 18px;
            }
            .tabs > :global(.tab) {
              margin-right: 15px;
            }
          }
          @media print {
            .tabs {
              display: none;
            }
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
    selected: 'works' | 'titles' | 'first' | 'bio' | 'bibliography',
  };

  render() {
    const { lang, poet, selected } = this.props;
    const tabs: Array<{
      id: string,
      title: string,
      hide?: boolean,
      url: string,
    }> = [
      {
        id: 'works',
        title: 'Værker',
        hide: !poet.has_works,
        url: Links.worksURL(lang, poet.id),
      },
      {
        id: 'titles',
        title: 'Digttitler',
        hide: !poet.has_works,
        url: Links.linesURL(lang, poet.id, 'titles'),
      },
      {
        id: 'first',
        title: 'Førstelinjer',
        hide: !poet.has_works,
        url: Links.linesURL(lang, poet.id, 'first'),
      },
      {
        id: 'bibliography',
        title: 'Bibliografi',
        hide: !poet.has_bibliography,
        url: Links.bibliographyURL(lang, poet.id),
      },
      {
        id: 'bio',
        title: 'Biografi',
        hide: !poet.has_biography,
        url: Links.bioURL(lang, poet.id),
      },
    ];
    return <Tabs items={tabs} selected={selected} />;
  }
}

export class KalliopeTabs extends React.Component {
  props: {
    lang: Lang,
    selected: 'index' | 'poets' | 'keywords' | 'dictionary',
  };
  render() {
    const { lang, selected } = this.props;
    const tabs = [
      { id: 'index', title: 'Kalliope', url: Links.frontPageURL(lang) },
      { id: 'poets', title: 'Digtere', url: Links.poetsURL(lang, 'name') },
      { id: 'keywords', title: 'Nøgleord', url: Links.keywordsURL(lang) },
      { id: 'dictionary', title: 'Ordbog', url: Links.dictionaryURL(lang) },
    ];
    return <Tabs items={tabs} selected={selected} />;
  }
}
