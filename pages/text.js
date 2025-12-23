import React, { useContext, useEffect } from 'react';
import * as Client from '../common/client.js';
import LangContext from '../common/LangContext.js';
import * as OpenGraph from '../common/opengraph.js';
import { pluralize } from '../common/strings.js';
import _ from '../common/translations.js';
import { textCrumbs } from '../components/breadcrumbs.js';
import { FootnoteContainer, FootnoteList } from '../components/footnotes.js';
import HelpKalliope from '../components/helpkalliope.js';
import * as Links from '../components/links';
import { poetMenu } from '../components/menu.js';
import Note from '../components/note.js';
import Page from '../components/page.js';
import Picture from '../components/picture.js';
import { poetNameString } from '../components/poetname-helpers.js';
import PoetName from '../components/poetname.js';
import SidebarPictures from '../components/sidebarpictures.js';
import SidebarSplit from '../components/sidebarsplit.js';
import Stack from '../components/stack.js';
import TextContent from '../components/textcontent.js';
import TextName, { textLinkTitleString } from '../components/textname.js';
import TOC from '../components/toc.js';
import { workTitleString } from '../components/workname.js';
import WrapNonEmpty from '../components/wrapnonempty.js';
import { Link, Router } from '../routes';
import ErrorPage from './error.js';

