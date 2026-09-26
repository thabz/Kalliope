import Link from 'next/link';
import * as Client from '../common/client.js';
import * as OpenGraph from '../common/opengraph.js';
import _ from '../common/translations.js';
import { kalliopeCrumbs } from '../components/breadcrumbs.js';
import { FootnoteContainer, FootnoteList } from '../components/footnotes.js';
import * as Links from '../components/links.js';
import { kalliopeMenu } from '../components/menu.js';
import Page from '../components/page.js';
import SidebarPictures from '../components/sidebarpictures.js';
import SidebarMiniHeading from '../components/sidebarminiheading.js';
import SidebarSplit from '../components/sidebarsplit.js';
import Stack from '../components/stack.js';
import Source from '../components/source.js';
import SubHeading from '../components/subheading.js';
import TextContent from '../components/textcontent.js';
import ErrorPage from './error.js';

const KeywordSources = ({ sources, lang }) => {
  if (sources == null || sources.length === 0) {
    return null;
  }
  return (
    <footer className="keyword-sources" aria-label={_('Kilde', lang)}>
      {sources.map((source, index) => (
        <div className="source" key={index}>
          <Source
            contentHtml={source.content_html}
            href={source.href}
            lang={lang}
          />
        </div>
      ))}
      <style jsx>{`
        .keyword-sources {
          margin-bottom: 40px;
          font-size: 0.8em;
          text-align: right;
        }
        .source {
          margin-top: 0.6em;
        }
      `}</style>
    </footer>
  );
};

const KeywordTextCount = ({ count, keyword, lang }) => {
  if (count === 0) {
    return null;
  }
  const countText = _(
    count === 1 ? '{count} dansk digt' : '{count} danske digte',
    lang,
    { count }
  );
  return (
    <div className="keyword-text-count">
      {_('Kalliope indeholder', lang)}{' '}
      <Link href={Links.searchURL(lang, '', 'dk', null, [keyword.id])}>
        {countText}
      </Link>{' '}
      {_('med nøgleordet', lang)} »{keyword.title}«.
      <style jsx>{`
        .keyword-text-count {
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
};

const RelatedKeywords = ({ related, lang }) => {
  if (related.length === 0) {
    return null;
  }
  return (
    <section>
      <SidebarMiniHeading>
        {_('Relaterede nøgleord', lang)}
      </SidebarMiniHeading>
      {related.map(keyword => {
        const url =
          keyword.redirectURL != null
            ? keyword.redirectURL.replace('${lang}', lang)
            : Links.keywordURL(lang, keyword.id);
        return (
          <div key={keyword.id}>
            <Link href={url}>{keyword.title}</Link>
          </div>
        );
      })}
    </section>
  );
};

const KeywordPage = (props) => {
  const { lang, keyword, error } = props;

  if (error != null) {
    return <ErrorPage error={error} lang={lang} message="Ukendt nøgleord" />;
  }

  const requestPath = `/${lang}/keyword/${keyword.id}`;

  const renderedPictures = (
    <SidebarPictures pictures={keyword.pictures} lang={lang} />
  );

  const danishTextCount = keyword.danish_text_count ?? 0;
  const related = keyword.related ?? [];

  const sidebar =
    danishTextCount > 0 ||
    related.length > 0 ||
    keyword.has_footnotes ||
    keyword.pictures.length > 0 ? (
      <Stack spacing="20px">
        <KeywordTextCount
          count={danishTextCount}
          keyword={keyword}
          lang={lang}
        />
        <RelatedKeywords related={related} lang={lang} />
        {keyword.has_footnotes ? <FootnoteList /> : null}
        {keyword.pictures.length > 0 ? renderedPictures : null}
      </Stack>
    ) : null;

  const crumbs = [
    ...kalliopeCrumbs(lang),
    { url: Links.keywordsURL(lang), title: _('Nøgleord', lang) },
    { title: keyword.title },
  ];
  const title = keyword.title;
  let author = null;
  if (keyword.author != null) {
    author = (
      <div style={{ fontSize: '16px', marginBottom: '40px' }}>
        Af {keyword.author}
      </div>
    );
  }
  const headTitle = `${keyword.title} - Kalliope`;
  const ogTitle = keyword.title;
  const ogDescription = OpenGraph.trimmedDescription(keyword.content_html);

  return (
    <Page
      headTitle={headTitle}
      ogTitle={ogTitle}
      ogDescription={ogDescription}
      requestPath={requestPath}
      crumbs={crumbs}
      pageTitle={title}
      menuItems={kalliopeMenu()}
      selectedMenuItem="keywords">
      <FootnoteContainer key={keyword.id}>
        <SidebarSplit sidebar={sidebar}>
          <div key="content">
            <article>
              <SubHeading>{keyword.title}</SubHeading>
              {author}
              <div style={{ lineHeight: 1.6, textAlign: 'justify' }}>
                <TextContent
                  contentHtml={keyword.content_html}
                  contentLang={keyword.content_lang}
                  lang={lang}
                />
              </div>
              <KeywordSources sources={keyword.sources} lang={lang} />
            </article>
          </div>
        </SidebarSplit>
      </FootnoteContainer>
    </Page>
  );
};

KeywordPage.getInitialProps = async ({ query: { lang, keywordId } }) => {
  const json = await Client.keyword(keywordId);
  if (json == null) {
    return { lang, error: 'Ikke fundet', keyword: null };
  } else {
    return {
      lang,
      keyword: json,
    };
  }
};

export default KeywordPage;
