// @flow

import React from 'react';
import Link from 'next/link';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav, { kalliopeCrumbs } from '../components/nav';
import SidebarSplit from '../components/sidebarsplit.js';
import LangSelect from '../components/langselect';
import { KalliopeTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import SubHeading from '../components/subheading.js';
import TextContent from '../components/textcontent.js';
import { FootnoteContainer, FootnoteList } from '../components/footnotes.js';
import Note from '../components/note.js';
import ErrorPage from './error.js';
import * as Links from '../components/links';
import type { Lang, DictItem, Error } from './helpers/types.js';
import * as Client from './helpers/client.js';
import * as Paths from './helpers/paths.js';
import { createURL } from './helpers/client.js';

export default class extends React.Component {
  props: {
    lang: Lang,
    item: DictItem,
    error: ?Error,
  };

  static async getInitialProps({
    query: { lang, dictItemId },
  }: {
    query: { lang: Lang, dictItemId: string },
  }) {
    const json = await Client.dictItem(dictItemId);
    return {
      lang,
      item: json.item,
      error: json.error,
    };
  }

  render() {
    const { lang, item, error } = this.props;

    if (error) {
      return <ErrorPage error={error} lang={lang} message="Ukendt ord" />;
    }
    const requestPath = `/${lang}/dict/${item.id}`;

    const sidebar = item.has_footnotes ? (
      <div>
        <FootnoteList />
      </div>
    ) : null;
    const body = <TextContent contentHtml={item.content_html} lang={lang} />;
    let variants, phrase;
    if (item.variants != null && item.variants.length > 0) {
      variants = (
        <div style={{ marginBottom: '10px' }}>
          <b>Varianter: </b>
          {item.variants.join(', ')}
        </div>
      );
    }
    if (item.phrase != null) {
      phrase = (
        <div style={{ marginBottom: '10px' }}>
          <b>Frase: </b>
          {item.phrase}
        </div>
      );
    }
    const crumbs = [
      ...kalliopeCrumbs(lang),
      { url: Links.dictionaryURL(lang), title: 'Ordbog' },
      { title: item.title },
    ];
    const title = item.title;
    const headTitle = `${item.title} - Kalliope`;
    return (
      <div>
        <FootnoteContainer key={item.id}>
          <Head headTitle={headTitle} requestPath={requestPath} />
          <Main>
            <Nav lang={lang} crumbs={crumbs} />
            <Heading title={title} />
            <KalliopeTabs lang={lang} selected="dictionary" />
            <SidebarSplit sidebar={sidebar}>
              <div>
                <SubHeading>{item.title}</SubHeading>
                {variants}
                {phrase}
                <div style={{ lineHeight: 1.6 }}>{body}</div>
              </div>
            </SidebarSplit>
            <LangSelect lang={lang} path={requestPath} />
          </Main>
        </FootnoteContainer>
      </div>
    );
  }
}
