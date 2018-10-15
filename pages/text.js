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

type KeywordLinkProps = { keyword: KeywordRef, lang: Lang };
class KeywordLink extends React.Component<KeywordLinkProps> {
  render() {
    const { keyword, lang } = this.props;
    let url = null;
    switch (keyword.type) {
      case 'keyword':
        url = Links.keywordURL(lang, keyword.id);
        break;
      case 'poet':
        url = Links.poetURL(lang, keyword.id);
        break;
      case 'subject':
        return null;
    }
    return (
      <Fragment>
        <Link route={url}>
          <a className="keyword-link" title={keyword.title}>
            {keyword.title}
          </a>
        </Link>
        <style jsx>{`
          :global(a.keyword-link) {
            display: inline-block;
            background-color: hsla(353, 43%, 95%, 1);
            padding: 1px 5px;
            border-radius: 4px;
            margin: 0 4px 2px 0;
          }
        `}</style>
      </Fragment>
    );
  }
}

type TextHeadingProps = { text: Text, lang: Lang, isProse: boolean };
class TextHeading extends React.Component<TextHeadingProps> {
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
          <h4 key={i} style={{ lineHeight: '1.6' }}>
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
            line-height: 1.4em;
            font-size: 1.4em;
            font-weight: normal;
            margin: 0 0 15px 0;
            font-style: italic;
            padding: 0;
          }
          .text-heading :global(h4) {
            font-size: 1.05em;
            line-height: 1.05em;
            font-weight: normal;
            margin: 0 0 0px 0;
            padding: 0;
          }
          .text-heading {
            margin-bottom: 60px;
          }
          .text-heading.poem {
            margin-left: 1.5em;
          }
        `}</style>
      </div>
    );
  }
}

type TextComponentProps = {
  lang: Lang,
  highlight: string,
  poet: Poet,
  work: Work,
  text: Text,
  section_titles: ?Array<{ title: string, id: ?string }>,
  prev?: PrevNextText,
  next?: PrevNextText,
  error: ?Error,
};
export default class extends React.Component<TextComponentProps> {
  static async getInitialProps({
    query: { lang, textId, highlight },
  }: {
    query: { lang: Lang, textId: string, highlight: string },
  }) {
    const json = await Client.text(textId);
    return {
      lang,
      highlight,
      poet: json.poet,
      work: json.work,
      prev: json.prev,
      next: json.next,
      text: json.text,
      section_titles: json.section_titles,
      error: json.error,
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
    const {
      lang,
      highlight,
      poet,
      work,
      prev,
      next,
      text,
      section_titles,
      error,
    } = this.props;

    if (error) {
      return <ErrorPage error={error} lang={lang} message="Ukendt tekst" />;
    }
    const requestPath = `/${lang}/text/${text.id}`;

    const rightSideItems = [prev, next].map((t, i) => {
      if (t == null) {
        return null;
      } else {
        return {
          url: Links.textURL(lang, t.id),
          title: t.title,
        };
      }
    });
    const rightSide = (
      <NavPaging prev={rightSideItems[0]} next={rightSideItems[1]} />
    );

    const notes = text.notes.map((note, i) => {
      return <Note key={i} note={note} lang={lang} />;
    });

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
      const note = {
        lang,
        type: 'source',
        content_html: [[sourceText, { html: true }]],
        content_lang: 'da',
      };
      notes.push(
        <Note className="print-only" key="source" note={note} lang={lang} />
      );
    }
    let renderedNotes = null;
    if (notes.length > 0) {
      renderedNotes = <div style={{ marginBottom: '30px' }}>{notes}</div>;
    }

    let textPictures = text.pictures.map((p, i) => {
      return (
        <Picture
          key={'textpicture' + i}
          pictures={[p]}
          contentLang={p.content_lang || 'da'}
          lang={lang}
        />
      );
    });
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
          content_html: [[sourceText, { html: true }]],
          content_lang: 'da',
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

    const refs = text.refs.map((ref, i) => {
      return (
        <div key={i} style={{ marginBottom: '10px' }}>
          <TextContent contentHtml={ref} lang={lang} />
        </div>
      );
    });

    const variants = text.variants.map((ref, i) => {
      return (
        <div key={i} style={{ marginBottom: '10px' }}>
          <TextContent contentHtml={ref} lang={lang} />
        </div>
      );
    });

    let renderedKeywords = null;
    if (text.keywords.length > 0) {
      const list = text.keywords.map(k => {
        return <KeywordLink keyword={k} lang={lang} key={k.id} />;
      });
      renderedKeywords = <div style={{ marginTop: '30px' }}>{list}</div>;
    }

    let renderedRefs = null;
    if (refs.length > 0) {
      renderedRefs = (
        <div className="refs">
          <p>Henvisninger hertil:</p>
          {refs}
          <style jsx>{`
            @media print {
              .refs {
                display: none;
              }
            }
          `}</style>
        </div>
      );
    }

    let renderedVariants = null;
    if (variants.length > 0) {
      renderedVariants = (
        <div className="variants">
          <p>Varianter af dette digt:</p>
          {variants}
          <style jsx>{`
            @media print {
              .variants {
                display: none;
              }
            }
          `}</style>
        </div>
      );
    }

    let sidebar = null;
    if (
      refs.length > 0 ||
      variants.length > 0 ||
      text.has_footnotes ||
      text.pictures.length > 0 ||
      notes.length > 0 ||
      text.keywords.length > 0 ||
      textPictures.length > 0
    ) {
      sidebar = (
        <div>
          {renderedNotes}
          <FootnoteList />
          {renderedRefs}
          {renderedVariants}
          {renderedKeywords}
          {renderedPictures}
        </div>
      );
    }
    let body = null;
    if (text.text_type === 'section' && text.toc != null) {
      body = <TOC toc={text.toc} lang={lang} indent={1} />;
    } else {
      let highlightInterval: { from: number, to: number };
      if (highlight != null) {
        let m = null;
        let from: number = -1,
          to: number = -1;
        if ((m = highlight.match(/(\d+)-(\d+)/))) {
          from = parseInt(m[1]);
          to = parseInt(m[2]);
        } else if ((m = highlight.match(/(\d+)ff/))) {
          from = parseInt(m[1]);
          to = Number.MAX_VALUE;
        } else if ((m = highlight.match(/(\d+)/))) {
          from = parseInt(m[1]);
          to = parseInt(m[1]);
        }
        highlightInterval = { from, to };
      }
      const options = {
        isBible: poet.id === 'bibel',
        isPoetry: poet.id !== 'bibel' && !text.is_prose,
        highlight: highlightInterval,
      };
      body = (
        <div className="text-content">
          <TextContent
            contentHtml={text.content_html}
            contentLang={text.content_lang}
            lang={lang}
            options={options}
            keyPrefix={text.id}
          />
        </div>
      );
    }

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
              rightSide={rightSide}
              sectionTitles={section_titles}
              title={textLinkTitleString(text)}
            />
            <Heading title={title} subtitle="Værker" />
            <PoetTabs lang={lang} poet={poet} selected="works" />
            <SidebarSplit sidebar={sidebar}>
              <div>
                <article>
                  <div className="text-content">
                    <TextHeading
                      text={text}
                      lang={lang}
                      isProse={text.is_prose}
                    />
                  </div>
                  <div>{body}</div>
                  <style jsx>{`
                    :global(.text-content) {
                      font-family: 'Palatino', 'Georgia', serif;
                      line-height: 1.5;
                      font-size: 1.15em;
                      display: inline-block;
                    }
                    :global(.text-content) :global(sc) {
                      font-variant: small-caps;
                    }

                    @media print {
                      font-size: 8pt;
                      line-height: 1.5;
                    }
                  `}</style>
                </article>
              </div>
            </SidebarSplit>
            <LangSelect lang={lang} path={requestPath} />
          </Main>
        </FootnoteContainer>
      </div>
    );
  }
}
