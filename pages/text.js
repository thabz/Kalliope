// @flow

import React from 'react';
import { Link } from '../routes';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav from '../components/nav';
import SidebarSplit from '../components/sidebarsplit.js';
import LangSelect from '../components/langselect';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import SubHeading from '../components/subheading.js';
import PoetName, { poetNameString } from '../components/poetname.js';
import { workTitleString } from '../components/workname.js';
import TextName, { textTitleString } from '../components/textname.js';
import TextContent from '../components/textcontent.js';
import { FootnoteContainer, FootnoteList } from '../components/footnotes.js';
import Note from '../components/note.js';
import SidebarPictures from '../components/sidebarpictures.js';
import * as Links from '../components/links';
import * as Client from './helpers/client.js';
import * as OpenGraph from './helpers/opengraph.js';
import type { Lang, Poet, Work, Text, PrevNextText } from './helpers/types.js';
import 'isomorphic-fetch';

class TextHeading extends React.Component {
  props: { text: Text, lang: Lang, isProse: boolean };
  render() {
    const { text, lang, isProse } = this.props;

    let className = 'text-heading';
    if (isProse) {
      className += ' prose';
    } else {
      className += ' poem';
    }

    let subtitles = null;
    if (text.subtitles != null) {
      subtitles = text.subtitles.map((t, i) => {
        return (
          <h4 key={i}>
            <TextContent contentHtml={t} lang={lang} />
          </h4>
        );
      });
    }
    return (
      <div className={className}>
        <h2>
          <TextName text={text} />
        </h2>
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
          .text-heading.poem {
            margin-left: 1.5em;
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
    prev?: PrevNextText,
    next?: PrevNextText,
  };

  static async getInitialProps({
    query: { lang, textId },
  }: {
    query: { lang: Lang, textId: string },
  }) {
    const json = await Client.text(textId);
    return {
      lang,
      poet: json.poet,
      work: json.work,
      prev: json.prev,
      next: json.next,
      text: json.text,
    };
  }

  render() {
    const { lang, poet, work, prev, next, text } = this.props;

    const renderedNotes = text.notes.map((note, i) => {
      return <Note key={i} note={note} lang={lang} />;
    });
    const renderedPictures = (
      <SidebarPictures
        lang={lang}
        pictures={text.pictures}
        srcPrefix={`/static/images/${poet.id}`}
      />
    );
    const refs = text.refs.map((ref, i) => {
      return (
        <div key={i} style={{ marginBottom: '10px' }}>
          <TextContent contentHtml={ref} lang={lang} />
        </div>
      );
    });
    const rightSideItems = [prev, next].map((t, i) => {
      if (t == null) return null;
      const url = Links.textURL(lang, t.id);
      const arrow = i === 0 ? '←' : '→';
      const style = i === 1 ? { marginLeft: '10px' } : null;
      return (
        <div style={style}>
          <Link prefetch route={url}>
            <a title={t.title}>
              {arrow}
            </a>
          </Link>
        </div>
      );
    });
    const rightSide = (
      <div style={{ display: 'flex', padding: '4px 0' }}>
        {rightSideItems}
      </div>
    );

    const renderedRefs =
      refs.length == 0 ? null : [<p>Henvisninger hertil:</p>, ...refs];
    let sidebar: any = null;
    if (
      refs.length > 0 ||
      text.has_footnotes ||
      text.pictures.length > 0 ||
      text.notes.length > 0
    ) {
      sidebar = (
        <div>
          {renderedNotes}
          {renderedPictures}
          <FootnoteList />
          {renderedRefs}
        </div>
      );
    }
    const options = {
      isBible: poet.id === 'bibel',
      isPoetry: poet.id !== 'bibel' && !text.is_prose,
    };
    const body = (
      <TextContent
        contentHtml={text.content_html}
        lang={lang}
        options={options}
      />
    );

    const title = <PoetName poet={poet} includePeriod />;
    const ogTitle =
      poetNameString(poet, false, false) +
      ': »' +
      textTitleString(text) +
      '« fra ' +
      workTitleString(work);
    const headTitle =
      textTitleString(text) +
      ' - ' +
      poetNameString(poet, false, false) +
      ' - Kalliope';

    const ogDescription = OpenGraph.trimmedDescription(
      text.content_html,
      !text.is_prose
    );
    const ogImage = OpenGraph.poetImage(poet);

    return (
      <div>
        <FootnoteContainer>
          <Head
            headTitle={headTitle}
            ogTitle={ogTitle}
            ogImage={ogImage}
            description={ogDescription}
          />
          <Main>
            <Nav
              lang={lang}
              poet={poet}
              work={work}
              rightSide={rightSide}
              title={<TextName text={text} />}
            />
            <Heading title={title} subtitle="Værker" />
            <PoetTabs lang={lang} poet={poet} selected="works" />
            <SidebarSplit sidebar={sidebar}>
              <div>
                <div className="text-content">
                  <TextHeading
                    text={text}
                    lang={lang}
                    isProse={text.is_prose}
                  />
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
            </SidebarSplit>
            <LangSelect lang={lang} />
          </Main>
        </FootnoteContainer>
      </div>
    );
  }
}
