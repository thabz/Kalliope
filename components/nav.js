// @flow

import React from 'react';
import type { Node } from 'react';
import Head from './head';
import { Link, Router } from '../routes';
import PoetName from './poetname';
import WorkName from './workname';
import TextName, {
  textTitleString,
  textLinkTitleString,
} from '../components/textname.js';
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

type BreadcrumbItem = {
  url?: ?URLString,
  title: Node,
};

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

export const kalliopeCrumbs = (lang: Lang) => {
  return [
    {
      url: Links.frontPageURL(lang),
      title: 'Kalliope',
    },
  ];
};

export const poetsCrumbs = (lang: Lang, poet: Poet) => {
  let poetsLinkText: string;
  if (poet.type === 'person') {
    poetsLinkText = _('Personer', lang);
  } else if (poet.type === 'artist') {
    poetsLinkText = _('Kunstnere', lang);
  } else {
    if (poet.country !== 'dk') {
      const cn = CommonData.countries.filter(c => {
        return c.code === poet.country;
      })[0];
      poetsLinkText =
        Strings.toTitleCase(cn.adjective[lang]) + ' ' + _('digtere', lang);
    } else {
      poetsLinkText = _('Digtere', lang);
    }
  }
  Links.poetURL(lang, poet.id);
  return [
    ...kalliopeCrumbs(lang),
    {
      title: poetsLinkText,
      url: Links.poetsURL(lang, 'name', poet.country),
    },
  ];
};

export const poetCrumbs = (lang: Lang, poet: Poet) => {
  return [
    ...poetsCrumbs(lang, poet),
    {
      url: Links.poetURL(lang, poet.id),
      title: <PoetName poet={poet} />,
    },
  ];
};

export const poetCrumbsWithTitle = (lang: Lang, poet: Poet, title: string) => {
  return [
    ...poetsCrumbs(lang, poet),
    {
      url: Links.poetURL(lang, poet.id),
      title: <PoetName poet={poet} />,
    },
    { url: null, title },
  ];
};
export const worksCrumbs = (lang: Lang, poet: Poet) => {
  return [
    ...poetCrumbs(lang, poet),
    {
      url: Links.worksURL(lang, poet.id),
      title: _('Værker', lang),
    },
  ];
};
export const workCrumbs = (lang: Lang, poet: Poet, work: Work) => {
  const workLink = {
    title: <WorkName lang={lang} work={work} useTitle="breadcrumbtitle" />,
    url: Links.workURL(lang, poet.id, work.id),
  };
  let parentLink: ?BreadcrumbItem;
  if (work.parent != null) {
    parentLink = {
      title: (
        <WorkName lang={lang} work={work.parent} useTitle="breadcrumbtitle" />
      ),
      url: Links.workURL(lang, poet.id, work.parent.id),
    };
  }

  return [...poetCrumbs(lang, poet), parentLink, workLink].filter(
    (n: ?BreadcrumbItem) => {
      return n != null;
    }
  );
};

export const textCrumbs = (
  lang: Lang,
  poet: Poet,
  work: Work,
  sectionTitles?: Array<{ id: ?string, title: string }>,
  text: Text
) => {
  let parentSectionsBreadcrumbs: Array<BreadcrumbItem> = [];
  if (sectionTitles != null) {
    parentSectionsBreadcrumbs = sectionTitles.map(t => {
      let title = (
        <TextContent
          contentHtml={[[t.title, { html: true }]]}
          lang={lang}
          contentLang={lang}
        />
      );
      let url = null;
      if (t.id != null) {
        url = Links.textURL(lang, t.id);
      }
      return { url, title };
    });
  }
  const textCrumb = {
    title: textLinkTitleString(text),
    url: null,
  };
  return [
    ...workCrumbs(lang, poet, work),
    ...parentSectionsBreadcrumbs,
    textCrumb,
  ];
};

type NavProps = {
  lang: Lang,
  crumbs: Array<BreadcrumbItem>,
  rightSide?: Node,
};
export default class Nav extends React.Component<NavProps> {
  static defaultProps = {
    sectionTitles: [],
  };

  render() {
    const { lang, crumbs, rightSide } = this.props;

    let joinedLinks = [];
    crumbs.filter(x => x != null).map((crumb, i) => {
      if (i !== 0) {
        joinedLinks.push(<div key={'arrow' + i}>&nbsp;→&nbsp;</div>);
      }
      let link: Node = null;
      if (i !== crumbs.length - 1 && crumb.url != null) {
        link = (
          <Link prefetch route={crumb.url}>
            <a>{crumb.title}</a>
          </Link>
        );
      } else {
        link = crumb.title;
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
