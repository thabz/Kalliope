// @flow

import React from 'react';
import Head from './head';
import Link from 'next/link';
import * as Links from './links.js';
import type { Lang } from '../pages/helpers/types.js';

export default class extends React.Component {
  props: {
    lang: Lang,
  };

  render() {
    const { lang } = this.props;
    const poetsURL = Links.poetsURL(lang);
    return (
      <nav>
        <div>
          <div><a href="/">Kalliope</a></div>
          <div><a href={poetsURL}>Digtere</a></div>
        </div>
        <style jsx>{`
        :global(body) {
          margin: 0;
          font-family: -apple-system,BlinkMacSystemFont,Avenir Next,Avenir,Helvetica,sans-serif;
        }
        nav {
          text-align: left;
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
