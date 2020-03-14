// @flow

import 'isomorphic-fetch';
import React, { useEffect, useState } from 'react';
import Page from '../components/page.js';
import { Link } from '../routes';
import * as Links from '../components/links';
import {
  kalliopeCrumbs,
  poetCrumbsWithTitle,
} from '../components/breadcrumbs.js';
import LangSelect from '../components/langselect.js';
import { kalliopeMenu, poetMenu } from '../components/menu.js';
import {
  poetNameString,
  poetGenetiveLastName,
} from '../components/poetname-helpers.js';
import PoetName from '../components/poetname.js';
import WorkName from '../components/workname.js';
import TextName from '../components/textname.js';
import * as Strings from '../common/strings.js';
import CommonData from '../common/commondata.js';
import ErrorPage from './error.js';
import * as Client from '../common/client.js';
import type { Lang, Country, Poet, PoetId, Error } from '../common/types.js';
import _ from '../common/translations.js';

type SearchProps = {
  lang: Lang,
  poet: ?Poet,
  country: Country,
  query: string,
  firstPageHits: [],
  totalHits: number,
  error: ?Error,
};
const SearchPage = (props: SearchProps) => {
  const { lang, poet, country, query, totalHits, error } = props;
  let resultPage = 0;

  const [hits, setHits] = useState(props.firstPageHits);
  const [isFetchingMore, setFetchingMore] = useState(false);

  const fetchMoreItems = async () => {
    if (hits.length === totalHits || isFetchingMore) {
      return;
    }
    setFetchingMore(true);
    const result = await Client.search(
      poet != null ? poet.id : '',
      country,
      query,
      resultPage + 1
    );
    resultPage += 1;
    if (result.hits.total > 0 && result.hits.hits.length > 0) {
      setHits(hits.concat(result.hits.hits));
    }
    setFetchingMore(false);
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

  if (error != null) {
    return <ErrorPage error={error} lang={lang} message="Søgning fejlede" />;
  }

  const items = hits
    .filter(x => x._source.text != null)
    .map((hit, i) => {
      const { poet, work, text } = hit._source;
      const { highlight } = hit;
      let item = null;
      if (text == null) {
        const workURL = Links.textURL(lang, work.id);
        item = (
          <div>
            <div>
              <Link route={workURL}>
                <a>
                  <WorkName work={work} lang={lang} />
                </a>
              </Link>
            </div>
            <div>
              <PoetName poet={poet} />:{' '}
            </div>
          </div>
        );
      } else {
        const textURL = Links.textURL(lang, text.id);
        let renderedHighlight = null;
        if (highlight && highlight['text.content_html']) {
          // The query is highlighted in each line using <em> by Elasticsearch
          const lines = highlight['text.content_html'];
          renderedHighlight = lines.map((line, i) => {
            let parts = line
              .replace(/\s+/g, ' ')
              .replace(/^[\s,.!:;?\d"“„]+/, '')
              .replace(/[\s,.!:;?\d"“„]+$/, '')
              .split(/<\/?em>/);
            parts[1] = <em key={i}>{parts[1]}</em>;
            return <div key={i}>{parts}</div>;
          });
        }
        item = (
          <div>
            <div className="title">
              <Link route={textURL}>
                <a>
                  <TextName text={text} />
                </a>
              </Link>
            </div>
            <div className="hightlights">{renderedHighlight}</div>
            <div className="poet-and-work">
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
          `}</style>
        </div>
      );
    });

  let resultaterOrd = null;
  let linkToFullSearch = null;
  if (totalHits === 0) {
    resultaterOrd = 'ingen resultater';
  } else if (totalHits > 1) {
    resultaterOrd = totalHits + ' resultater';
  } else {
    resultaterOrd = totalHits + ' resultat';
  }
  let resultaterBeskrivelse = `Fandt ${resultaterOrd} ved søgning efter »${query}«`;
  if (poet != null) {
    const genetive = poetGenetiveLastName(poet, lang);
    resultaterBeskrivelse += ` i ${genetive} værker.`;
    const fullSearchURL = Links.searchURL(lang, query, country);
    linkToFullSearch = <Link route={fullSearchURL}>Søg i hele Kalliope.</Link>;
  } else if (country != 'dk') {
    const countryData = CommonData.countries.filter(x => x.code === country);
    if (countryData.length > 0) {
      const adjective = countryData[0].adjective[lang];
      resultaterBeskrivelse += ` i den ${adjective} samling.`;
    }
  }

  const renderedResult = (
    <div className="result-items">
      <div className="result-count">
        {resultaterBeskrivelse} {linkToFullSearch}
      </div>
      {items}
      <style jsx>{`
        .result-count {
          margin-bottom: 30px;
        }
        .result-items {
          line-height: 1.5;
        }
      `}</style>
    </div>
  );

  let henterFlere = null;
  if (isFetchingMore) {
    henterFlere = <div style={{ marginBottom: '500px' }}>Henter flere...</div>;
  }

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
      requestPath={`/${lang}/search/${country}?query=${query}`}
      crumbs={crumbs}
      pageTitle={pageTitle}
      query={query}
      country={country}
      menuItems={tabs}
      selectedMenuItem="search">
      {renderedResult}
      {henterFlere}
    </Page>
  );
};

SearchPage.getInitialProps = async ({
  query: { lang, country, poetId, query },
}: {
  query: { lang: Lang, country: Country, poetId?: PoetId, query: string },
}) => {
  const result = await Client.search(poetId, country, query, 0);
  const poet = await Client.poet(poetId);

  return {
    lang,
    country,
    query,
    totalHits: result.hits.total,
    firstPageHits: result.hits.hits,
    poet,
    error: result.error,
  };
};

export default SearchPage;
