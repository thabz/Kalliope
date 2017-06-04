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
import PoetName from '../components/poetname.js';
import TextName from '../components/textname.js';
import TextContent from '../components/textcontent.js';
import { FootnoteContainer, FootnoteList } from '../components/footnotes.js';
import Note from '../components/note.js';
import * as Links from '../components/links';
import type { Lang, Keyword } from './helpers/types.js';
import 'isomorphic-fetch';
import * as Paths from './helpers/paths.js';

export default class extends React.Component {
  props: {
    lang: Lang,
    keyword: Keyword,
  };

  static async getInitialProps({
    query: { lang, keywordId },
  }: {
    query: { lang: Lang, keywordId: string },
  }) {
    const res = await fetch(
      `http://localhost:3000/static/api/keywords/${keywordId}.json`
    );
    const keyword: Keyword = await res.json();
    return {
      lang,
      keyword,
    };
  }

  render() {
    const { lang, keyword } = this.props;

    const sidebar = <div><FootnoteList /></div>;
    const body = <TextContent contentHtml={keyword.content_html} lang={lang} />;

    const title = keyword.title;
    return (
      <div>
        <FootnoteContainer>
          <Head title="Digtere - Kalliope" />
          <div className="row">
            <Nav lang={lang} title={keyword.title} />
            <Heading title={title} />
            <KalliopeTabs lang={lang} selected="keywords" />
            <SidebarSplit>
              <div>
                <SubHeading>{keyword.title}</SubHeading>
                <div className="text-content">
                  {body}
                  <style jsx>{`
                  .text-content {
                    font-family: "Palatino", "Georgia", serif;
                    line-height: 1.5;
                    font-size: 1.15em;
                  }
                  .text-content sc {
                    font-variant: small-caps;
                  }
              `}</style>
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
