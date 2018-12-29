// @flow

import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav, { poetCrumbsWithTitle } from '../components/nav';
import _ from '../pages/helpers/translations.js';
import LangSelect from '../components/langselect';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName, { poetNameString } from '../components/poetname.js';
import TextContent from '../components/textcontent.js';
import TwoColumns from '../components/twocolumns.js';
import ErrorPage from './error.js';
import * as Links from '../components/links';
import * as Client from './helpers/client.js';
import type {
  Lang,
  Poet,
  Work,
  TextContentType,
  Error,
} from './helpers/types.js';
import { createURL } from './helpers/client.js';

type MentionsProps = {
  lang: Lang,
  poet: Poet,
  mentions: Array<TextContentType>,
  translations: Array<TextContentType>,
  primary: Array<TextContentType>,
  secondary: Array<TextContentType>,
  error: ?Error,
};
export default class extends React.Component<MentionsProps> {
  static async getInitialProps({
    query: { lang, poetId },
  }: {
    query: { lang: Lang, poetId: string },
  }) {
    const json = await Client.mentions(poetId);
    return {
      lang,
      poet: json.poet,
      mentions: json.mentions || [],
      translations: json.translations || [],
      primary: json.primary || [],
      secondary: json.secondary || [],
      error: json.error,
    };
  }

  render() {
    const {
      lang,
      poet,
      mentions,
      translations,
      primary,
      secondary,
      error,
    } = this.props;

    if (error != null) {
      return <ErrorPage error={error} lang={lang} message="Ukendt person" />;
    }
    const requestPath = `/${lang}/mentions/${poet.id}`;
    const titles = {
      mentions: _('Omtaler', lang),
      translations: _('Oversættelser', lang),
      primary: _('Primær litteratur', lang),
      secondary: _('Sekundær litteratur', lang),
    };
    const sections = ['mentions', 'translations', 'primary', 'secondary']
      .map((section, i) => {
        return {
          title: titles[section],
          items: this.props[section].map((line, j) => {
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
            <h3 style={{ columnSpan: 'all' }}>{g.title}</h3>
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
        <Head headTitle={headTitle} requestPath={requestPath} />
        <Main>
          <Nav
            lang={lang}
            crumbs={poetCrumbsWithTitle(lang, poet, _('Henvisninger', lang))}
          />
          <Heading title={title} subtitle={_('Henvisninger', lang)} />
          <PoetTabs lang={lang} poet={poet} selected="mentions" />
          <TwoColumns>{sections}</TwoColumns>
          <LangSelect lang={lang} path={requestPath} />
        </Main>
      </div>
    );
  }
}
