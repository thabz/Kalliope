// @flow

import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav from '../components/nav';
import LangSelect from '../components/langselect';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName, { poetNameString } from '../components/poetname.js';
import TextContent from '../components/textcontent.js';
import TwoColumns from '../components/twocolumns.js';
import * as Links from '../components/links';
import type { Lang, Poet, Work, TextContentType } from './helpers/types.js';
import { createURL } from './helpers/client.js';
import 'isomorphic-fetch';

export default class extends React.Component {
  props: {
    lang: Lang,
    poet: Poet,
    primary: Array<TextContentType>,
    secondary: Array<TextContentType>,
  };

  static async getInitialProps({
    query: { lang, poetId },
  }: {
    query: { lang: Lang, poetId: string },
  }) {
    const res = await fetch(
      createURL(`/static/api/${poetId}/bibliography.json`)
    );
    const json: {
      poet: Poet,
      primary: Array<string>,
      secondary: Array<string>,
    } = await res.json();
    return {
      lang,
      poet: json.poet,
      primary: json.primary || [],
      secondary: json.secondary || [],
    };
  }

  render() {
    const { lang, poet, primary, secondary } = this.props;

    const sections = [primary, secondary]
      .map((list, i) => {
        return {
          title: i === 0 ? 'Primær litteratur' : 'Sekundær litteratur',
          items: list.map((line, j) => {
            return (
              <div
                key={j}
                style={{
                  marginBottom: '5px',
                  marginLeft: '30px',
                  textIndent: '-30px',
                  breakInside: 'avoid',
                  lineHeight: 1.5,
                }}>
                <TextContent key={j} contentHtml={line} lang={lang} />
              </div>
            );
          }),
        };
      })
      .filter(g => g.items.length > 0)
      .map(g => {
        return (
          <div
            key={g.title}
            className="list-section"
            style={{ marginBottom: '20px' }}>
            <h3 style={{ columnSpan: 'all' }}>
              {g.title}
            </h3>
            {g.items}
            <style jsx>{`
              h3 {
                font-weight: lighter;
                font-size: 18px;
                border-bottom: 1px solid black;
              }
            `}</style>
          </div>
        );
      });

    const title = <PoetName poet={poet} includePeriod />;
    const headTitle = poetNameString(poet, false, false) + ' - Kalliope';
    return (
      <div>
        <Head headTitle={headTitle} />
        <Main>
          <Nav lang={lang} poet={poet} title="Bibliografi" />
          <Heading title={title} subtitle="Bibliografi" />
          <PoetTabs lang={lang} poet={poet} selected="bibliography" />
          <TwoColumns>
            {sections}
          </TwoColumns>
          <LangSelect lang={lang} />
        </Main>
      </div>
    );
  }
}