const Bladrer = (props) => {
  const { target, left, right } = props;
  const lang = useContext(LangContext);

  if (target == null) {
    return null;
  }
  const onClick = (e) => {
    const url = Links.textURL(lang, target.id);
    Router.pushRoute(url);
    window.scrollTo(0, 0);
    e.preventDefault();
  };
  const style = left === true ? 'left: -20px;' : 'right: -20px;';
  return (
    <div onClick={onClick} title={'Gå til ' + target.title} className="bladrer">
      <style jsx>{`
        div.bladrer {
          display: none;
        }

        @media (max-width: 480px) {
          div.bladrer {
            display: block;
            position: absolute;
            ${style}
            width: 40px;
            bottom: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
};

const Refs = ({ refs, contentLang }) => {
  let renderedRefs = null;
  if (refs.length === 1) {
    renderedRefs = (
      <>
        <TextContent contentHtml={refs[0]} contentLang={contentLang} /> henviser
        hertil.
      </>
    );
  } else if (refs.length > 0) {
    renderedRefs = (
      <>
        <p>Henvisninger hertil:</p>
        {refs.map((ref, i) => {
          return (
            <div key={i} style={{ marginBottom: '10px' }}>
              <TextContent contentHtml={ref} contentLang={contentLang} />
            </div>
          );
        })}
      </>
    );
  }
  return (
    <div className="refs">
      {renderedRefs}
      <style jsx>{`
        @media print {
          .refs {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

class KeywordLink extends React.Component {
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
      <span>
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
      </span>
    );
  }
}

class TextHeading extends React.Component {
  render() {
    const { text } = this.props;

    let className = 'text-heading';

    const subtitles = (text.subtitles || []).map((t, i) => {
      return (
        <h4 key={'sub' + i} style={{ lineHeight: '1.6' }}>
          <TextContent contentHtml={t} contentLang={text.content_lang} />
        </h4>
      );
    });
    let suptitles = (text.suptitles || []).map((t, i) => {
      return (
        <h4 key={'sup' + i} style={{ lineHeight: '1.6' }} className="suptitle">
          <TextContent contentHtml={t} contentLang={text.content_lang} />
        </h4>
      );
    });

    return (
      <div className={className}>
        <Stack spacing="15px">
          <WrapNonEmpty>{suptitles}</WrapNonEmpty>
          <h2>
            <TextName text={text} />
          </h2>
          <WrapNonEmpty>{subtitles}</WrapNonEmpty>
        </Stack>
        <style jsx>{`
          .text-heading :global(h2) {
            line-height: 1.6;
            font-size: 1.4em;
            font-weight: normal;
            font-style: italic;
            margin: 0;
            padding: 0;
          }
          .text-heading :global(h4) {
            font-size: 1.05em;
            line-height: 1.6;
            font-weight: normal;
            margin: 0;
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

const TextPage = (props) => {
  useEffect(() => {
    if (typeof location !== undefined) {
      const hash = location.hash;
      if (hash != null && hash.length > 0) {
        location.href = hash;
      }
    }
  }, []);

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
  } = props;

  if (error) {
    return <ErrorPage error={error} lang={lang} message="Ukendt tekst" />;
  }

  let paging = {};
  if (prev != null) {
    paging.prev = {
      url: Links.textURL(lang, prev.id),
      title: prev.title,
    };
  }
  if (next != null) {
    paging.next = {
      url: Links.textURL(lang, next.id),
      title: next.title,
    };
  }

  const notes = text.notes
    .filter((note) => note.type !== 'unknown-original')
    .map((note, i) => {
      return (
        <Note key={'note' + i} type={note.type}>
          <TextContent
            contentHtml={note.content_html}
            contentLang={note.content_lang}
          />
        </Note>
      );
    });

  text.notes
    .filter(
      (note) =>
        note.type === 'unknown-original' && note.unknownOriginalBy != null
    )
    .map((note, i) => {
      const poet = note.unknownOriginalBy;
      if (poet == null) {
        return null;
      }
      const html = _(
        `Oversættelse af et ukendt digt af <a poet="{poetId}">{poetName}</a>.`,
        lang,
        {
          poetId: poet.id,
          poetName: poetNameString(poet, false, true),
        }
      );
      return (
        <Note key={'unknown' + i} type={'unknown-original'}>
          <>
            <TextContent
              contentHtml={[[html, { html: true }]]}
              contentLang={lang}
            />
            <HelpKalliope unknownOriginalBy={poet} />
          </>
        </Note>
      );
    })
    .filter((x) => x != null)
    .forEach((element) => {
      notes.push(element);
    });

  let sourceText = '';
  if (text.source != null) {
    const source = text.source;
    sourceText = 'Teksten følger ';
    sourceText += source.source.replace(/\.?$/, ', ');
    if (source.pages.indexOf('-') > -1) {
      sourceText += 'pp. ';
    } else {
      sourceText += 'p. ';
    }
    sourceText += source.pages + '.';

    let className = null;
    if (text.source.facsimilePages != null) {
      // Vi har en facsimile, hvorunder vi viser sourceText, så denne note skal kun vises på print.
      className = 'print-only';
    }
    notes.push(
      <Note className={className} key="source" type="source">
        <TextContent
          contentHtml={[[sourceText, { html: true }]]}
          contentLang="da"
        />
      </Note>
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
    let facsimilePictures = [];
    const srcPrefix = `https://kalliope.org/static/facsimiles/${poet.id}/${text.source.facsimile}`;
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

  const variants = text.variants.map((ref, i) => {
    return (
      <div key={i} style={{ marginBottom: '10px' }}>
        <TextContent contentHtml={ref} contentLang={text.content_lang} />
      </div>
    );
  });

  let renderedKeywords = null;
  if (text.keywords.length > 0) {
    const list = text.keywords.map((k) => {
      return <KeywordLink keyword={k} lang={lang} key={k.id} />;
    });
    renderedKeywords = <div style={{ marginTop: '30px' }}>{list}</div>;
  }

  let renderedVariants = null;
  if (variants.length > 0) {
    let heading = null;
    const varianter = _(
      pluralize(variants.length, 'Variant', 'Varianter'),
      lang
    );
    if (text.text_type === 'section') {
      heading = _('{varianter} af denne samling:', lang, { varianter });
    } else if (text.text_type === 'text') {
      heading = _('{varianter} af denne tekst:', lang, { varianter });
    }
    renderedVariants = (
      <div className="variants">
        <p>{heading}</p>
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
    text.refs.length > 0 ||
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
        <Refs refs={text.refs} contentLang={text.content_lang} />
        {renderedVariants}
        {renderedKeywords}
        {renderedPictures}
      </div>
    );
  }

  let ogTitle = null;
  if (work.id !== 'andre') {
    ogTitle = _(`{poetName}: »{poemTitle}« fra {workTitle}`, lang, {
      poetName: poetNameString(poet, false, false),
      poemTitle: textLinkTitleString(text),
      workTitle: workTitleString(work),
    });
  } else {
    ogTitle = _(`{poetName}: »{poemTitle}«`, lang, {
      poetName: poetNameString(poet, false, false),
      poemTitle: textLinkTitleString(text),
    });
  }
  let ogDescription = '';
  let shouldIndentTitle = false;

  let body = null;
  if (text.text_type === 'section' && text.toc != null) {
    body = <TOC toc={text.toc} lang={lang} indent={1} />;
  } else {
    let highlightInterval;
    if (highlight != null) {
      let m = null;
      let from = -1,
        to = -1;
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
    const renderedBlocks = text.blocks.map((block, i) => {
      const { type, lines, options } = block;
      const blockOptions = {
        isPoetry: type === 'poetry',
        highlight: highlightInterval,
        ...options,
      };
      return (
        <div>
          <TextContent
            key={type + i}
            contentHtml={lines}
            contentLang={text.content_lang}
            lang={lang}
            options={blockOptions}
            type={type}
            keyPrefix={text.id}
          />
        </div>
      );
    });
    body = <div className="text-content">{renderedBlocks}</div>;

    ogDescription = OpenGraph.trimmedDescription(
      // Merge blocks
      text.blocks
        .filter((b) => b.type !== 'quote')
        .map((b) => b.lines)
        .reduce((result, lines) => {
          return result.concat(lines);
        }, [])
    );

    // Titlen skal indentes hvis første ikke-quote block indeholder numre.
    const firstNoneQuoteBlock = text.blocks.find((b) => b.type !== 'quote');
    shouldIndentTitle =
      firstNoneQuoteBlock != null &&
      firstNoneQuoteBlock.lines.find((l) => {
        const lineOptions = l.length > 1 ? l[1] : {};
        return lineOptions.displayNum != null || lineOptions.margin != null;
      }) != null;
  }

  return (
    <Page
      headTitle={ogTitle}
      ogTitle={poetNameString(poet, false, false)}
      ogImage={OpenGraph.poetImage(poet)}
      ogDescription={ogDescription}
      requestPath={`/${lang}/text/${text.id}`}
      crumbs={textCrumbs(lang, poet, work, section_titles || [], text)}
      paging={paging}
      pageTitle={<PoetName poet={poet} includePeriod />}
      pageSubtitle={_('Værker', lang)}
      menuItems={poetMenu(poet)}
      selectedMenuItem="works"
    >
      <FootnoteContainer key={text.id}>
        <SidebarSplit sidebar={sidebar}>
          <div>
            <article style={{ position: 'relative' }}>
              <Bladrer left target={prev} />
              <Bladrer right target={next} />
              <div
                className="text-content"
                style={{
                  marginLeft: shouldIndentTitle ? '1.5em' : 0,
                }}
              >
                <TextHeading text={text} />
              </div>
              <div>{body}</div>
              <style jsx>{`
                :global(.text-content) {
                  font-family: 'Alegreya', serif;
                  line-height: 1.5;
                  font-size: 1em;
                  display: inline-block;
                }
                :global(.text-content) :global(sc) {
                  font-family: 'Alegreya SC';
                }
                @media print {
                  font-size: 8pt;
                  line-height: 1.5;
                }
              `}</style>
            </article>
          </div>
        </SidebarSplit>
      </FootnoteContainer>
    </Page>
  );
};

TextPage.getInitialProps = async ({ query: { lang, textId, highlight } }) => {
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
};

export default TextPage;
