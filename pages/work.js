// @flow

import React from 'react';
import Link from 'next/link';
import Head from '../components/head';
import Nav from '../components/nav';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import SubHeading from '../components/subheading.js';
import PoetName from '../components/poetname.js';
import WorkName from '../components/workname.js';
import * as Links from '../components/links';
import type { Lang, Poet, Work, TocItem } from './helpers/types.js';
import 'isomorphic-fetch';

export default class extends React.Component {
  props: {
    lang: Lang,
    poet: Poet,
    work: Work,
    toc: Array<TocItem>,
  };

  static async getInitialProps({
    query: { lang, poetId, workId },
  }: {
    query: { lang: Lang, poetId: string, workId: string },
  }) {
    const res = await fetch(
      `http://localhost:3000/static/api/${poetId}/${workId}-toc.json`
    );
    const json: {
      poet: Poet,
      work: Work,
      toc: Array<TocItem>,
    } = await res.json();
    return { lang, poet: json.poet, work: json.work, toc: json.toc };
  }

  render() {
    const { lang, poet, work, toc } = this.props;

    const renderItems = (items: Array<TocItem>, indent: number = 0) => {
      return items.map((item, i) => {
        const { id, title, type } = item;
        if (type === 'section' && item.content != null) {
          const className = `toc indent-${indent}`;
          return (
            <div className={className} key={i}>
              <h3>{title}</h3>
              {renderItems(item.content, indent + 1)}
            </div>
          );
        } else if (type === 'text' && id != null) {
          const url = Links.textURL(lang, poet.id, id);
          return <div key={id}><a href={url}>{title}</a></div>;
        }
      });
    };

    const list = renderItems(toc);
    const title = <PoetName poet={poet} includePeriod />;
    return (
      <div>
        <Head title="Digtere - Kalliope" />
        <Nav lang={lang} />

        <div className="row">
          <Heading title={title} subtitle="Værker" />
          <PoetTabs lang={lang} poet={poet} selected="works" />
          <SubHeading><WorkName work={work} /></SubHeading>
          <div className="toc">
            {list}
          </div>
        </div>
      </div>
    );
  }
}
