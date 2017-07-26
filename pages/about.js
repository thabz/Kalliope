// @flow

import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import { KalliopeTabs } from '../components/tabs.js';
import LangSelect from '../components/langselect';
import Nav from '../components/nav';
import SidebarSplit from '../components/sidebarsplit.js';
import * as Links from '../components/links';
import Heading from '../components/heading.js';
import TextContent from '../components/textcontent.js';
import type { Lang, NewsItem } from './helpers/types.js';
import { createURL } from './helpers/client.js';
import 'isomorphic-fetch';

export default class extends React.Component {
  props: {
    lang: Lang,
    news: Array<NewsItem>,
  };

  static async getInitialProps({
    query: { lang, aboutItemId },
  }: {
    query: { lang: Lang, aboutItemId: string },
  }) {
    if (lang == null) {
      lang = 'da';
    }
    const res = await fetch(
      createURL(`/static/api/about/${aboutItemId}_${lang}.json`)
    );
    const item = await res.json();
    return { lang, item };
  }

  render() {
    const { lang, item } = this.props;

    const renderedAbout = (
      <TextContent contentHtml={item.content_html} lang={lang} />
    );

    return (
      <div>
        <Head headTitle="Kalliope" />
        <Main>
          <Nav lang="da" />
          <Heading title="Kalliope" />
          <KalliopeTabs lang={lang} selected="about" />
          <SidebarSplit>
            <div>
              {renderedAbout}
            </div>
            <div />
          </SidebarSplit>
          <LangSelect lang={lang} />
        </Main>
      </div>
    );
  }
}
