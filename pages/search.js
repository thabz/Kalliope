import React, { useContext, useEffect, useState } from 'react';
import * as Client from '../common/client.js';
import CommonData from '../common/commondata.js';
import LangContext from '../common/LangContext.js';
import _ from '../common/translations.js';
import {
  kalliopeCrumbs,
  poetCrumbsWithTitle,
} from '../components/breadcrumbs.js';
import * as Links from '../components/links';
import { kalliopeMenu, poetMenu } from '../components/menu.js';
import Page from '../components/page.js';
import {
  poetGenetiveLastName,
  poetNameString,
} from '../components/poetname-helpers.js';
import PoetName from '../components/poetname.js';
import TextName from '../components/textname.js';
import WorkName from '../components/workname.js';
import { Link } from '../routes';
import ErrorPage from './error.js';

const RenderedHits = ({ hits }) => {
  const lang = useContext(LangContext);

  return hits
    .filter((x) => x._source.text != null)
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
            .result-item::before {
              content: '${i + 1}';
            }
          `}</style>
        </div>
      );
    });
};

const SearchPage = (props) => {
  const { lang, poet, country, query } = props;
  const [error, setError] = useState(null);
  const [hits, setHits] = useState([]);
  const [isFetchingMore, setFetchingMore] = useState(false);
  const [totalHits, setTotalHits] = useState(0);
  const [resultPage, setResultPage] = useState(0);

  const fetchMoreItems = async () => {
    if (isFetchingMore || hits.length >= totalHits) {
      return;
    }
    setFetchingMore(true);
    const result = await Client.search(
      poet != null ? poet.id : '',
      country,
      query,
      resultPage + 1
    );
    setFetchingMore(false);
    if (result.error != null) {
      setError(result.error);
    } else {
      setResultPage(resultPage + 1);
      if (result.hits.total > 0 && result.hits.hits.length > 0) {
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
      const result = await Client.search(
        poet != null ? poet.id : '',
        country,
        query,
        0
      );
      if (result.error != null) {
        setError(result.error);
      } else {
        setResultPage(0);
        setHits(result.hits.hits);
        setTotalHits(result.hits.total);
      }
    };
    asyncLoad();
  }, [query, poet]);

  if (error != null) {
    return <ErrorPage error={error} lang={lang} message="Søgning fejlede" />;
  }

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
    linkToFullSearch = (
      <Link route={fullSearchURL}>
        <a>Søg i hele Kalliope.</a>
      </Link>
    );
  } else if (country != 'dk') {
    const countryData = CommonData.countries.filter((x) => x.code === country);
    if (countryData.length > 0) {
      const adjective = countryData[0].adjective[lang];
      resultaterBeskrivelse += ` i den ${adjective} samling.`;
    }
  }

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
      requestPath={`/${lang}/search/${country}?query=${query}`}
      crumbs={crumbs}
      pageTitle={pageTitle}
      query={query}
      country={country}
      menuItems={tabs}
      poet={poet}
      selectedMenuItem="search"
    >
      <div className="result-items">
        <div className="result-count">
          {resultaterBeskrivelse} {linkToFullSearch}
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
  query: { lang, country, poetId, query },
}) => {
  const poet = await Client.poet(poetId);
  return {
    lang,
    country,
    query,
    poet,
  };
};

export default SearchPage;
