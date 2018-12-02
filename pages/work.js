// @flow

import React from 'react';
import { Link } from '../routes';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav, { workCrumbs } from '../components/nav';
import SidebarSplit from '../components/sidebarsplit.js';
import LangSelect from '../components/langselect.js';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import SubHeading from '../components/subheading.js';
import PoetName, { poetNameString } from '../components/poetname.js';
import WorkName, { workTitleString } from '../components/workname.js';
import WorkSubtitles from '../components/worksubtitles.js';
import Note from '../components/note.js';
import TOC from '../components/toc.js';
import TextContent from '../components/textcontent.js';
import SidebarPictures from '../components/sidebarpictures.js';
import Picture from '../components/picture.js';
import ErrorPage from './error.js';
import * as Links from '../components/links';
import * as Client from './helpers/client.js';
import * as OpenGraph from './helpers/opengraph.js';
import CommonData from './helpers/commondata.js';
import { request } from 'http';
import WorksList from '../components/workslist';
import type {
  Lang,
  Poet,
  PoetId,
  WorkId,
  Work,
  TocItem,
  NoteItem,
  PictureItem,
  Error,
} from './helpers/types.js';

type WorkProps = {
  lang: Lang,
  poet: Poet,
  work: Work,
  toc: Array<TocItem>,
  subworks: Array<Work>,
  notes: Array<NoteItem>,
  pictures: Array<PictureItem>,
  error: ?Error,
};
export default class extends React.Component<WorkProps> {
  static async getInitialProps({
    query: { lang, poetId, workId },
  }: {
    query: { lang: Lang, poetId: PoetId, workId: WorkId },
  }) {
    const json = await Client.work(poetId, workId);
    return {
      lang,
      poet: json.poet,
      work: json.work,
      toc: json.toc,
      subworks: json.subworks,
      notes: json.notes,
      pictures: json.pictures,
      error: json.error,
    };
  }

  render() {
    const {
      lang,
      poet,
      work,
      notes,
      pictures,
      toc,
      subworks,
      error,
    } = this.props;

    if (error) {
      return <ErrorPage error={error} lang={lang} message="Ukendt værk" />;
    }
    const requestPath = `/${lang}/work/${poet.id}/${work.id}`;

    const renderedNotes = notes.map((note, i) => {
      return <Note key={'note' + i} note={note} lang={lang} />;
    });

    const workPictures = pictures.map((p, i) => {
      return (
        <Picture
          pictures={[p]}
          key={'picture' + i}
          contentLang={p.content_lang || 'da'}
          lang={lang}
        />
      );
    });
    const renderedPictures = <SidebarPictures>{workPictures}</SidebarPictures>;
    const completedStatus =
      work.status === 'incomplete' && work.id !== 'andre' ? (
        <div>
          Kalliopes udgave af{' '}
          <WorkName work={work} cursive={true} lang={lang} /> er endnu ikke
          fuldstændig.
        </div>
      ) : null;
    let sidebar = null;
    if (pictures.length > 0 || notes.length > 0 || completedStatus != null) {
      sidebar = (
        <div>
          {renderedPictures}
          {renderedNotes}
          {completedStatus}
        </div>
      );
    }
    let table = null;
    if (toc != null && toc.length > 0) {
      table = <TOC toc={toc} lang={lang} />;
    } else if (subworks != null && subworks.length > 0) {
      table = <WorksList lang={lang} poet={poet} works={subworks} />;
    } else {
      table = (
        <div className="nodata">
          <i>Kalliope indeholder endnu ingen tekster fra dette værk.</i>
        </div>
      );
    }
    const title = <PoetName poet={poet} includePeriod />;
    const ogTitle =
      poetNameString(poet, false, false) + ': ' + workTitleString(work);
    const headTitle = `${workTitleString(work)} - ${poetNameString(
      poet
    )} - Kalliope`;
    const ogImage = OpenGraph.poetImage(poet);
    let ogDescription = null;
    if (toc != null && toc.length > 0) {
      ogDescription = toc.map(part => part.title).join(', ');
    } else if (subworks != null && subworks.length > 0) {
      ogDescription = subworks.map(part => part.toctitle).join(', ');
    }

    let sectionTitles = null;

    return (
      <div>
        <Head
          requestPath={requestPath}
          headTitle={headTitle}
          ogTitle={ogTitle}
          ogImage={ogImage}
          description={ogDescription}
        />

        <Main>
          <Nav lang={lang} crumbs={workCrumbs(lang, poet, work)} />
          <Heading title={title} subtitle="Værker" />
          <PoetTabs lang={lang} poet={poet} selected="works" />
          <SidebarSplit sidebar={sidebar}>
            <div>
              <SubHeading>
                <WorkName work={work} lang={lang} />
                <WorkSubtitles work={work} lang={lang} />
              </SubHeading>
              {table}
              <style jsx>{`
                :global(.nodata) {
                  padding: 30px 0;
                  font-weight: lighter;
                }
              `}</style>
            </div>
          </SidebarSplit>
          <LangSelect lang={lang} path={requestPath} />
        </Main>
      </div>
    );
  }
}
