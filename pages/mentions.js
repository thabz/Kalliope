// @flow

import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav, { poetCrumbsWithTitle } from '../components/nav';
import _ from '../pages/helpers/translations.js';
import LangSelect from '../components/langselect';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import { poetNameString } from '../components/poetname-helpers.js';
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

const sectionTitle = (sectionType, lang) => {
  switch (sectionType) {
    case 'mentions':
      return _('Omtaler', lang);
    case 'translations':
      return _('Oversættelser', lang);
    case 'primary':
      _('Primær litteratur', lang);
    case 'secondary':
      _('Sekundær litteratur', lang);
    default:
      return 'Ukendt sektion ' + sectionType;
  }
};

class Section extends React.Component {
  render() {
    const { title, items } = this.props;
    return (
      <div className="list-section" style={{ marginBottom: '20px' }}>
        <h3 style={{ columnSpan: 'all' }}>{title}</h3>
        {items}
        <style jsx>{`
          h3 {
            font-weight: normal;
            font-size: 18px;
            border-bottom: 1px solid black;
          }
        `}</style>
      </div>
    );
  }
}

class TranslationsSection extends React.Component {
  render() {
    const { translations, lang } = this.props;
    return <Section title={sectionTitle('translations', lang)} items={[]} />;
  }
}

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
    const sections = ['mentions', 'primary', 'secondary']
      .map((section, i) => {
        return {
          title: sectionTitle(section, lang),
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
                <TextContent
                  key={j}
                  contentHtml={line}
                  lang={lang}
                  contentLang="da"
                />
              </div>
            );
          }),
        };
      })
      .filter(g => g.items.length > 0)
      .map(g => {
        return <Section title={g.title} items={g.items} key={g.title} />;
      });

    sections.push(
      <TranslationsSection
        translations={translations}
        lang={lang}
        key={'translations'}
      />
    );

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
