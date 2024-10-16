// @flow

import React, { useContext } from 'react';
import type Node from 'react';
import { Link } from '../routes';
import Page from '../components/page.js';
import { kalliopeMenu } from '../components/menu.js';
import LangSelect from '../components/langselect';
import { kalliopeCrumbs } from '../components/breadcrumbs.js';
import SubHeading from '../components/subheading.js';
import SidebarSplit from '../components/sidebarsplit.js';
import TwoColumns from '../components/twocolumns.js';
import SidebarPictures from '../components/sidebarpictures.js';
import Picture from '../components/picture.js';
import Note from '../components/note.js';
import * as Links from '../components/links';
import * as Client from '../common/client.js';
import TextContent from '../components/textcontent.js';
import ErrorPage from './error.js';
import LangContext from '../common/LangContext.js';
import type {
  Lang,
  NewsItem,
  TextContentType,
  AboutItem,
  Error,
} from '../common/types.js';
import { createURL } from '../common/client.js';

// Koden er stort set identisk med keyword

type AboutProps = {
  lang: Lang,
  keyword: AboutItem,
  aboutItemId: string,
  error: ?Error,
};
const About = (props: AboutProps) => {
  const { aboutItemId, keyword, error } = props;
  const lang = useContext(LangContext);

  if (error) {
    return <ErrorPage error={error} lang={lang} message="Ukendt nøgleord" />;
  }

  const pictures = keyword.pictures.map((p, i) => {
    return (
      <Picture
        key={'pic' + i}
        pictures={[p]}
        contentLang={p.content_lang || 'da'}
        showDropShadow={aboutItemId !== 'kalliope'}
        clickToZoom={aboutItemId !== 'kalliope'}
        lang={lang}
      />
    );
  });
  const renderedPictures = (
    <SidebarPictures key="pictures">{pictures}</SidebarPictures>
  );
  const renderedNotes = keyword.notes.map((note, i) => {
    return (
      <Note key={'note' + i}>
        <TextContent
          key="notes"
          contentHtml={note.content_html}
          contentLang={note.content_lang}
        />
      </Note>
    );
  });
  let sidebar: Array<Node> = [];
  if (keyword.notes.length > 0 || keyword.pictures.length > 0) {
    if (keyword.pictures.length > 0) {
      sidebar = sidebar.concat(renderedPictures);
    }
    if (keyword.notes.length > 0) {
      sidebar = sidebar.concat(renderedNotes);
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
      <div style={{ fontSize: '16px', marginBottom: '40px' }}>
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
    <Page
      headTitle={'Kalliope'}
      requestPath={`/${lang}/about/${aboutItemId}`}
      crumbs={crumbs}
      pageTitle={'Kalliope'}
      menuItems={kalliopeMenu()}
      selectedMenuItem="about">
      {pageBody}
    </Page>
  );
};

About.getInitialProps = async ({
  query: { lang, aboutItemId },
}: {
  query: { lang: Lang, aboutItemId: string },
}) => {
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
};

export default About;
