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
    const res = await fetch(
      `http://localhost:3000/static/api/${poetId}/works.json`
    );
    const json: { poet: Poet, works: Array<Work> } = await res.json();
    return { lang, poet: json.poet, works: json.works };
  }

  render() {
    const { lang, poet, works } = this.props;
    const list = works.map((work, i) => {
      const url = `/${lang}/work/${poet.id}/${work.id}`;
      return (
        <div className="list-section-line" key={work.id}>
          <a href={url}><WorkName work={work} /></a>
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
          </div>
          <LangSelect lang={lang} />
        </div>
      </div>
    );
  }
}
