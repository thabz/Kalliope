// @flow

import 'isomorphic-fetch';
import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import { Link } from '../routes';
import * as Links from '../components/links';
import Nav, { kalliopeCrumbs, poetCrumbsWithTitle } from '../components/nav';
import LangSelect from '../components/langselect.js';
import { KalliopeTabs, PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName, {
  poetNameString,
  poetGenetiveLastName,
} from '../components/poetname.js';
import WorkName from '../components/workname.js';
import TextName from '../components/textname.js';
import * as Strings from './helpers/strings.js';
import CommonData from '../pages/helpers/commondata.js';
import ErrorPage from './error.js';
import * as Client from './helpers/client.js';
import type { Lang, Country, Poet, PoetId, Error } from './helpers/types.js';
import _ from './helpers/translations.js';

type SearchProps = {
  lang: Lang,
  poet: ?Poet,
  country: Country,
  query: string,
  result: any,
  error: ?Error,
};
export default class extends React.Component<SearchProps> {
  resultPage: number;
  hits: Array<any>;
  isAppending: boolean;

  async appendItems() {
    const { poet, country, query } = this.props;
    this.isAppending = true;
    const result = await Client.search(
      poet != null ? poet.id : '',
      country,
      query,
      this.resultPage + 1
    );
    this.resultPage += 1;
    if (result.hits.total > 0 && result.hits.hits.length > 0) {
      this.hits = this.hits.concat(result.hits.hits);
    }
    if (this.hits.length === this.props.result.hits.total) {
      this.disableInfiniteScrolling();
    }
    this.isAppending = false;
    this.forceUpdate();
  }

  scrollListener() {
    if (this.hits.length === this.props.result.hits.total || this.isAppending) {
      return;
    }
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
        this.appendItems();
      }
    }
  }

  enableInfiniteScrolling() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.scrollListener);
      window.addEventListener('resize', this.scrollListener);
    }
  }

  disableInfiniteScrolling() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.scrollListener);
      window.removeEventListener('resize', this.scrollListener);
    }
  }

  constructor(props: any) {
    super(props);
    this.appendItems = this.appendItems.bind(this);
    this.scrollListener = this.scrollListener.bind(this);
    this.hits = [];
    this.isAppending = false;
    this.resultPage = 0;
  }

  static async getInitialProps({
    query: { lang, country, poetId, query },
  }: {
    query: { lang: Lang, country: Country, poetId?: PoetId, query: string },
  }) {
    const result = await Client.search(poetId, country, query);
    const poet = await Client.poet(poetId);
    return {
      lang,
      country,
      query,
      result,
      poet,
      error: result.error,
    };
  }

  // Clientside refresh
  componentWillReceiveProps(newProps: any) {
    const { result, error } = newProps;
    if (error != null) {
      return;
    }
    if (result.hits.total > 0) {
      this.hits = result.hits.hits;
    } else {
      this.hits = [];
    }
    this.resultPage = 0;
    if (this.hits.length < result.hits.total) {
      this.enableInfiniteScrolling();
      // Check scrollposition after
      setTimeout(this.scrollListener, 500);
    } else {
      this.disableInfiniteScrolling();
    }
  }

  // Serverside refresh
  componentWillMount() {
    const { result, error } = this.props;
    if (error != null) {
      return;
    }
    if (result.hits.total > 0) {
      this.hits = result.hits.hits;
    } else {
      this.hits = [];
    }
    this.resultPage = 0;
    if (this.hits.length < result.hits.total) {
      this.enableInfiniteScrolling();
      setTimeout(this.scrollListener, 500);
    } else {
      this.disableInfiniteScrolling();
    }
  }

  render() {
    const { lang, poet, country, query, result, error } = this.props;

    if (error != null) {
      return <ErrorPage error={error} lang={lang} message="Søgning fejlede" />;
    }

    let items = [];
    if (result.hits.total > 0) {
      items = this.hits
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
                    font-weight: lighter;
                  }
                  .poet-and-work {
                    font-weight: lighter;
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
    }
    const antal = result.hits.total;
    let resultaterOrd = null;
    let linkToFullSearch = null;
    if (antal === 0) {
      resultaterOrd = 'ingen resultater';
    } else if (antal > 1) {
      resultaterOrd = antal + ' resultater';
    } else {
      resultaterOrd = antal + ' resultat';
    }
    let resultaterBeskrivelse = `Fandt ${resultaterOrd} ved søgning efter »${query}«`;
    if (poet != null) {
      const genetive = poetGenetiveLastName(poet, lang);
      resultaterBeskrivelse += ` i ${genetive} værker.`;
      const fullSearchURL = Links.searchURL(lang, query, country);
      linkToFullSearch = (
        <Link route={fullSearchURL}>Søg i hele Kalliope.</Link>
      );
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
    if (this.hits.length < result.hits.total) {
      henterFlere = (
        <div style={{ marginBottom: '500px' }}>Henter flere...</div>
      );
    }

    let tabs = null;
    let headTitle = null;
    let pageTitle = null;
    let nav = null;
    if (poet != null) {
      tabs = (
        <PoetTabs lang={lang} poet={poet} selected="search" query={query} />
      );
      headTitle =
        'Søgning - ' + poetNameString(poet, false, false) + ' - Kalliope';
      pageTitle = <PoetName poet={poet} includePeriod />;
      nav = (
        <Nav
          lang={lang}
          crumbs={poetCrumbsWithTitle(lang, poet, _('Søgeresultat', lang))}
        />
      );
    } else {
      tabs = (
        <KalliopeTabs
          selected="search"
          lang={lang}
          country={country}
          query={query}
        />
      );
      headTitle = 'Søgning - Kalliope';
      pageTitle = 'Kalliope';
      const crumbs = [
        ...kalliopeCrumbs(lang),
        { title: _('Søgeresultat', lang) },
      ];
      nav = <Nav lang={lang} crumbs={crumbs} />;
    }
    return (
      <div>
        <Head headTitle={headTitle} />
        <Main>
          {nav}
          <Heading title={pageTitle} />
          {tabs}
          {renderedResult}
          {henterFlere}
          <LangSelect lang={lang} />
        </Main>
      </div>
    );
  }
}
