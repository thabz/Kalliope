// @flow

import React from 'react';
import Link from 'next/link';
import Head from '../components/head';
import Nav from '../components/nav';
import LangSelect from '../components/langselect';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
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
      : works.map((work, i) => {
          const url = `/${lang}/work/${poet.id}/${work.id}`;
          return (
            <div className="list-section-line" key={work.id}>
              <Link href={url}><a><WorkName work={work} /></a></Link>
            </div>
          );
        });

    const title = <PoetName poet={poet} includePeriod />;
    return (
      <div>
        <Head title="Digtere - Kalliope" />
        <div className="row">
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
        </div>
      </div>
    );
  }
}
