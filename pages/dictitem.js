// @flow

import React from 'react';
import Link from 'next/link';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav from '../components/nav';
import SidebarSplit from '../components/sidebarsplit.js';
import LangSelect from '../components/langselect';
import { KalliopeTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import SubHeading from '../components/subheading.js';
import TextContent from '../components/textcontent.js';
import { FootnoteContainer, FootnoteList } from '../components/footnotes.js';
import Note from '../components/note.js';
import * as Links from '../components/links';
import type { Lang, DictItem } from './helpers/types.js';
import 'isomorphic-fetch';
import * as Paths from './helpers/paths.js';
import { createURL } from './helpers/client.js';

export default class extends React.Component {
  props: {
    lang: Lang,
    item: DictItem,
  };

  static async getInitialProps({
    query: { lang, dictItemId },
  }: {
    query: { lang: Lang, dictItemId: string },
  }) {
    const res = await fetch(createURL(`/static/api/dict/${dictItemId}.json`));
    const item: DictItem = await res.json();
    return {
      lang,
      item,
    };
  }

  render() {
    const { lang, item } = this.props;

    const sidebar = item.has_footnotes ? <div><FootnoteList /></div> : null;
    const body = <TextContent contentHtml={item.content_html} lang={lang} />;
    let variants, phrase;
    if (item.variants != null && item.variants.length > 0) {
      variants = (
        <div style={{ marginBottom: '10px' }}>
          <b>Varianter: </b>{item.variants.join(', ')}
        </div>
      );
    }
    if (item.phrase != null) {
      phrase = (
        <div style={{ marginBottom: '10px' }}><b>Frase: </b>{item.phrase}</div>
      );
    }
    const navbar = [
      <Link href={Links.dictionaryURL(lang)}><a>Ordbog</a></Link>,
    ];
    const title = item.title;
    const headTitle = `${item.title} - Kalliope`;
    return (
      <div>
        <FootnoteContainer>
          <Head headTitle={headTitle} />
          <Main>
            <Nav lang={lang} links={navbar} title={item.title} />
            <Heading title={title} />
            <KalliopeTabs lang={lang} selected="dictionary" />
            <SidebarSplit sidebar={sidebar}>
              <div>
                <SubHeading>{item.title}</SubHeading>
                {variants}
                {phrase}
                <div style={{ lineHeight: 1.6 }}>
                  {body}
                </div>
              </div>
            </SidebarSplit>
            <LangSelect lang={lang} />
          </Main>
        </FootnoteContainer>
      </div>
    );
  }
}
