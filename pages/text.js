// @flow

import React from 'react';
import Link from 'next/link';
import Head from '../components/head';
import Nav from '../components/nav';
import SidebarSplit from '../components/sidebarsplit.js';
import LangSelect from '../components/langselect';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import SubHeading from '../components/subheading.js';
import PoetName from '../components/poetname.js';
import TextName from '../components/textname.js';
import TextContent from '../components/textcontent.js';
import { FootnoteContainer, FootnoteList } from '../components/footnotes.js';
import Note from '../components/note.js';
import * as Links from '../components/links';
import type { Lang, Poet, Work, Text } from './helpers/types.js';
import 'isomorphic-fetch';
import * as Paths from './helpers/paths.js';

class TextHeading extends React.Component {
  props: { text: Text, lang: Lang };
  render() {
    const { text, lang } = this.props;

    let subtitles = null;
    if (text.subtitles != null) {
      subtitles = text.subtitles.map(t => {
        return <h4><TextContent contentHtml={t} lang={lang} /></h4>;
      });
    }
    return (
      <div className="text-heading">
        <h2><TextName text={text} /></h2>
        {subtitles}
        <style jsx>{`
        .text-heading :global(h2) {
          line-height: 1.5;
          font-size: 1.4em;
          font-weight: normal;
          margin: 0 0 20px 0;
          font-style: italic;
        }
        .text-heading :global(h4) {
          line-height: 1.5;
          font-size: 1.2em;
          font-weight: normal;
          font-size: 1.0em;
          margin: 0;
          min-height: 1em;
        }
        .text-heading {
          margin-bottom: 30px;
        }
    `}</style>
      </div>
    );
  }
}

export default class extends React.Component {
  props: {
    lang: Lang,
    poet: Poet,
    work: Work,
    text: Text,
  };

  static async getInitialProps({
    query: { lang, textId },
  }: {
    query: { lang: Lang, textId: string },
  }) {
    const path = Paths.textPath(textId);
    const res = await fetch(`http://localhost:3000/${path}`);
    const json: {
      poet: Poet,
      work: Work,
      text: Text,
    } = await res.json();
    return {
      lang,
      poet: json.poet,
      work: json.work,
      text: json.text,
    };
  }

  render() {
    const { lang, poet, work, text } = this.props;

    const renderedNotes = text.notes.map((note, i) => {
      return <Note key={i} note={note} />;
    });
    const sidebar = <div>{renderedNotes}<FootnoteList /></div>;
    const options = {
      isBibleVerses: poet.id === 'bibel',
    };
    const body = (
      <TextContent
        contentHtml={text.content_html}
        lang={lang}
        options={options}
      />
    );

    const title = <PoetName poet={poet} includePeriod />;
    return (
      <div>
        <FootnoteContainer>
          <Head title="Digtere - Kalliope" />
          <div className="row">
            <Nav
              lang={lang}
              poet={poet}
              work={work}
              title={<TextName text={text} />}
            />
            <Heading title={title} subtitle="Værker" />
            <PoetTabs lang={lang} poet={poet} selected="works" />
            <SidebarSplit>
              <div>
                <div className="text-content">
                  <TextHeading text={text} lang={lang} />
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
