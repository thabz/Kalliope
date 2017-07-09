// @flow

import React from 'react';
import { Link } from '../routes';
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
import type { Lang, Poet, Work } from './helpers/types.js';
import 'isomorphic-fetch';

export default class extends React.Component {
  props: {
    lang: Lang,
    poet: Poet,
    works: Array<Work>,
  };

  static async getInitialProps({
    query: { lang, poetId },
  }: {
    query: { lang: Lang, poetId: string },
  }) {
    const json = await Client.works(poetId);
    return { lang, poet: json.poet, works: json.works };
  }

  render() {
    const { lang, poet, works } = this.props;
    const list = works.length == 0
      ? <div className="nodata">
          Kalliope indeholder endnu ingen tekster fra denne digter.
        </div>
      : works
          .sort((a, b) => {
            return (a.year || 'a') > (b.year || 'a') ? 1 : -1;
          })
          .map((work, i) => {
            const workName = <WorkName work={work} />;
            const url = `/${lang}/work/${poet.id}/${work.id}`;
            const name = work.has_content
              ? <Link route={url}><a>{workName}</a></Link>
              : workName;
            return (
              <div className="list-section-line" key={work.id}>{name}</div>
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
