// @flow

import React from 'react';
import Link from 'next/link';
import Head from '../components/head';
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
    const res = await fetch(
      `http://localhost:3000/static/api/dict/${dictItemId}.json`
    );
    const item: DictItem = await res.json();
    return {
      lang,
      item,
    };
  }

  render() {
    const { lang, item } = this.props;

    const sidebar = <div><FootnoteList /></div>;
    const body = <TextContent contentHtml={item.content_html} lang={lang} />;
    const navbar = [<a href={Links.dictionaryURL(lang)}>Ordbog</a>];
    const title = item.title;
    return (
      <div>
        <FootnoteContainer>
          <Head title="Digtere - Kalliope" />
          <div className="row">
            <Nav lang={lang} links={navbar} title={item.title} />
            <Heading title={title} />
            <KalliopeTabs lang={lang} selected="dictionary" />
            <SidebarSplit>
              <div>
                <SubHeading>{item.title}</SubHeading>
                <div style={{ lineHeight: 1.6 }}>
                  {body}
                </div>
              </div>
              <div>{sidebar}</div>
            </SidebarSplit>
            <LangSelect lang={lang} />
          </div>
        </FootnoteContainer>
      </div>
    );
  }
}
