// @flow

import React from 'react';
import Head from './head';
import { Link } from '../routes';
import PoetName from './poetname';
import WorkName from './workname';
import TextName from './textname';
import * as Links from './links.js';
import type { Lang, Poet, Work, Text } from '../pages/helpers/types.js';

export default class Nav extends React.Component {
  props: {
    lang: Lang,
    poet?: Poet,
    work?: Work,
    links?: Array<any>,
    title?: any,
    rightSide?: any,
  };

  render() {
    const { lang, poet, work, title, rightSide } = this.props;
    let { links } = this.props;
    const rootLink = (
      <Link prefetch route={Links.frontPageURL(lang)}><a>Kalliope</a></Link>
    );

    if (!links) {
      const poetsURL = poet
        ? <Link prefetch route={Links.poetsURL(lang, 'name', poet.country)}>
            <a>Digtere</a>
          </Link>
        : null;
      const poetLink = poet
        ? <Link prefetch route={Links.poetURL(lang, poet.id)}>
            <a><PoetName poet={poet} /></a>
          </Link>
        : null;
      const workLink = work && poet
        ? <Link prefetch route={Links.workURL(lang, poet.id, work.id)}>
            <a>
              <WorkName work={work} />
            </a>
          </Link>
        : null;
      links = [poetsURL, poetLink, workLink];
    }
    links = [rootLink, ...links, title];

    let joinedLinks = [];
    links.filter(x => x != null).map((link, i) => {
      if (i !== 0) {
        joinedLinks.push(<div key={'arrow' + i}>&nbsp;→&nbsp;</div>);
      }
      joinedLinks.push(<div key={'link' + i}>{link}</div>);
    });
    return (
      <div className="nav-container">
        <nav>
          {joinedLinks}
        </nav>
        <div>
          {rightSide}
        </div>
        <style jsx>{`
          :global(body) {
            margin: 0;
            font-family: -apple-system,
              BlinkMacSystemFont,
              Avenir Next,
              Avenir,
              Helvetica,
              sans-serif;
            box-sizing: border-box;
            font-size: 14px;
            height: 150px;
          }
          :global(a) {
            color: #067df7;
            color: rgb(139, 56, 65);
            text-decoration: none;
          }
          @media print {
            :global(a) {
              color: black;
            }
          }
          nav {
            margin-bottom: 80px;
            margin-top: 10px;
            font-weight: lighter;
            display: flex;
          }
          nav > :global(div) {
            flex-shrink: 1;
            padding: 4px 0px;
          }
          .nav-container {
            width: 100%;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            nav {
              display: none;
            }
          }
        `}</style>
      </div>
    );
  }
}
