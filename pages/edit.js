// @flow

import React, { Fragment } from 'react';
import { Link } from '../routes';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav, { NavPaging } from '../components/nav';
import SidebarSplit from '../components/sidebarsplit.js';
import LangSelect from '../components/langselect';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import SubHeading from '../components/subheading.js';
import TOC from '../components/toc.js';
import PoetName, { poetNameString } from '../components/poetname.js';
import { workTitleString } from '../components/workname.js';
import TextName, {
  textTitleString,
  textLinkTitleString,
} from '../components/textname.js';
import TextContent from '../components/textcontent.js';
import { FootnoteContainer, FootnoteList } from '../components/footnotes.js';
import Note from '../components/note.js';
import SidebarPictures from '../components/sidebarpictures.js';
import Picture from '../components/picture.js';
import * as Links from '../components/links';
import * as Client from './helpers/client.js';
import * as OpenGraph from './helpers/opengraph.js';
import _ from '../pages/helpers/translations.js';
import ErrorPage from './error.js';
import type {
  Lang,
  Poet,
  Work,
  Text,
  TextSource,
  PictureItem,
  KeywordRef,
  PrevNextText,
  Error,
} from './helpers/types.js';

type EditorProps = {
  xml: string,
};
class Editor extends React.Component<EditorProps> {
  render() {
    const { xml } = this.props;
    return (
      <div className="text-editor">
        <textarea value={xml} />
        <style jsx>{`
          .text-editor {
            height: 100%;
          }
          .text-editor textarea {
            width: 100%;
            border: 1px solid black;
            height: 100%;
            padding: 10px;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }
}

type EditComponentProps = {
  lang: Lang,
  poet: Poet,
  work: Work,
  text: Text,
  xml: string,
  error: ?Error,
};
export default class extends React.Component<EditComponentProps> {
  static async getInitialProps({
    query: { lang, textId, highlight },
  }: {
    query: { lang: Lang, textId: string, highlight: string },
  }) {
    const json = await Client.text(textId);
    const xml = await Client.textXml(textId);
    console.log(xml);

    return {
      lang,
      poet: json.poet,
      work: json.work,
      text: json.text,
      error: json.error || xml.error,
      xml: xml.xml,
    };
  }

  componentDidUpdate() {
    if (typeof location !== undefined) {
      const hash = location.hash;
      if (hash != null && hash.length > 0) {
        location.href = hash;
      }
    }
  }

  render() {
    const { lang, poet, work, text, xml, error } = this.props;

    if (error) {
      return <ErrorPage error={error} lang={lang} message="Ukendt tekst" />;
    }
    const requestPath = `/${lang}/text/${text.id}`;

    let sourceText = '';
    if (text.source != null) {
      const source: TextSource = text.source;
      sourceText = 'Teksten følger ';
      sourceText += source.source.replace(/\.?$/, ', ');
      if (source.pages.indexOf('-') > -1) {
        sourceText += 'pp. ';
      } else {
        sourceText += 'p. ';
      }
      sourceText += source.pages + '.';
    }

    let textPictures = [];
    if (text.source != null && text.source.facsimilePages != null) {
      function pad(num, size) {
        var s = num + '';
        while (s.length < size) s = '0' + s;
        return s;
      }
      const firstPageNumber = text.source.facsimilePages[0];
      let facsimilePictures: Array<PictureItem> = [];
      const srcPrefix = `https://kalliope.org/static/facsimiles/${poet.id}/${
        text.source.facsimile
      }`;
      for (let i = 0; i < text.source.facsimilePageCount; i++) {
        facsimilePictures.push({
          src: srcPrefix + '/' + pad(i, 3) + '.jpg',
        });
      }
      textPictures.push(
        <Picture
          key={'facsimile' + firstPageNumber}
          pictures={facsimilePictures}
          startIndex={firstPageNumber - 1}
          lang="da"
          contentLang="da"
        />
      );
    }

    const renderedPictures = (
      <div style={{ marginTop: '30px' }}>
        <SidebarPictures>{textPictures}</SidebarPictures>
      </div>
    );

    const title = <PoetName poet={poet} includePeriod />;

    const ogTitle = _(`{poetName}: »{poemTitle}« fra {workTitle}`, lang, {
      poetName: poetNameString(poet, false, false),
      poemTitle: textLinkTitleString(text),
      workTitle: workTitleString(work),
    });
    // const ogTitle =
    //   poetNameString(poet, false, false) +
    //   ': »' +
    //   textLinkTitleString(text) +
    //   '« fra ' +
    //   workTitleString(work);
    const headTitle =
      textLinkTitleString(text) +
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
        <FootnoteContainer key={text.id}>
          <Head
            headTitle={headTitle}
            ogTitle={ogTitle}
            ogImage={ogImage}
            description={ogDescription}
            requestPath={requestPath}
          />
          <Main>
            <Nav
              lang={lang}
              poet={poet}
              work={work}
              title={textLinkTitleString(text)}
            />
            <Heading title={title} subtitle="Værker" />
            <PoetTabs lang={lang} poet={poet} selected="works" />
            <article>
              <div className="middle-split">
                <div>{textPictures}</div>
                <div className="spacer" />
                <div>
                  <Editor xml={xml} />
                </div>
              </div>
              <style jsx>{`
                :global(.middle-split) {
                  display: flex;
                  width: 100%;
                }
                .middle-split > div {
                  flex-basis: 48%;
                }
                .middle-split > .spacer {
                  flex-basis: 4%;
                }
              `}</style>
            </article>
            <LangSelect lang={lang} path={requestPath} />
          </Main>
        </FootnoteContainer>
      </div>
    );
  }
}
