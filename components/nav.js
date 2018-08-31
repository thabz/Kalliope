// @flow

import React from 'react';
import Head from './head';
import { Link, Router } from '../routes';
import PoetName from './poetname';
import WorkName from './workname';
import TextName from './textname';
import TextContent from './textcontent.js';
import CommonData from '../pages/helpers/commondata.js';
import _ from '../pages/helpers/translations.js';
import * as Strings from '../pages/helpers/strings.js';
import * as Links from './links.js';
import type {
  Lang,
  Poet,
  Work,
  Text,
  URLString,
} from '../pages/helpers/types.js';

type NavPagingType = {
  prev: ?{
    url: URLString,
    title: string,
  },
  next: ?{
    url: URLString,
    title: string,
  },
};

export class NavPaging extends React.Component<NavPagingType> {
  onKeyUp: KeyboardEvent => void;

  constructor(props: NavPagingType) {
    super(props);
    this.onKeyUp = this.onKeyUp.bind(this);
  }

  componentDidMount() {
    if (
      document != null &&
      document.body != null &&
      document.body.classList != null
    ) {
      // eslint-disable-next-line no-undef
      document.addEventListener('keyup', this.onKeyUp);
    }
  }

  componentWillUnmount() {
    // eslint-disable-next-line no-undef
    document.removeEventListener('keyup', this.onKeyUp);
  }

  onKeyUp(e: KeyboardEvent) {
    const { prev, next } = this.props;
    if (e.keyCode === 37) {
      // Left cursor key
      if (prev != null && window && !window.searchFieldHasFocus) {
        Router.pushRoute(prev.url);
        window.scrollTo(0, 0);
        e.preventDefault();
      }
    } else if (e.keyCode === 39) {
      // Right cursor key
      if (next != null && window && !window.searchFieldHasFocus) {
        Router.pushRoute(next.url);
        window.scrollTo(0, 0);
        e.preventDefault();
      }
    }
  }

  render() {
    const { prev, next } = this.props;
    const arrows = [prev, next].map((item, i) => {
      if (item == null) return null;
      const { url, title } = item;
      const arrow = i === 0 ? '←' : '→';
      const style = i === 1 ? { marginLeft: '10px' } : null;
      return (
        <div style={style} key={i}>
          <Link prefetch route={url}>
            <a title={title}>{arrow}</a>
          </Link>
        </div>
      );
    });
    return <div style={{ display: 'flex', padding: '4px 0' }}>{arrows}</div>;
  }
}

type NavProps = {
  lang: Lang,
  poet?: Poet,
  work?: Work,
  links?: Array<any>,
  sectionTitles?: Array<{ id: ?string, title: string }>,
  title?: any,
  rightSide?: any,
};
export default class Nav extends React.Component<NavProps> {
  static defaultProps = {
    sectionTitles: [],
  };

  render() {
    const { lang, poet, work, title, sectionTitles, rightSide } = this.props;
    let { links } = this.props;

    const isIndexPage =
      poet == null &&
      work == null &&
      title == null &&
      (links == null || links.length === 0);

    const rootLink = (
      <Link prefetch route={Links.frontPageURL(lang)}>
        <a>Kalliope</a>
      </Link>
    );

    if (!links) {
      let poetsLink = null;
      if (poet != null) {
        let poetsLinkText = null;
        if (poet.type === 'person') {
          poetsLinkText = _('Personer', lang);
          poetsLink = <span>{poetsLinkText}</span>;
        } else if (poet.type === 'artist') {
          poetsLinkText = _('Kunstnere', lang);
          poetsLink = <span>{poetsLinkText}</span>;
        } else {
          if (poet.country !== 'dk') {
            const cn = CommonData.countries.filter(c => {
              return c.code === poet.country;
            })[0];
            poetsLinkText =
              Strings.toTitleCase(cn.adjective[lang]) +
              ' ' +
              _('digtere', lang);
          } else {
            poetsLinkText = _('Digtere', lang);
          }
          poetsLink = (
            <Link prefetch route={Links.poetsURL(lang, 'name', poet.country)}>
              <a>{poetsLinkText}</a>
            </Link>
          );
        }
      }
      const poetLink = poet ? (
        <Link prefetch route={Links.poetURL(lang, poet.id)}>
          <a>
            <PoetName poet={poet} />
          </a>
        </Link>
      ) : null;
      const workLink =
        work && poet ? (
          <Link prefetch route={Links.workURL(lang, poet.id, work.id)}>
            <a>
              <WorkName work={work} />
            </a>
          </Link>
        ) : null;
      links = [poetsLink, poetLink, workLink];
    }
    let renderedSectionTitles: Array<TextContent> = [];
    if (sectionTitles != null) {
      console.log(sectionTitles);
      renderedSectionTitles = sectionTitles.map(t => {
        let text = (
          <TextContent
            contentHtml={[[t.title, { html: true }]]}
            lang={lang}
            contentLang={lang}
          />
        );
        if (t.id != null) {
          text = (
            <Link route={Links.textURL(lang, t.id)}>
              <a>{text}</a>
            </Link>
          );
        }
        return text;
      });
    }

    links = [rootLink, ...links, ...renderedSectionTitles, title];

    if (isIndexPage) {
      links = [<span>Kalliope</span>];
    }

    let joinedLinks = [];
    links.filter(x => x != null).map((link, i) => {
      if (i !== 0) {
        joinedLinks.push(<div key={'arrow' + i}>&nbsp;→&nbsp;</div>);
      }
      joinedLinks.push(<div key={'link' + i}>{link}</div>);
    });

    let rightSideStyle = null;
    if (rightSide != null) {
      rightSideStyle = { paddingLeft: '10px' };
    }
    return (
      <div className="nav-container">
        <nav>{joinedLinks}</nav>
        <div style={rightSideStyle}>{rightSide}</div>
        <style jsx>{`
          :global(body) {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
              Avenir Next, Avenir, Helvetica, sans-serif;
            box-sizing: border-box;
            font-size: 14px;
            height: 150px;
            -webkit-tap-highlight-color: ${CommonData.backgroundLinkColor};
          }
          :global(a) {
            color: ${CommonData.linkColor};
            text-decoration: none;
          }
          :global(a):global(.lighter) {
            color: ${CommonData.lightLinkColor};
          }
          @media print {
            :global(a) {
              color: black;
            }
            :global(body) {
              font-size: 9pt;
            }
          }
          nav {
            font-weight: lighter;
            display: flex;
          }
          nav > :global(div) {
            flex-shrink: 1;
            padding: 4px 0px;
          }
          .nav-container {
            margin-top: 10px;
            margin-bottom: 80px;
            width: 100%;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            .nav-container {
              display: none;
            }
          }
        `}</style>
      </div>
    );
  }
}
