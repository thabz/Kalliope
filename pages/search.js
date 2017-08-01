// @flow

import 'isomorphic-fetch';
import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import { Link } from '../routes';
import * as Links from '../components/links';
import Nav from '../components/nav';
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
import * as Client from './helpers/client.js';
import type { Lang, Country, Poet, PoetId } from './helpers/types.js';

export default class extends React.Component {
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
    };
  }

  props: {
    lang: Lang,
    poet: ?Poet,
    country: Country,
    query: string,
    result: any,
  };

  render() {
    const { lang, poet, country, query, result } = this.props;

    let items = [];
    if (result.hits.total > 0) {
      items = result.hits.hits
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
                  <Link route={workURL}><a><WorkName work={work} /></a></Link>
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
              renderedHighlight = lines.map(line => {
                let parts = line
                  .replace(/\s+/g, ' ')
                  .replace(/^[\s,.!:;?"“„]+/, '')
                  .replace(/[\s,.!:;?"“„]+$/, '')
                  .split(/<\/?em>/);
                parts[1] = <em>{parts[1]}</em>;
                return <div>{parts}</div>;
              });
            }
            item = (
              <div>
                <div className="title">
                  <Link route={textURL}><a><TextName text={text} /></a></Link>
                </div>
                <div className="hightlights">{renderedHighlight}</div>
                <div className="poet-and-work">
                  <PoetName poet={poet} />:{' '}
                  <WorkName work={work} />
                </div>
                <style jsx>{`
                  .title {
                    font-size: 1.15em;
                  }
                  .hightlights {
                    color: #888;
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
      linkToFullSearch = <Link route={fullSearchURL}>Søg i hele Kalliope</Link>;
    } else if (country != 'dk') {
      const countryData = CommonData.countries.filter(x => x.code === country);
      if (countryData.length > 0) {
        const adjective = countryData[0].adjective[lang];
        resultaterBeskrivelse += ` i den ${adjective} samling`;
      }
    }

    const renderedResult = (
      <div className="result-items">
        <div className="result-count">
          {resultaterBeskrivelse}{' '}{linkToFullSearch}
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
      nav = <Nav lang={lang} poet={poet} title="Søgeresultat" />;
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
      nav = <Nav lang={lang} title="Søgeresultat" />;
    }
    return (
      <div>
        <Head headTitle={headTitle} />
        <Main>
          {nav}
          <Heading title={pageTitle} />
          {tabs}
          {renderedResult}
          <LangSelect lang={lang} />
        </Main>
      </div>
    );
  }
}
