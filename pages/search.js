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
import PoetName from '../components/poetname.js';
import WorkName from '../components/workname.js';
import TextName from '../components/textname.js';
import * as Strings from './helpers/strings.js';
import CommonData from '../pages/helpers/commondata.js';
import * as Client from './helpers/client.js';
import type { Lang, Country, Poet } from './helpers/types.js';

export default class extends React.Component {
  static async getInitialProps({
    query: { lang, country, poetId, query },
  }: {
    query: { lang: Lang, country: Country, poetId?: string, query: string },
  }) {
    const result = await Client.search(poetId, country, query);
    return {
      lang,
      country,
      query,
      result,
    };
  }

  props: {
    lang: Lang,
    poetId: string,
    country: Country,
    query: string,
    result: any,
  };

  render() {
    const { lang, poetId, country, query, result } = this.props;

    let pageTitle = null;

    let renderedResult = null;
    if (result.hits.total === 0) {
      renderedResult = <div>Ingen søgeresultat</div>;
    } else {
      const items = result.hits.hits
        .filter(x => x._source.text != null)
        .map((hit, i) => {
          const { poet, work, text } = hit._source;
          let item = null;
          if (text == null) {
            const workURL = Links.textURL(lang, work.id);
            item = (
              <div>
                <div>
                  <Link route={textURL}><a><WorkName work={work} /></a></Link>
                </div>
                <div>
                  <PoetName poet={poet} />:{' '}
                </div>
              </div>
            );
          } else {
            const textURL = Links.textURL(lang, text.id);
            item = (
              <div>
                <div>
                  <Link route={textURL}><a><TextName text={text} /></a></Link>
                </div>
                <div>
                  <PoetName poet={poet} />:{' '}
                  <WorkName work={work} />
                </div>
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
      renderedResult = (
        <div className="result-items">
          <div className="result-count">
            Fandt {result.hits.total} resultat(er)
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
    }

    let tabs = null;
    if (poetId) {
      //tabs = <PoetTabs lang={lang} poet={poet} selected="search" />;
      tabs = <KalliopeTabs selected="search" lang={lang} />;
    } else {
      tabs = <KalliopeTabs selected="search" lang={lang} />;
    }
    return (
      <div>
        <Head headTitle="Søgeresultat - Kalliope" />
        <Main>
          <Nav lang={lang} title="Søgeresultat" />
          <Heading title={pageTitle} />
          {tabs}
          {renderedResult}
          <LangSelect lang={lang} />
        </Main>
      </div>
    );
  }
}
