import Link from 'next/link';
import Router from 'next/router';
import { useContext, useEffect } from 'react';
import * as Client from '../common/client.js';
import LangContext from '../common/LangContext.js';
import * as OpenGraph from '../common/opengraph.js';
import { pluralize } from '../common/strings.js';
import _ from '../common/translations.js';
import { textCrumbs } from '../components/breadcrumbs.js';
import { FootnoteContainer, FootnoteList } from '../components/footnotes.js';
import HelpKalliope from '../components/helpkalliope.js';
import * as Links from '../components/links.js';
import { poetMenu } from '../components/menu.js';
import Note from '../components/note.js';
import Page from '../components/page.js';
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
import ErrorPage from './error.js';

const Bladrer = (props) => {
  const { target, left, right } = props;
  const lang = useContext(LangContext);

  if (target == null) {
    return null;
  }
  const onClick = (e) => {
    const url = Links.textURL(lang, target.id);
    Router.push(url);
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

const Refs = ({ refs, contentLang, currentPoetId }) => {
  const lang = useContext(LangContext);
  const renderedRefs = refs.map((ref, i) => {
    if (Array.isArray(ref)) {
      return (
        <div className="reference" key={i}>
          <TextContent contentHtml={ref} contentLang={contentLang} />
        </div>
      );
    }

    const metadata = [];
    if (ref.poetId !== currentPoetId) {
      metadata.push(ref.poet);
    }
    if (ref.work != null) {
      metadata.push(ref.work);
    }

    return (
      <div className="reference" key={ref.id}>
        <Link
          href={Links.textURL(lang, ref.id)}
          className="reference-title">
          »{ref.title}«
        </Link>
        {metadata.length > 0 ? (
          <div className="reference-metadata">{metadata.join(' · ')}</div>
        ) : null}
      </div>
    );
  });

  return (
    <div className="refs">
      {renderedRefs}
      <style jsx>{`
        .reference {
          margin-bottom: 16px;
        }
        .reference:last-child {
          margin-bottom: 0;
        }
        :global(a.reference-title) {
          display: inline-block;
          hyphens: none;
          overflow-wrap: break-word;
        }
        .reference-metadata {
          margin-top: 2px;
          color: #777;
          font-size: 0.9em;
        }
        @media print {
          .refs {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

const MetadataGroup = ({ title, children, printHidden = false }) => {
  if (children == null) {
    return null;
  }
  const className = `metadata-group${printHidden ? ' print-hidden' : ''}`;
  return (
    <section className={className}>
      <h4>{title}</h4>
      {children}
      <style jsx>{`
        .metadata-group {
          margin-bottom: 22px;
        }
        .metadata-group:last-child {
          margin-bottom: 0;
        }
        .metadata-group :global(h4) {
          margin: 0 0 7px;
          color: #777;
          font-size: 0.75em;
          font-weight: 600;
          letter-spacing: 0.06em;
          line-height: 1.2;
          text-transform: uppercase;
        }
        .metadata-group :global(a) {
          hyphens: none;
          overflow-wrap: break-word;
        }
        @media print {
          .metadata-group.print-hidden {
            display: none;
          }
        }
      `}</style>
    </section>
  );
};

const KeywordLink = ({ keyword, lang }) => {
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
      <Link href={url} className="keyword-link" title={keyword.title}>
        {keyword.title}
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
};

const RelatedDateTexts = ({ texts, lang }) => {
  if (texts.length === 0) {
    return null;
  }
  return (
    <div className="related-date-texts">
      {texts.map((text, i) => {
        const separator =
          i === texts.length - 1
            ? ''
            : i === texts.length - 2
            ? ` ${_('og', lang)} `
            : ', ';
        return (
          <span key={text.id}>
            {text.poetName}:
            <Link href={Links.textURL(lang, text.id)}>»{text.title}«</Link>
            {separator}
          </span>
        );
      })}{' '}
      {_('knytter sig til samme dato.', lang)}
      <style jsx>{`
        .related-date-texts {
          margin-bottom: 30px;
        }
      `}</style>
    </div>
  );
};

const TextHeading = ({ text }) => {
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
};

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

  const renderNotes = (items, keyPrefix) =>
    items
      .filter((note) => note.type !== 'unknown-original')
      .map((note, i) => {
        return (
          <Note key={keyPrefix + i} type={note.type}>
            <TextContent
              contentHtml={note.content_html}
              contentLang={note.content_lang}
            />
          </Note>
        );
      });

  const translationSourceNotes = renderNotes(
    text.notes.filter((note) => note.type === 'translation-source'),
    'translation-source'
  );
  const notes = renderNotes(
    text.notes.filter((note) => note.type !== 'translation-source'),
    'note'
  );

  text.notes
    .filter(
      (note) =>
        note.type === 'unknown-original' && note.unknownOriginalBy != null
    )
    .map((note, i) => {
      const originalPoet = note.unknownOriginalBy;
      if (originalPoet == null) {
        return null;
      }
      const html = _(
        `Oversættelse af et ukendt digt af <a poet="{poetId}">{poetName}</a>.`,
        lang,
        {
          poetId: originalPoet.id,
          poetName: poetNameString(originalPoet, false, true, lang),
        }
      );
      return (
        <Note key={'unknown' + i} type={'unknown-original'}>
          <>
            <TextContent
              contentHtml={[[html, { html: true }]]}
              contentLang={lang}
            />
            <HelpKalliope unknownOriginalBy={originalPoet} lang={lang} />
          </>
        </Note>
      );
    })
    .filter((x) => x != null)
    .forEach((element) => {
      notes.push(element);
    });

  let sourceText = '';
  let renderedSource = null;
  if (text.source != null) {
    const source = text.source;
    sourceText = source.source.replace(/\.?$/, ', ');
    sourceText += 's. ' + source.pages + '.';
    renderedSource = (
      <TextContent
        contentHtml={[[sourceText, { html: true }]]}
        contentLang="da"
      />
    );
  }

  let textPictures = [...text.pictures];

  if (text.source != null && text.source.facsimilePages != null) {
    function pad(num, size) {
      var s = num + '';
      while (s.length < size) s = '0' + s;
      return s;
    }
    const firstPageNumber = text.source.facsimilePages[0];
    let facsimilePictures = [];
    const facsimilePoetId = text.source.facsimilePoetId || poet.id;
    const srcPrefix = `https://kalliope.org/static/facsimiles/${facsimilePoetId}/${text.source.facsimile}`;
    for (let i = 0; i < text.source.facsimilePageCount; i++) {
      facsimilePictures.push({
        src: srcPrefix + '/' + pad(i, 3) + '.jpg',
        content_html: [[sourceText, { html: true }]],
        content_lang: 'da',
      });
    }
    const printedPage = text.source.pages.split('-')[0];
    facsimilePictures[firstPageNumber - 1].miniature_content_html = [
      [
        `Kilden${printedPage ? `, s. ${printedPage}` : ''}.`,
        { html: true },
      ],
    ];
    textPictures.push({
      key: 'facsimile' + firstPageNumber,
      pictures: facsimilePictures,
      startIndex: firstPageNumber - 1,
      lang: 'da',
      contentLang: 'da',
    });
  }

  const renderedPictures =
    textPictures.length > 0 ? (
      <div>
        <SidebarPictures pictures={textPictures} lang={lang} />
      </div>
    ) : null;

  let renderedKeywords = null;
  if (text.keywords.length > 0) {
    const list = text.keywords.map((k) => {
      return <KeywordLink keyword={k} lang={lang} key={k.id} />;
    });
    renderedKeywords = <div style={{ marginTop: '30px' }}>{list}</div>;
  }

  const noteCount = notes.length + (text.footnotes_count || 0);
  const noteHeading = _(pluralize(noteCount, 'Note', 'Noter'), lang);
  const translationsHeading = _(
    pluralize(
      (text.translations || []).length,
      'Gendigtning',
      'Gendigtninger'
    ),
    lang
  );
  const hasAboutText =
    translationSourceNotes.length > 0 ||
    renderedSource != null ||
    notes.length > 0 ||
    text.has_footnotes ||
    text.refs.length > 0 ||
    (text.translations || []).length > 0 ||
    text.variants.length > 0;
  const renderedNotes =
    notes.length > 0 || text.has_footnotes ? (
      <MetadataGroup title={noteHeading}>
        {notes}
        <FootnoteList />
      </MetadataGroup>
    ) : null;
  const renderedTextMetadata = hasAboutText ? (
    <>
      {translationSourceNotes.length > 0 ? (
        <MetadataGroup title={_('Forlæg', lang)}>
          {translationSourceNotes}
        </MetadataGroup>
      ) : null}
      {renderedSource != null ? (
        <MetadataGroup title={_('Kilde', lang)}>
          {renderedSource}
        </MetadataGroup>
      ) : null}
      {text.variants.length > 0 ? (
        <MetadataGroup title={_('Andre udgaver', lang)} printHidden>
          <Refs
            refs={text.variants}
            contentLang={text.content_lang}
            currentPoetId={poet.id}
          />
        </MetadataGroup>
      ) : null}
      {text.refs.length > 0 ? (
        <MetadataGroup title={_('Omtalt i', lang)} printHidden>
          <Refs
            refs={text.refs}
            contentLang={text.content_lang}
            currentPoetId={poet.id}
          />
        </MetadataGroup>
      ) : null}
      {(text.translations || []).length > 0 ? (
        <MetadataGroup title={translationsHeading} printHidden>
          <Refs
            refs={text.translations}
            contentLang={text.content_lang}
            currentPoetId={poet.id}
          />
        </MetadataGroup>
      ) : null}
    </>
  ) : null;

  let sidebar = null;
  if (
    hasAboutText ||
    text.pictures.length > 0 ||
    text.keywords.length > 0 ||
    (text.related_date_texts || []).length > 0 ||
    textPictures.length > 0
  ) {
    sidebar = (
      <div>
        {renderedNotes}
        {renderedTextMetadata}
        <RelatedDateTexts texts={text.related_date_texts || []} lang={lang} />
        {renderedKeywords}
        {renderedPictures}
      </div>
    );
  }

  let ogTitle = null;
  if (work.id !== 'andre') {
    ogTitle = _(`{poetName}: »{poemTitle}« fra {workTitle}`, lang, {
      poetName: poetNameString(poet, false, false, lang),
      poemTitle: textLinkTitleString(text),
      workTitle: workTitleString(work, lang),
    });
  } else {
    ogTitle = _(`{poetName}: »{poemTitle}«`, lang, {
      poetName: poetNameString(poet, false, false, lang),
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
        <div key={type + i}>
          <TextContent
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
      ogTitle={ogTitle}
      ogImage={OpenGraph.poetImage(poet)}
      ogDescription={ogDescription}
      requestPath={`/${lang}/text/${text.id}`}
      canonicalPath={`/${lang}/text/${text.canonical_id || text.id}`}
      noIndex={text.indexable === false}
      crumbs={textCrumbs(lang, poet, work, section_titles || [], text)}
      paging={paging}
      pageTitle={<PoetName poet={poet} includePeriod />}
      pageSubtitle={_('Værker', lang)}
      menuItems={poetMenu(poet)}
      selectedMenuItem="works">
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
                }}>
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
