// @flow

import React from 'react';
import { Link } from '../routes';
import Head from '../components/head';
import Main from '../components/main.js';
import { KalliopeTabs } from '../components/tabs.js';
import LangSelect from '../components/langselect';
import Nav, { kalliopeCrumbs } from '../components/nav';
import SubHeading from '../components/subheading.js';
import SidebarSplit from '../components/sidebarsplit.js';
import TwoColumns from '../components/twocolumns.js';
import SidebarPictures from '../components/sidebarpictures.js';
import Picture from '../components/picture.js';
import Note from '../components/note.js';
import * as Links from '../components/links';
import * as Client from './helpers/client.js';
import Heading from '../components/heading.js';
import TextContent from '../components/textcontent.js';
import ErrorPage from './error.js';
import type {
  Lang,
  NewsItem,
  TextContentType,
  AboutItem,
  Error,
} from './helpers/types.js';
import { createURL } from './helpers/client.js';

// Koden er stort set identisk med keyword

type AboutProps = {
  lang: Lang,
  keyword: AboutItem,
  aboutItemId: string,
  error: ?Error,
};
export default class About extends React.Component<AboutProps> {
  static async getInitialProps({
    query: { lang, aboutItemId },
  }: {
    query: { lang: Lang, aboutItemId: string },
  }) {
    if (lang == null) {
      lang = 'da';
    }

    const json = await Client.about(aboutItemId, lang);
    return {
      lang,
      aboutItemId,
      keyword: json,
      error: json.error,
    };
  }

  render() {
    const { lang, aboutItemId, keyword, error } = this.props;

    if (error) {
      return <ErrorPage error={error} lang={lang} message="Ukendt nøgleord" />;
    }
    const requestPath = `/${lang}/about/${aboutItemId}`;
    const pictures = keyword.pictures.map(p => {
      return (
        <Picture
          pictures={[p]}
          contentLang={p.content_lang || 'da'}
          showDropShadow={aboutItemId !== 'kalliope'}
          clickToZoom={aboutItemId !== 'kalliope'}
          lang={lang}
        />
      );
    });
    const renderedPictures = <SidebarPictures>{pictures}</SidebarPictures>;
    const renderedNotes = keyword.notes.map((note, i) => {
      return <Note key={i} note={note} lang={lang} />;
    });
    let sidebar = [];
    if (keyword.has_footnotes || keyword.pictures.length > 0) {
      if (keyword.pictures.length > 0) {
        sidebar.push(renderedPictures);
      }
      if (keyword.notes.length > 0) {
        sidebar.push(renderedNotes);
      }
    }
    const body = (
      <TextContent
        contentHtml={keyword.content_html}
        contentLang={keyword.content_lang}
        lang={lang}
      />
    );
    const crumbs = [
      ...kalliopeCrumbs(lang),
      { url: Links.aboutURL(lang, 'kalliope'), title: 'Om' },
      { title: keyword.title },
    ];
    let author = null;
    if (keyword.author != null) {
      author = (
        <div style={{ fontVariant: 'small-caps', marginBottom: '40px' }}>
          Af {keyword.author}
        </div>
      );
    }

    let pageBody = null;
    if (aboutItemId === 'thanks') {
      pageBody = (
        <div className="thanks-list">
          <SubHeading>{keyword.title}</SubHeading>
          <TwoColumns>{body}</TwoColumns>
          <style jsx>{`
            .thanks-list {
              line-height: 1.7;
            }
          `}</style>
        </div>
      );
    } else {
      pageBody = (
        <SidebarSplit sidebar={sidebar}>
          <div>
            <SubHeading>{keyword.title}</SubHeading>
            {author}
            <div className="about-body">{body}</div>
            <style jsx>{`
              .about-body {
                line-height: 1.6;
              }
            `}</style>
          </div>
          <div />
        </SidebarSplit>
      );
    }

    return (
      <div>
        <Head headTitle="Kalliope" requestPath={requestPath} />
        <Main>
          <Nav lang="da" crumbs={crumbs} />
          <Heading title="Kalliope" />
          <KalliopeTabs lang={lang} selected="about" />
          {pageBody}
          <LangSelect lang={lang} path={requestPath} />
        </Main>
      </div>
    );
  }
}
