// @flow

import React from 'react';
import Head from './head';
import Link from 'next/link';
import * as Links from './links.js';
import type { Lang } from '../pages/helpers/types.js';

const links = [
  { href: '/da/poets/name', label: 'Dansk' },
  { href: '/en/poets/name', label: 'Engelsk' },
];

export default class extends React.Component {
  props: {
    lang: Lang,
  };

  render() {
    const { lang } = this.props;
    return (
      <nav>
        {links.map(({ href, label }) => (
          <div key={href}>
            <a href={href}>{label}</a>
          </div>
        ))}
        <style jsx>{`
          nav {
            padding-top: 40px;
            padding-bottom: 20px;
            text-align: right;
            display: flex;
            justify-content: flex-end;
          }
          nav > div {
            padding-left: 16px;
          }
          `}</style>
      </nav>
    );
  }
}
