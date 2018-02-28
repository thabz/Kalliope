// @flow

import React from 'react';
import { Link } from '../routes';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav from '../components/nav';
import SidebarSplit from '../components/sidebarsplit.js';
import LangSelect from '../components/langselect.js';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import SubHeading from '../components/subheading.js';
import PoetName, { poetNameString } from '../components/poetname.js';
import WorkName, { workTitleString } from '../components/workname.js';
import Note from '../components/note.js';
import TextContent from '../components/textcontent.js';
import SidebarPictures from '../components/sidebarpictures.js';
import ErrorPage from './error.js';
import * as Links from '../components/links';
import * as Client from './helpers/client.js';
import * as OpenGraph from './helpers/opengraph.js';
import CommonData from './helpers/commondata.js';
import { request } from 'http';
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

export default class extends React.Component {
  props: {
    lang: Lang,
    poet: Poet,
    work: Work,
    toc: Array<TocItem>,
    notes: Array<NoteItem>,
    pictures: Array<PictureItem>,
    error: ?Error,
  };

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
      notes: json.notes,
      pictures: json.pictures,
      error: json.error,
    };
  }

  render() {
    const { lang, poet, work, notes, pictures, toc, error } = this.props;

    if (error) {
      return <ErrorPage error={error} lang={lang} message="Ukendt værk" />;
    }
    const requestPath = `/${lang}/work/${poet.id}/${work.id}`;

    const renderItems = (items: Array<TocItem>, indent: number = 0) => {
      const rows = items.map((item, i) => {
        const { id, title, type, prefix } = item;
        if (type === 'section' && item.content != null) {
          const className = `level-${item.level || 1}`;
          return (
            <tr key={i}>
              <td />
              <td>
                <h3 className={className}>
                  <TextContent contentHtml={title} lang={lang} />
                </h3>
                {renderItems(item.content, indent + 1)}
              </td>
            </tr>
          );
        } else if (type === 'text' && id != null) {
          const url = Links.textURL(lang, id);
          const linkedTitle = (
            <Link route={url}>
              <a>
                <TextContent contentHtml={title} lang={lang} />
              </a>
            </Link>
          );
          return (
            <tr key={id}>
              <td className="num">{prefix}</td>
              <td>{linkedTitle}</td>
            </tr>
          );
        }
      });
      const className = `toc ${indent === 0 ? 'outer' : ''}`;
      return (
        <table className={className}>
          <tbody>{rows}</tbody>
        </table>
      );
    };

    const renderedNotes = notes.map((note, i) => {
      return <Note key={'note' + i} note={note} lang={lang} />;
    });

    const renderedPictures = (
      <SidebarPictures
        lang={lang}
        pictures={pictures}
        srcPrefix={`/static/images/${poet.id}`}
      />
    );
    const completedStatus =
      work.status === 'incomplete' && work.id !== 'andre' ? (
        <div>
          Kalliopes udgave af <WorkName work={work} cursive={true} /> er endnu
          ikke fuldstændig.
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
    const table =
      toc.length > 0 ? (
        renderItems(toc)
      ) : (
        <div className="nodata">
          <i>Kalliope indeholder endnu ingen tekster fra dette værk.</i>
        </div>
      );
    const title = <PoetName poet={poet} includePeriod />;
    const ogTitle =
      poetNameString(poet, false, false) + ': ' + workTitleString(work);
    const headTitle = `${workTitleString(work)} - ${poetNameString(
      poet
    )} - Kalliope`;
    const ogImage = OpenGraph.poetImage(poet);
    const ogDescription = toc.map(part => part.title).join(', ');
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
          <Nav lang={lang} poet={poet} title={<WorkName work={work} />} />
          <Heading title={title} subtitle="Værker" />
          <PoetTabs lang={lang} poet={poet} selected="works" />
          <SidebarSplit sidebar={sidebar}>
            <div>
              <SubHeading>
                <WorkName work={work} />
              </SubHeading>
              {table}
              <style jsx>{`
                :global(table.toc) {
                  margin-left: 30px;
                  margin-bottom: 10px;
                  cell-spacing: 0;
                  cell-padding: 0;
                  border-collapse: collapse;
                }
                :global(table.toc.outer) {
                  margin-left: 0;
                }
                :global(.toc) :global(h3.level-1) {
                  font-weight: lighter;
                  font-size: 18px;
                  padding: 0;
                  margin: 0;
                  margin-top: 10px;
                }
                :global(.toc) :global(h3.level-2) {
                  font-weight: lighter;
                  font-size: 16px;
                  padding: 0;
                  margin: 0;
                  margin-top: 0px;
                }
                :global(.toc) :global(h3.level-3) {
                  font-weight: lighter;
                  font-size: 14px;
                  padding: 0;
                  margin: 0;
                  margin-top: 0px;
                }
                :global(.toc) :global(td.num) {
                  text-align: right;
                  color: ${CommonData.lightLinkColor};
                  white-space: nowrap;
                  padding-right: 5px;
                  vertical-align: top;
                }
                :global(.toc) :global(td) {
                  line-height: 1.7;
                  padding: 0;
                }
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
