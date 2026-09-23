import Link from 'next/link';
import Router from 'next/router';
import { useContext, useEffect, useState } from 'react';
import * as Client from '../common/client.js';
import CommonData from '../common/commondata.js';
import LangContext from '../common/LangContext.js';
import _ from '../common/translations.js';
import {
  kalliopeCrumbs,
  poetCrumbsWithTitle,
} from '../components/breadcrumbs.js';
import * as Links from '../components/links.js';
import { kalliopeMenu, poetMenu } from '../components/menu.js';
import Page from '../components/page.js';
import {
  poetNameString,
} from '../components/poetname-helpers.js';
import PoetName from '../components/poetname.js';
import TextName from '../components/textname.js';
import WorkName from '../components/workname.js';
import ErrorPage from './error.js';

export const totalHitsValue = (hits) => hits.total.value;

export const parseKeywordIds = value => {
  if (value == null || value.length === 0) {
    return [];
  }
  return Array.from(
    new Set(
      value
        .split(',')
        .map(keywordId => keywordId.trim())
        .filter(keywordId => keywordId.length > 0)
    )
  );
};

export const singleMatchingTextIdResultURL = (lang, query, result) => {
  if (
    query == null ||
    result == null ||
    result.error != null ||
    result.hits == null
  ) {
    return null;
  }

  const normalizedQuery = query.trim();
  const hits = result.hits.hits || [];
  if (totalHitsValue(result.hits) !== 1 || hits.length !== 1) {
    return null;
  }

  const hit = hits[0];
  const text = hit._source && hit._source.text;
  if (
    hit._source == null ||
    hit._source.result_type !== 'text' ||
    text == null ||
    text.id !== normalizedQuery
  ) {
    return null;
  }

  return Links.textURL(lang, text.id);
};

const ResultTypeLabel = ({ children }) => (
  <span className="result-type">
    {children}
    <style jsx>{`
      .result-type {
        color: ${CommonData.lightTextColor};
      }
    `}</style>
  </span>
);

