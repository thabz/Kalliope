import { useContext } from 'react';
import * as Client from '../common/client.js';
import LangContext from '../common/LangContext.js';
import _ from '../common/translations.js';
import { kalliopeCrumbs } from '../components/breadcrumbs.js';
import * as Links from '../components/links.js';
import { kalliopeMenu } from '../components/menu.js';
import Note from '../components/note.js';
import Page from '../components/page.js';
import PageLead from '../components/pagelead.js';
import SidebarPictures from '../components/sidebarpictures.js';
import SidebarSplit from '../components/sidebarsplit.js';
import SubHeading from '../components/subheading.js';
import TextContent from '../components/textcontent.js';
import TwoColumns from '../components/twocolumns.js';
import ErrorPage from './error.js';

// Koden er stort set identisk med keyword

const About = (props) => {
  const { aboutItemId, keyword, error } = props;
  const lang = useContext(LangContext);

  if (error) {
    return <ErrorPage error={error} lang={lang} message="Ukendt nøgleord" />;
  }

  const renderedPictures = (
    <SidebarPictures
      key="pictures"
      pictures={keyword.pictures}
      showDropShadow={aboutItemId !== 'kalliope'}
      clickToZoom={aboutItemId !== 'kalliope'}
      lang={lang}
    />
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
  let sidebar = [];
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
    { url: Links.aboutURL(lang, 'kalliope'), title: _('Om', lang) },
    { title: keyword.title },
  ];
  let author = null;
  if (keyword.author != null) {
    author = (
      <div style={{ fontSize: '16px', marginBottom: '40px' }}>
        {_('Af', lang)} {keyword.author}
      </div>
    );
  }

  let pageBody = null;
  if (aboutItemId === 'thanks') {
    pageBody = (
      <div className="thanks-list">
        <SubHeading>{keyword.title}</SubHeading>
        <PageLead>
          {_(
            'Kalliope er gennem årene blevet til med hjælp fra mange læsere og bidragydere. Her takker vi dem, der har sendt digte, billeder, oplysninger og rettelser eller på anden måde har hjulpet samlingen.',
            lang
          )}
        </PageLead>
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

About.getInitialProps = async ({ query: { lang, aboutItemId } }) => {
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
