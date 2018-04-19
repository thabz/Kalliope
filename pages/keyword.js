// @flow

import React from 'react';
import { Link } from '../routes';
import Head from '../components/head';
import Main from '../components/main.js';
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
import * as Paths from './helpers/paths.js';
import * as Client from './helpers/client.js';
import { createURL } from './helpers/client.js';
import * as OpenGraph from './helpers/opengraph.js';
import ErrorPage from './error.js';
import _ from '../pages/helpers/translations.js';

type KeywordComponentProps = {
  lang: Lang,
  keyword: Keyword,
  error: ?Error,
};
export default class extends React.Component<KeywordComponentProps> {
  static async getInitialProps({
    query: { lang, keywordId },
  }: {
    query: { lang: Lang, keywordId: string },
  }) {
    const json = await Client.keyword(keywordId);
    return {
      lang,
      keyword: json,
      error: json.error,
    };
  }

  render() {
    const { lang, keyword, error } = this.props;

    if (error) {
      return <ErrorPage error={error} lang={lang} message="Ukendt nøgleord" />;
    }
    const requestPath = `/${lang}/keyword/${keyword.id}`;

    const renderedPictures = (
      <SidebarPictures
        lang={lang}
        pictures={keyword.pictures}
        srcPrefix={'/static/images/keywords'}
      />
    );
    let sidebar = [];
    if (keyword.has_footnotes || keyword.pictures.length > 0) {
      if (keyword.has_footnotes) {
        sidebar.push(<FootnoteList />);
      }
      if (keyword.pictures.length > 0) {
        sidebar.push(<div key="sidebarpictures">{renderedPictures}</div>);
      }
    }
    const body = (
      <TextContent
        contentHtml={keyword.content_html}
        contentLang={keyword.content_lang}
        lang={lang}
      />
    );
    const navbar = [
      <Link route={Links.keywordsURL(lang)}>
        <a>{_('Nøgleord', lang)}</a>
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
    const headTitle = `${keyword.title} - Kalliope`;
    const ogTitle = keyword.title;
    const ogDescription = OpenGraph.trimmedDescription(keyword.content_html);

    return (
      <div>
        <FootnoteContainer>
          <Head
            headTitle={headTitle}
            ogTitle={ogTitle}
            description={ogDescription}
            requestPath={requestPath}
          />
          <Main>
            <Nav lang={lang} links={navbar} title={keyword.title} />
            <Heading title={title} />
            <KalliopeTabs lang={lang} selected="keywords" />
            <SidebarSplit sidebar={sidebar}>
              <div key="content">
                <article>
                  <SubHeading>{keyword.title}</SubHeading>
                  {author}
                  <div style={{ lineHeight: 1.6 }}>{body}</div>
                </article>
              </div>
            </SidebarSplit>
            <LangSelect lang={lang} path={requestPath} />
          </Main>
        </FootnoteContainer>
      </div>
    );
  }
}
