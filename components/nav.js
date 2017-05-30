// @flow

import React from 'react';
import Head from './head';
import Link from 'next/link';
import PoetName from './poetname';
import WorkName from './workname';
import TextName from './textname';
import * as Links from './links.js';
import type { Lang, Poet, Work, Text } from '../pages/helpers/types.js';

export default class extends React.Component {
  props: {
    lang: Lang,
    poet?: Poet,
    work?: Work,
    title?: any,
  };

  render() {
    const { lang, poet, work, title } = this.props;
    const rootLink = <a href="/">Kalliope</a>;
    const poetsURL = poet ? <a href={Links.poetsURL(lang)}>Digtere</a> : null;
    const poetLink = poet
      ? <a href={Links.poetURL(lang, poet.id)}><PoetName poet={poet} /></a>
      : null;
    const workLink = work && poet
      ? <a href={Links.workURL(lang, poet.id, work.id)}>
          <WorkName work={work} />
        </a>
      : null;
    const titleLink = title;
    const links = [rootLink, poetsURL, poetLink, workLink, titleLink]
      .filter(x => x != null)
      .map((link, i, a) => {
        if (i != 0) {
          return <div><span>&nbsp;→&nbsp;</span>{link}</div>;
        } else {
          return <div>{link}</div>;
        }
      });
    return (
      <nav>
        <div>
          {links}
        </div>
        <style jsx>{`
        :global(body) {
          margin: 0;
          font-family: -apple-system,BlinkMacSystemFont,Avenir Next,Avenir,Helvetica,sans-serif;
        }
        nav {
          text-align: left;
          margin-bottom: 80px;
          font-weight: lighter;
        }
        nav {
          display: flex;
          justify-content: space-between;
        }
        nav > div {
          padding: 4px 0px;
        }
        nav > div {
          display: flex;
        }
        nav > div > div {
          padding: 6px 16px 6px 0;
        }
      `}</style>
      </nav>
    );
  }
}
