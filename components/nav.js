// @flow

import React from 'react';
import Head from './head';
import Link from 'next/link';
import * as Links from './links.js';
import type { Lang } from '../pages/helpers/types.js';

const links = [
  { href: '/da/poets', label: 'Dansk' },
  { href: '/en/poets', label: 'Engelsk' },
];

export default class extends React.Component {
  props: {
    lang: Lang,
  };

  render() {
    const { lang } = this.props;
    const poetsURL = Links.poetsURL(lang);
    return (
      <nav>
        <ul>
          <ul>
            <li>
              <a href="/">Kalliope</a>
            </li>
            <li>
              <a href={poetsURL}>Digtere</a>
            </li>
          </ul>
          <ul>
            {links.map(({ href, label }) => (
              <li key={href}>
                <a href={href}>{label}</a>
              </li>
            ))}
          </ul>
        </ul>

        <style jsx>{`
        :global(body) {
          margin: 0;
          font-family: -apple-system,BlinkMacSystemFont,Avenir Next,Avenir,Helvetica,sans-serif;
        }
        nav {
          text-align: left;
        }
        ul {
          display: flex;
          justify-content: space-between;
        }
        nav > ul {
          padding: 4px 0px;
        }
        li {
          display: flex;
          padding: 6px 16px;
        }
      `}</style>
      </nav>
    );
  }
}
