// @flow

import React from 'react';
import Link from 'next/link';
import Head from '../components/head';
import Nav from '../components/nav';
import SidebarSplit from '../components/sidebarsplit.js';
import LangSelect from '../components/langselect.js';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import SubHeading from '../components/subheading.js';
import PoetName from '../components/poetname.js';
import WorkName from '../components/workname.js';
import Note from '../components/note.js';
import * as Links from '../components/links';
import type {
  Lang,
  Poet,
  Work,
  TocItem,
  NoteItem,
  PictureItem,
} from './helpers/types.js';
import 'isomorphic-fetch';

export default class extends React.Component {
  props: {
    lang: Lang,
    poet: Poet,
    work: Work,
    toc: Array<TocItem>,
    notes: Array<NoteItem>,
    pictures: Array<PictureItem>,
  };

  static async getInitialProps({
    query: { lang, poetId, workId },
  }: {
    query: { lang: Lang, poetId: string, workId: string },
  }) {
    const res = await fetch(
      `http://localhost:3000/static/api/${poetId}/${workId}-toc.json`
    );
    const json: {
      poet: Poet,
      work: Work,
      toc: Array<TocItem>,
      notes: Array<NoteItem>,
      pictures: Array<PictureItem>,
    } = await res.json();
    return {
      lang,
      poet: json.poet,
      work: json.work,
      toc: json.toc,
      notes: json.notes,
      pictures: json.pictures,
    };
  }

  render() {
    const { lang, poet, work, notes, pictures, toc } = this.props;

    const renderItems = (items: Array<TocItem>, indent: number = 0) => {
      const rows = items.map((item, i) => {
        const { id, title, type, prefix } = item;
        if (type === 'section' && item.content != null) {
          return (
            <tr key={i}>
              <td />
              <td>
                <h3>{title}</h3>
                {renderItems(item.content, indent + 1)}
              </td>
            </tr>
          );
        } else if (type === 'text' && id != null) {
          const url = Links.textURL(lang, id);
          const linkedTitle = <a href={url}>{title}</a>;
          return (
            <tr key={id}>
              <td className="num">{prefix}</td><td>{linkedTitle}</td>
            </tr>
          );
        }
      });
      const className = `toc ${indent === 0 ? 'outer' : null}`;
      return <table className={className}><tbody>{rows}</tbody></table>;
    };

    const renderedNotes = notes.map((note, i) => {
      return <Note key={i} note={note} />;
    });

    const sidebar = <div>{renderedNotes}</div>;
    const table = renderItems(toc);
    const title = <PoetName poet={poet} includePeriod />;
    return (
      <div>
        <Head title="Digtere - Kalliope" />
        <div className="row">
          <Nav lang={lang} poet={poet} title={<WorkName work={work} />} />
          <Heading title={title} subtitle="Værker" />
          <PoetTabs lang={lang} poet={poet} selected="works" />
          <SidebarSplit>
            <div>
              <SubHeading><WorkName work={work} /></SubHeading>
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
                :global(.toc) :global(h3) {
                  font-weight: lighter;
                  font-size: 18px;
                  padding: 0;
                  margin: 0;
                  margin-top: 10px;
                }
                :global(.toc) :global(td.num) {
                  text-align: right;
                  color: rgb(139, 56, 65);
                  opacity: 0.5;
                  white-space: nowrap;
                  padding-right: 5px;
                }
                :global(.toc) :global(td) {
                  line-height: 1.7;
                  padding: 0;
                }
            `}</style>
            </div>
            <div>{sidebar}</div>
          </SidebarSplit>
          <LangSelect lang={lang} />
        </div>
      </div>
    );
  }
}
