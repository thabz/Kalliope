// @flow

import React from 'react';
import Head from './head';
import { Link } from '../routes';
import * as Links from './links.js';
import type { Lang } from '../pages/helpers/types.js';

const links = [
  { href: '/da/poets/name', label: 'Dansk' },
  { href: '/en/poets/name', label: 'Engelsk' },
];

type LangSelectProps = {
  lang: Lang,
};
export default class LangSelect extends React.Component<LangSelectProps> {
  render() {
    const { lang } = this.props;
    return <div style={{ paddingBottom: '70px' }} />;
    /*
    return (
      <nav>
        {links.map(({ href, label }) =>
          <div key={href}>
            <Link route={href}><a>{label}</a></Link>
          </div>
        )}
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
          @media print {
            nav {
              display: none;
            }
          }
        `}</style>
      </nav>
    );
    */
  }
}
