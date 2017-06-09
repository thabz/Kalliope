// @flow

import Link from 'next/link';
import React from 'react';
import Head from '../components/head';
import { KalliopeTabs } from '../components/tabs.js';
import LangSelect from '../components/langselect';
import Nav from '../components/nav';
import SidebarSplit from '../components/sidebarsplit.js';
import * as Links from '../components/links';
import Heading from '../components/heading.js';
import TextContent from '../components/textcontent.js';
import type { Lang, NewsItem } from './helpers/types.js';
import 'isomorphic-fetch';

export default class extends React.Component {
  props: {
    lang: Lang,
    news: Array<NewsItem>,
  };

  static async getInitialProps({ query: { lang } }: { query: { lang: Lang } }) {
    if (lang == null) {
      lang = 'da';
    }
    const res = await fetch(
      `http://localhost:3000/static/api/news_${lang}.json`
    );
    const news: Array<NewsItem> = await res.json();
    return { lang, news };
  }

  render() {
    const { lang, news } = this.props;

    const renderedNews = news.filter((_, i) => i < 5).map(item => {
      return (
        <div className="news-item">
          <div className="news-date">{item.date}</div>
          <div className="news-body">
            <TextContent contentHtml={item.content_html} lang={lang} />
          </div>
          <style jsx>{`
              div.news-item {
                margin-bottom: 40px;
              }
              div.news-date {
                text-align: right;
                margin-bottom: 10px;
              }
              div.news-body {
                line-height: 1.6;
                font-weight: lighter;
              }
          `}</style>
        </div>
      );
    });

    return (
      <div>
        <Head title="Digtere - Kalliope" />
        <div className="row">
          <Nav lang="da" />
          <Heading title="Kalliope" />
          <KalliopeTabs lang={lang} selected="index" />
          <SidebarSplit>
            <div>
              {renderedNews}
            </div>
            <div />
          </SidebarSplit>
          <LangSelect lang={lang} />
        </div>
      </div>
    );
  }
}
