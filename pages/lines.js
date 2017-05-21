// @flow

import React from 'react';
import Link from 'next/link';
import Head from '../components/head';
import Nav from '../components/nav';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import WorkName from '../components/workname.js';
import Tabs from '../components/tabs.js';
import * as Links from '../components/links.js';
import type { Lang, Poet, Work } from './helpers/types.js';
import 'isomorphic-fetch';

type LinesType = 'first' | 'titles';
type LinesPair = { id: string, title: string, firstline: string };
export default class extends React.Component {
  props: {
    lang: Lang,
    poet: Poet,
    lines: Array<LinesPair>,
    type: LinesType,
  };

  static async getInitialProps({
    query: { lang, poetId, type },
  }: {
    query: { lang: Lang, poetId: string, type: LinesType },
  }) {
    const res = await fetch(
      `http://localhost:3000/static/api/${poetId}/lines.json`
    );
    const json: { poet: Poet, lines: Array<LinesPair> } = await res.json();
    return { lang, poet: json.poet, lines: json.lines, type };
  }

  render() {
    const { lang, poet, type, lines } = this.props;

    const tabs = [
      { title: 'Værker', url: Links.worksURL(lang, poet.id) },
      { title: 'Digttitler', url: Links.linesURL(lang, poet.id, 'titles') },
      { title: 'Førstelinjer', url: Links.linesURL(lang, poet.id, 'first') },
    ];
    const selectedTabIndex = type === 'titles' ? 1 : 2;

    const list = lines.map((lines, i) => {
      const url = Links.textURL(lang, poet.id, lines.id);
      const line = lines[type === 'titles' ? 'title' : 'firstline'];
      return <div key={i}><a href={url}>{line}</a></div>;
    });
    const title = <PoetName poet={poet} includePeriod />;
    return (
      <div>
        <Head title="Digtere - Kalliope" />
        <Nav lang={lang} />

        <div className="row">
          <Heading title={title} />
          <Tabs items={tabs} selectedIndex={selectedTabIndex} />
          <div className="two-columns">
            {list}
          </div>
        </div>
      </div>
    );
  }
}
