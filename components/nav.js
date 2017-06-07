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
    links?: Array<any>,
    title?: any,
  };

  render() {
    const { lang, poet, work, title } = this.props;
    let { links } = this.props;
    const rootLink = <a href="/">Kalliope</a>;

    if (!links) {
      const poetsURL = poet ? <a href={Links.poetsURL(lang)}>Digtere</a> : null;
      const poetLink = poet
        ? <a href={Links.poetURL(lang, poet.id)}><PoetName poet={poet} /></a>
        : null;
      const workLink = work && poet
        ? <a href={Links.workURL(lang, poet.id, work.id)}>
            <WorkName work={work} />
          </a>
        : null;
      links = [poetsURL, poetLink, workLink];
    }
    links = [rootLink, ...links, title];

    let joinedLinks = [];
    links.filter(x => x != null).map((link, i) => {
      if (i !== 0) {
        joinedLinks.push(<div>&nbsp;→&nbsp;</div>);
      }
      joinedLinks.push(<div>{link}</div>);
    });
    return (
      <nav>
        {joinedLinks}
        <style jsx>{`
        :global(body) {
          margin: 0;
          font-family: -apple-system,BlinkMacSystemFont,Avenir Next,Avenir,Helvetica,sans-serif;
        }
        nav {
          margin-bottom: 80px;
          font-weight: lighter;
          display: flex;
        }
        nav > :global(div) {
          flex-shrink: 1;
          padding: 4px 0px;
        }
      `}</style>
      </nav>
    );
  }
}
