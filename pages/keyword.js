// @flow

import React from 'react';
import { Link } from '../routes';
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
import SidebarPictures from '../components/sidebarpictures.js';
import { FootnoteContainer, FootnoteList } from '../components/footnotes.js';
import Note from '../components/note.js';
import * as Links from '../components/links';
import type { Lang, Keyword } from './helpers/types.js';
import 'isomorphic-fetch';
import * as Paths from './helpers/paths.js';
import { createURL } from './helpers/client.js';

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
      createURL(`/static/api/keywords/${keywordId}.json`)
    );
    const keyword: Keyword = await res.json();
    return {
      lang,
      keyword,
    };
  }

  render() {
    const { lang, keyword } = this.props;

    const renderedPictures = (
      <SidebarPictures
        lang={lang}
        pictures={keyword.pictures}
        srcPrefix={'/static/images/keywords'}
      />
    );
    const sidebar = <div><FootnoteList />{renderedPictures}</div>;
    const body = <TextContent contentHtml={keyword.content_html} lang={lang} />;
    const navbar = [
      <Link route={Links.keywordsURL(lang)}>
        <a>Nøgleord</a>
      </Link>,
    ];
    const title = keyword.title;
    let author = null;
    if (keyword.author != null) {
      author = (
        <div style={{ fontVariant: 'small-caps', marginBottom: '40px' }}>
          Af {keyword.author}
        </div>
      );
    }
    return (
      <div>
        <FootnoteContainer>
          <Head title="Digtere - Kalliope" />
          <div className="row">
            <Nav lang={lang} links={navbar} title={keyword.title} />
            <Heading title={title} />
            <KalliopeTabs lang={lang} selected="keywords" />
            <SidebarSplit>
              <div>
                <SubHeading>{keyword.title}</SubHeading>
                {author}
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
