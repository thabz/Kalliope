// @flow

import React from 'react';
import Link from 'next/link';
import Head from '../components/head';
import Nav from '../components/nav';
import LangSelect from '../components/langselect';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import TextContent from '../components/textcontent.js';
import SectionedList from '../components/sectionedlist.js';
import * as Links from '../components/links';
import type { Lang, Poet, Work } from './helpers/types.js';
import 'isomorphic-fetch';

export default class extends React.Component {
  props: {
    lang: Lang,
    poet: Poet,
    primary: Array<string>,
    secondary: Array<string>,
  };

  static async getInitialProps({
    query: { lang, poetId },
  }: {
    query: { lang: Lang, poetId: string },
  }) {
    const res = await fetch(
      `http://localhost:3000/static/api/${poetId}/bibliography.json`
    );
    const json: {
      poet: Poet,
      primary: Array<string>,
      secondary: Array<string>,
    } = await res.json();
    console.log(json.primary);
    return {
      lang,
      poet: json.poet,
      primary: json.primary || [],
      secondary: json.secondary || [],
    };
  }

  render() {
    const { lang, poet, primary, secondary } = this.props;

    const sections = [primary, secondary].map((list, i) => {
      return {
        title: i === 0 ? 'Primær litteratur' : 'Sekundær litteratur',
        items: list.map((line, j) => {
          return {
            id: '' + j,
            html: (
              <div
                style={{
                  marginBottom: '5px',
                  marginLeft: '20px',
                  textIndent: '-20px',
                }}>
                <TextContent key={j} contentHtml={line} lang={lang} />
              </div>
            ),
          };
        }),
      };
    });

    const title = <PoetName poet={poet} includePeriod />;
    return (
      <div>
        <Head title="Digtere - Kalliope" />
        <div className="row">
          <Nav lang={lang} poet={poet} title="Bibliografi" />
          <Heading title={title} subtitle="Bibliografi" />
          <PoetTabs lang={lang} poet={poet} selected="bibliography" />
          <SectionedList sections={sections} />
          <LangSelect lang={lang} />
        </div>
      </div>
    );
  }
}
