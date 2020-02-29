// @flow

import React from 'react';
import type { Node } from 'react';
import { Link } from '../routes';
import Page from '../components/page.js';
import { kalliopeCrumbs } from '../components/breadcrumbs.js';
import SidebarSplit from '../components/sidebarsplit.js';
import LangSelect from '../components/langselect';
import { kalliopeTabs } from '../components/menu.js';
import SubHeading from '../components/subheading.js';
import PoetName from '../components/poetname.js';
import TextName from '../components/textname.js';
import TextContent from '../components/textcontent.js';
import SidebarPictures from '../components/sidebarpictures.js';
import Picture from '../components/picture.js';
import { FootnoteContainer, FootnoteList } from '../components/footnotes.js';
import Note from '../components/note.js';
import * as Links from '../components/links';
import type { Lang, Keyword, Error } from '../common/types.js';
import * as Paths from '../common/paths.js';
import * as Client from '../common/client.js';
import { createURL } from '../common/client.js';
import * as OpenGraph from '../common/opengraph.js';
import ErrorPage from './error.js';
import _ from '../common/translations.js';

type KeywordComponentProps = {
  lang: Lang,
  keyword: Keyword,
  error?: Error,
};
const KeywordPage = (props: KeywordComponentProps) => {
  const { lang, keyword, error } = props;

  if (error != null) {
    return <ErrorPage error={error} lang={lang} message="Ukendt nøgleord" />;
  }
  const requestPath = `/${lang}/keyword/${keyword.id}`;

  const pictures = keyword.pictures.map((p, i) => {
    return (
      <Picture
        key={i}
        pictures={[p]}
        contentLang={p.content_lang || 'da'}
        lang={lang}
      />
    );
  });
  const renderedPictures = <SidebarPictures>{pictures}</SidebarPictures>;

  let sidebar: Array<Node> = [];

  if (keyword.has_footnotes || keyword.pictures.length > 0) {
    if (keyword.has_footnotes) {
      sidebar.push(<FootnoteList key="footnotelist" />);
    }
    if (keyword.pictures.length > 0) {
      sidebar.push(<div key="sidebarpictures">{renderedPictures}</div>);
    }
  }

  const crumbs = [
    ...kalliopeCrumbs(lang),
    { url: Links.keywordsURL(lang), title: _('Nøgleord', lang) },
    { title: keyword.title },
  ];
  const title = keyword.title;
  let author = null;
  if (keyword.author != null) {
    author = (
      <div style={{ fontSize: '16px', marginBottom: '40px' }}>
        Af {keyword.author}
      </div>
    );
  }
  const headTitle = `${keyword.title} - Kalliope`;
  const ogTitle = keyword.title;
  const ogDescription = OpenGraph.trimmedDescription(keyword.content_html);

  return (
    <Page
      headTitle={headTitle}
      ogTitle={ogTitle}
      ogDescription={ogDescription}
      requestPath={requestPath}
      crumbs={crumbs}
      pageTitle={title}
      menuItems={kalliopeTabs()}
      selectedMenuItem="keywords">
      <FootnoteContainer key={keyword.id}>
        <SidebarSplit sidebar={sidebar}>
          <div key="content">
            <article>
              <SubHeading>{keyword.title}</SubHeading>
              {author}
              <div style={{ lineHeight: 1.6, textAlign: 'justify' }}>
                <TextContent
                  contentHtml={keyword.content_html}
                  contentLang={keyword.content_lang}
                  lang={lang}
                />
              </div>
            </article>
          </div>
        </SidebarSplit>
      </FootnoteContainer>
    </Page>
  );
};

KeywordPage.getInitialProps = async ({
  query: { lang, keywordId },
}: {
  query: { lang: Lang, keywordId: string },
}) => {
  const json = await Client.keyword(keywordId);
  if (json == null) {
    return { lang, error: 'Ikke fundet', keyword: null };
  } else {
    return {
      lang,
      keyword: json,
    };
  }
};

export default KeywordPage;