const renderHighlightFragment = (line, keyPrefix = '') => {
  return line
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.!:;?\d"“„]+/, '')
    .replace(/[\s,.!:;?\d"“„]+$/, '')
    .split(/(<\/?em>)/)
    .reduce(
      (acc, part) => {
        if (part === '<em>') {
          acc.highlight = true;
        } else if (part === '</em>') {
          acc.highlight = false;
        } else if (part.length > 0) {
          acc.parts.push(
            acc.highlight ? (
              <em key={`${keyPrefix}em-${acc.parts.length}`}>{part}</em>
            ) : (
              part
            )
          );
        }
        return acc;
      },
      { parts: [], highlight: false }
    ).parts;
};

const RenderedHits = ({ hits }) => {
  const lang = useContext(LangContext);

  return hits
    .filter((x) =>
      ['keyword', 'poet', 'work', 'text'].includes(x._source.result_type)
    )
    .map((hit, i) => {
      const { keyword, poet, work, text } = hit._source;
      const { highlight } = hit;
      let item = null;
      if (hit._source.result_type === 'keyword') {
        const keywordURL =
          keyword.redirectURL != null
            ? keyword.redirectURL.replace('${lang}', lang)
            : Links.keywordURL(lang, keyword.id);
        item = (
          <div>
            <div className="title">
              <Link href={keywordURL}>{keyword.title}</Link>
            </div>
            <div className="poet-and-work">
              <ResultTypeLabel>{_('Nøgleord', lang)}</ResultTypeLabel>
            </div>
            <style jsx>{`
              .title {
                font-size: 1.15em;
              }
            `}</style>
          </div>
        );
      } else if (hit._source.result_type === 'poet') {
        const poetURL = Links.poetURL(lang, poet.id);
        item = (
          <div>
            <div className="title">
              <Link href={poetURL}>
                <PoetName poet={poet} includePeriod />
              </Link>
            </div>
            <div className="poet-and-work">
              <ResultTypeLabel>{_('Digter', lang)}</ResultTypeLabel>
            </div>
            <style jsx>{`
              .title {
                font-size: 1.15em;
              }
            `}</style>
          </div>
        );
      } else if (hit._source.result_type === 'work') {
        const workURL = Links.workURL(lang, poet.id, work.id);
        const highlightedWorkTitle =
          highlight && highlight['work.title']
            ? renderHighlightFragment(highlight['work.title'][0], hit._id)
            : null;
        item = (
          <div>
            <div className="title">
              <Link href={workURL}>
                {highlightedWorkTitle || <WorkName work={work} lang={lang} />}
              </Link>
            </div>
            <div className="poet-and-work">
              <ResultTypeLabel>{_('Værk', lang)}</ResultTypeLabel>
              {' · '}
              <PoetName poet={poet} />
            </div>
            <style jsx>{`
              .title {
                font-size: 1.15em;
              }
            `}</style>
          </div>
        );
      } else {
        const textURL = Links.textURL(lang, text.id);
        const highlightedTextTitle =
          highlight && highlight['text.title']
            ? renderHighlightFragment(highlight['text.title'][0], hit._id)
            : null;
        let renderedHighlight = null;
        if (highlight && highlight['text.content_html']) {
          // The query is highlighted in each line using <em> by Elasticsearch
          const lines = highlight['text.content_html'];
          renderedHighlight = lines.map((line, i) => {
            return (
              <div key={i}>
                {renderHighlightFragment(line, `${hit._id}-${i}`)}
              </div>
            );
          });
        }
        item = (
          <div>
            <div className="title">
              <Link href={textURL}>
                {highlightedTextTitle || <TextName text={text} />}
              </Link>
            </div>
            <div className="hightlights">{renderedHighlight}</div>
            <div className="poet-and-work">
              <ResultTypeLabel>{_('Tekst', lang)}</ResultTypeLabel>
              {' · '}
              <PoetName poet={poet} />: <WorkName work={work} lang={lang} />
            </div>
            <style jsx>{`
              .title {
                font-size: 1.15em;
              }
              .hightlights {
                color: ${CommonData.lightTextColor};
              }
            `}</style>
          </div>
        );
      }
      return (
        <div key={hit._id} className="result-item">
          {item}
          <style jsx>{`
            .result-item {
              margin-bottom: 20px;
            }
            .result-item::before {
              content: '${i + 1}';
            }
          `}</style>
        </div>
      );
    });
};

const collectionLabels = {
  dk: { da: 'dansk', en: 'Danish', fr: 'danoise', de: 'dänisch' },
  gb: { da: 'engelsk', en: 'English', fr: 'anglaise', de: 'englisch' },
  de: { da: 'tysk', en: 'German', fr: 'allemande', de: 'deutsch' },
  fr: { da: 'fransk', en: 'French', fr: 'française', de: 'französisch' },
  se: { da: 'svensk', en: 'Swedish', fr: 'suédoise', de: 'schwedisch' },
  no: { da: 'norsk', en: 'Norwegian', fr: 'norvégienne', de: 'norwegisch' },
  it: { da: 'italiensk', en: 'Italian', fr: 'italienne', de: 'italienisch' },
  us: {
    da: 'amerikansk',
    en: 'North American',
    fr: 'nord-américaine',
    de: 'nordamerikanisch',
  },
  un: { da: 'anden', en: 'other', fr: 'autre', de: 'sonstige' },
};

const FilterChip = ({ href, label, removeLabel }) => (
  <Link href={href} className="filter-chip" aria-label={removeLabel}>
    <span>{label}</span>
    <span aria-hidden="true">×</span>
  </Link>
);

export const SearchFilters = ({ country, keywordFilters, lang, poet, query }) => {
  const keywordIds = keywordFilters.map(keyword => keyword.id);
  const filters = [];
  if (query.length > 0) {
    filters.push({
      id: 'query',
      label: `${_('Fritekst', lang)}: ${query}`,
      href: Links.searchURL(lang, '', country, poet?.id ?? null, keywordIds),
    });
  }
  keywordFilters.forEach(keyword => {
    filters.push({
      id: `keyword-${keyword.id}`,
      label: `${_('Nøgleord', lang)}: ${keyword.title}`,
      href: Links.searchURL(
        lang,
        query,
        country,
        poet?.id ?? null,
        keywordIds.filter(keywordId => keywordId !== keyword.id)
      ),
    });
  });
  if (poet != null) {
    filters.push({
      id: 'poet',
      label: `${_('Digter', lang)}: ${poetNameString(poet, false, false)}`,
      href: Links.searchURL(lang, query, country, null, keywordIds),
    });
  }
  if (country !== 'all') {
    const collectionLabel = collectionLabels[country]?.[lang] ?? country;
    filters.push({
      id: 'country',
      label: `${_('Samling', lang)}: ${collectionLabel}`,
      href: Links.searchURL(lang, query, 'all', poet?.id ?? null, keywordIds),
    });
  }
  if (filters.length === 0) {
    return null;
  }
  return (
    <div className="search-filters" aria-label={_('Aktive filtre', lang)}>
      {filters.map(filter => (
        <FilterChip
          key={filter.id}
          href={filter.href}
          label={filter.label}
          removeLabel={_('Fjern filteret {filter}', lang, {
            filter: filter.label,
          })}
        />
      ))}
      <style jsx>{`
        .search-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 0 0 20px;
        }
        .search-filters :global(a.filter-chip) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          border-radius: 16px;
          background: ${CommonData.backgroundLinkColor};
          text-decoration: none;
        }
      `}</style>
    </div>
  );
};

const SearchPage = (props) => {
  const { lang, poet, country, query, keywordFilters } = props;
  const keywordIds = keywordFilters.map(keyword => keyword.id);
  const [error, setError] = useState(null);
  const [hits, setHits] = useState([]);
  const [isFetchingMore, setFetchingMore] = useState(false);
  const [totalHits, setTotalHits] = useState(0);
  const [resultPage, setResultPage] = useState(0);
  const [redirectURL, setRedirectURL] = useState(null);

  const fetchMoreItems = async () => {
    if (isFetchingMore || hits.length >= totalHits) {
      return;
    }
    setFetchingMore(true);
    const result = await Client.search(
      poet != null ? poet.id : '',
      country,
      query,
      resultPage + 1,
      keywordIds
    );
    setFetchingMore(false);
    if (result.error != null) {
      setError(result.error);
    } else {
      setResultPage(resultPage + 1);
      if (
        totalHitsValue(result.hits) > 0 &&
        result.hits.hits.length > 0
      ) {
        setHits(hits.concat(result.hits.hits));
      }
    }
  };

  const scrollListener = () => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const body = document.body || {};
      const html = document.documentElement || {};

      // See https://stackoverflow.com/a/1147768/1514022
      const documentHeight = Math.max(
        body.scrollHeight || 0,
        body.offsetHeight || 0,
        html.clientHeight || 0,
        html.scrollHeight || 0,
        html.offsetHeight || 0
      );
      if (window.pageYOffset + window.innerHeight > documentHeight - 600) {
        fetchMoreItems();
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', scrollListener);
      window.addEventListener('resize', scrollListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', scrollListener);
        window.removeEventListener('resize', scrollListener);
      }
    };
  });

  useEffect(() => {
    const asyncLoad = async () => {
      if (
        query.trim().length === 0 &&
        keywordIds.length === 0 &&
        poet == null
      ) {
        setError(null);
        setResultPage(0);
        setHits([]);
        setTotalHits(0);
        setRedirectURL(null);
        return;
      }
      const result = await Client.search(
        poet != null ? poet.id : '',
        country,
        query,
        0,
        keywordIds
      );
      if (result.error != null) {
        setError(result.error);
      } else {
        const textURL = singleMatchingTextIdResultURL(lang, query, result);
        if (textURL != null) {
          setRedirectURL(textURL);
          Router.replace(textURL);
          return;
        }
        setResultPage(0);
        setHits(result.hits.hits);
        setTotalHits(totalHitsValue(result.hits));
      }
    };
    asyncLoad();
  }, [country, lang, poet, query, keywordIds.join(',')]);

  if (error != null) {
    return <ErrorPage error={error} lang={lang} message="Søgning fejlede" />;
  }

  if (redirectURL != null) {
    return null;
  }

  const resultaterBeskrivelse = _(
    totalHits === 1 ? '{count} resultat fundet' : '{count} resultater fundet',
    lang,
    { count: totalHits }
  );
  const henterFlere = isFetchingMore ? (
    <div style={{ marginBottom: '500px' }}>Henter flere...</div>
  ) : null;

  let tabs = null;
  let headTitle = null;
  let pageTitle = null;
  let nav = null;
  let crumbs = null;

  if (poet != null) {
    tabs = poetMenu(poet);
    headTitle =
      'Søgning - ' + poetNameString(poet, false, false) + ' - Kalliope';
    pageTitle = <PoetName poet={poet} includePeriod />;
    crumbs = poetCrumbsWithTitle(lang, poet, _('Søgeresultat', lang));
  } else {
    tabs = kalliopeMenu();
    headTitle = 'Søgning - Kalliope';
    pageTitle = 'Kalliope';
    crumbs = [...kalliopeCrumbs(lang), { title: _('Søgeresultat', lang) }];
  }

  return (
    <Page
      headTitle={headTitle}
      requestPath={Links.searchURL(
        lang,
        query,
        country,
        poet?.id ?? null,
        keywordIds
      )}
      crumbs={crumbs}
      pageTitle={pageTitle}
      query={query}
      keywordIds={keywordIds}
      country={country}
      menuItems={tabs}
      poet={poet}
      selectedMenuItem="search">
      <div className="result-items">
        <SearchFilters
          country={country}
          keywordFilters={keywordFilters}
          lang={lang}
          poet={poet}
          query={query}
        />
        <div className="result-count">
          {resultaterBeskrivelse}
        </div>
        <RenderedHits hits={hits} />
        <style jsx>{`
          .result-count {
            margin-bottom: 30px;
          }
          .result-items {
            line-height: 1.5;
          }
        `}</style>
      </div>

      {henterFlere}
    </Page>
  );
};

SearchPage.getInitialProps = async ({
  query: { lang, country, poetId, query, keyword },
}) => {
  const keywordIds = parseKeywordIds(keyword);
  const [poet, ...keywordResponses] = await Promise.all([
    Client.poet(poetId),
    ...keywordIds.map(keywordId => Client.keyword(keywordId)),
  ]);
  const keywordFilters = keywordResponses.map((response, index) => ({
    id: keywordIds[index],
    title:
      response != null && response.error == null
        ? response.title
        : keywordIds[index],
  }));
  return {
    lang,
    country: country ?? 'dk',
    query: query ?? '',
    poet,
    keywordFilters,
  };
};

export default SearchPage;
