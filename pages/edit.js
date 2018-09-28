// @flow

import React, { Fragment } from 'react';
import { Link, Router } from '../routes';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav, { NavPaging } from '../components/nav';
import SidebarSplit from '../components/sidebarsplit.js';
import LangSelect from '../components/langselect';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import TextHeading from '../components/textheading.js';
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
import { Input, TextArea, Button } from '../components/inputs.js';

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
type EditorState = {
  xml: string,
};
class Editor extends React.Component<EditorProps, EditorState> {
  onChange: (e: SyntheticInputEvent<HTMLTextAreaElement>) => void;

  constructor(props) {
    super(props);
    let editableText = props.xml.trim().replace(/^ */gm, m => {
      return '\u2002'.repeat(m.length);
    });
    this.state = { xml: props.xml.trim() };
    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    // let xml = e.target.value.replace(/^[ \u2002]*/gm, m => {
    //   return '\u2002'.repeat(m.length);
    // });
    this.setState({ xml: e.target.value });
  }

  render() {
    const { xml } = this.state;
    const rows = xml.split(/\n/).length;
    return (
      <div className="text-editor-container">
        <TextArea
          className="text-editor"
          label="Tekst"
          value={xml}
          wrap="off"
          rows={rows}
          onChange={this.onChange}
        />
        <style jsx>{`
          :global(.text-editor-container) :global(.buttons-holder) {
            width: 100%;
            justify-content: space-between;
            display: flex;
          }
          :global(.text-editor-container) {
          }
          :global(.text-editor) {
            width: 100%;
            font-family: monospace; /*'Palatino', 'Georgia', serif;*/
            border: 1px solid black;
            padding: 10px;
            box-sizing: border-box;
            font-size: 1.15em;
            line-height: 1.5;
            white-space: pre;
            overflow-wrap: normal;
            overflow-x: scroll;
          }
        `}</style>
      </div>
    );
  }
}

type EditoAuthorDetailsProps = {};
type AuthorDetailsState = {
  name: string,
  email: string,
};
class AuthorDetails extends React.Component<
  EditoAuthorDetailsProps,
  AuthorDetailsState
> {
  onNameChange: (e: SyntheticInputEvent<HTMLInputElement>) => void;
  onEmailChange: (e: SyntheticInputEvent<HTMLInputElement>) => void;

  constructor(props) {
    super(props);
    // TODO: Copy into browser local storage
    this.state = { name: '', email: '' };
    this.onNameChange = this.onNameChange.bind(this);
    this.onEmailChange = this.onEmailChange.bind(this);
  }

  onNameChange(e) {
    this.setState({ name: e.target.value });
  }

  onEmailChange(e) {
    // TODO: Copy into browser local storage
    this.setState({ email: e.target.value });
  }

  render() {
    const { name, email } = this.state;
    return (
      <div className="author-details-container">
        <Input
          value={name}
          onChange={this.onNameChange}
          label="Dit navn (valgfrit)"
        />
        <div style={{ flexBasis: '20px' }} />
        <Input
          value={email}
          onChange={this.onEmailChange}
          label="Din email-adresse (valgfrit)"
        />
        <style jsx>{`
          :global(.author-details-container) {
            width: 100%;
            justify-content: space-between;
            display: flex;
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
  onCancelClick: (e: SyntheticInputEvent<HTMLButtonElement>) => void;
  onSubmitClick: (e: SyntheticInputEvent<HTMLButtonElement>) => void;

  constructor(props: EditComponentProps) {
    super(props);
    this.onCancelClick = this.onCancelClick.bind(this);
    this.onSubmitClick = this.onSubmitClick.bind(this);
  }

  static async getInitialProps({
    query: { lang, textId, highlight },
  }: {
    query: { lang: Lang, textId: string, highlight: string },
  }) {
    const json = await Client.text(textId);
    const xml = await Client.textXml(textId);

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

  onCancelClick() {
    const { lang, text } = this.props;
    const backURL = Links.textURL(lang, text.id);
    Router.pushRoute(backURL);
  }

  onSubmitClick() {}

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
                <div className="editing-controls">
                  <div className="text-content">
                    <TextHeading
                      text={text}
                      lang={lang}
                      isProse={text.is_prose}
                    />
                  </div>
                  <Editor xml={xml} />
                  <AuthorDetails />
                  <div className="buttons-holder">
                    <Button onClick={this.onCancelClick}>Fortryd</Button>
                    <Button onSubmitClick={this.onSubmitClick}>Indsend</Button>
                  </div>
                </div>
                <div className="spacer" />
                <div>{textPictures}</div>
              </div>
              <style jsx>{`
                :global(.editing-controls > *) {
                  margin-bottom: 30px;
                }
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
