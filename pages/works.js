// @flow

import React from 'react';
import { Link, Router } from '../routes';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav from '../components/nav';
import LangSelect from '../components/langselect';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName, { poetNameString } from '../components/poetname.js';
import WorkName from '../components/workname.js';
import * as Links from '../components/links';
import * as Client from './helpers/client.js';
import ErrorPage from './error.js';
import type { Lang, Poet, Work, Error } from './helpers/types.js';
import 'isomorphic-fetch';

export default class extends React.Component {
  props: {
    lang: Lang,
    poet: Poet,
    works: Array<Work>,
    Error: ?Error,
  };

  static async getInitialProps({
    query: { lang, poetId },
  }: {
    query: { lang: Lang, poetId: string },
  }) {
    const json = await Client.works(poetId);

    return { lang, poet: json.poet, works: json.works, error: json.error };
  }

  render() {
    const { lang, poet, works, error } = this.props;

    if (error) {
      return <ErrorPage error={error} lang={lang} message="Ukendt digter" />;
    }

    if (works.length === 0) {
      const bioURL = Links.bioURL(lang, poet.id);
      Router.replaceRoute(bioURL);
      return null;
    }

    const sortWorks = works => {
      if (poet.id === 'bibel') {
        return works;
      } else {
        return works.sort((a, b) => {
          if (a.id === 'andre') {
            return 1;
          } else if (b.id === 'andre') {
            return -1;
          } else {
            const aKey =
              a.year == null || a.year === '?' ? a.title : a.year + a.id;
            const bKey =
              b.year == null || b.year === '?' ? b.title : b.year + b.id;
            return aKey > bKey ? 1 : -1;
          }
        });
      }
    };

    const list =
      works.length == 0
        ? <div className="nodata">
            Kalliope indeholder endnu ingen tekster fra denne digter.
          </div>
        : sortWorks(works).map((work, i) => {
            const workName = <WorkName work={work} />;
            const url = `/${lang}/work/${poet.id}/${work.id}`;
            const name = work.has_content
              ? <Link route={url}>
                  <a title={work.year}>
                    {workName}
                  </a>
                </Link>
              : workName;
            return (
              <div className="list-section-line" key={i + work.id}>
                {name}
              </div>
            );
          });

    const title = <PoetName poet={poet} includePeriod />;
    const headTitle = poetNameString(poet, false, false) + ' - Kalliope';
    return (
      <div>
        <Head headTitle={headTitle} />
        <Main>
          <Nav lang={lang} poet={poet} title="Værker" />
          <Heading title={title} subtitle="Værker" />
          <PoetTabs lang={lang} poet={poet} selected="works" />
          <div className="two-columns" style={{ lineHeight: 1.5 }}>
            {list}
            <style jsx>{`
              :global(.nodata) {
                padding: 30px 0;
                font-weight: lighter;
              }
            `}</style>
          </div>
          <LangSelect lang={lang} />
        </Main>
      </div>
    );
  }
}
