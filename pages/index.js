// @flow

import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import { KalliopeTabs } from '../components/tabs.js';
import LangSelect from '../components/langselect';
import Nav, { NavPaging } from '../components/nav';
import SidebarSplit from '../components/sidebarsplit.js';
import * as Links from '../components/links';
import Heading from '../components/heading.js';
import TextContent from '../components/textcontent.js';
import Picture from '../components/picture.js';
import type { Lang, NewsItem } from './helpers/types.js';
import { createURL } from './helpers/client.js';
import 'isomorphic-fetch';

class TodaysEvents extends React.Component {
  props: {
    events: ?Array<TimelineItem>,
  };
  render() {
    const { events } = this.props;
    if (events == null || events.length == 0) {
      return null;
    }
    const renderedEvents = events.map((item, i) => {
      let html = null;
      let yearHtml = null;
      if (item.type === 'image' && item.src != null) {
        const picture: PictureItem = {
          src: item.src,
          lang: item.lang,
          content_html: item.content_html,
        };
        html = (
          <div style={{ marginTop: '30px' }}>
            <Picture picture={picture} lang={item.lang} srcPrefix="/static" />
          </div>
        );
      } else {
        yearHtml = (
          <div className="today-year">
            {item.date.substring(0, 4)}
          </div>
        );
        html = <TextContent contentHtml={item.content_html} lang={item.lang} />;
      }
      return (
        <div className="today-item" key={i}>
          {yearHtml}
          <div className="today-body">
            {html}
          </div>
        </div>
      );
    });
    return (
      <div>
        <h2>Dagen i dag</h2>
        {renderedEvents}
        <style jsx>{`
          h2 {
            font-weight: lighter;
            font-size: 18px;
            line-height: 18px;
            margin: 0 0 20px 0;
            padding: 0;
          }
          :global(div.today-item) {
            margin-bottom: 10px;
          }
          :global(div.today-date) {
            text-align: rigth;
          }
          :global(div.today-body) {
            line-height: 1.6;
            font-weight: lighter;
          }
        `}</style>
      </div>
    );
  }
}

const zeroPad = n => {
  return n < 10 ? `0${n}` : n;
};

export default class extends React.Component {
  props: {
    lang: Lang,
    news: Array<NewsItem>,
    todaysEvents: Array<TimelineItem>,
    pagingContext: ?{
      prev: string, // mm-dd
      next: string, // mm-dd
    },
  };

  static async getInitialProps({
    query: { lang, date },
  }: {
    query: { lang: Lang, date?: string },
  }) {
    if (lang == null) {
      lang = 'da';
    }
    let dayAndMonth = date;
    let pagingContext = null;
    if (dayAndMonth == null) {
      const date = new Date();
      const day = zeroPad(date.getDate());
      const month = zeroPad(date.getMonth() + 1);
      dayAndMonth = `${month}-${day}`;
    } else {
      // For debugging we accept an URL-param date with the format 'MM-DD'.
      // When that exists we enable the paging arrow on the top of the page.
      const parts = dayAndMonth.split('-');
      const date = new Date();
      date.setFullYear(new Date().getFullYear(), parts[0] - 1, parts[1]);
      const prev = new Date(date.getTime() - 24 * 60 * 60 * 1000);
      const next = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      pagingContext = {
        prev: `${zeroPad(prev.getMonth() + 1)}-${zeroPad(prev.getDate())}`,
        next: `${zeroPad(next.getMonth() + 1)}-${zeroPad(next.getDate())}`,
      };
    }
    let res = await fetch(createURL(`/static/api/news_${lang}.json`));
    const news: Array<NewsItem> = await res.json();
    res = await fetch(
      createURL(`/static/api/today/${lang}/${dayAndMonth}.json`)
    );
    const todaysEvents: Array<TimelineItem> = await res.json();
    return { lang, news, todaysEvents, pagingContext };
  }

  render() {
    const { lang, news, todaysEvents, pagingContext } = this.props;

    const renderedNews = news.filter((_, i) => i < 5).map((item, i) => {
      return (
        <div className="news-item" key={item.date + i}>
          <div className="news-date">
            {item.date}
          </div>
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

    let navPaging = null;
    if (pagingContext != null) {
      let prevURL = {
        url: `/${lang}?date=${pagingContext.prev}`,
        title: 'En dag tilbage',
      };
      let nextURL = {
        url: `/${lang}?date=${pagingContext.next}`,
        title: 'En dag frem',
      };
      navPaging = <NavPaging prev={prevURL} next={nextURL} />;
    }

    const sidebar = <TodaysEvents events={todaysEvents} />;

    return (
      <div>
        <Head headTitle="Kalliope" />
        <Main>
          <Nav lang="da" rightSide={navPaging} />
          <Heading title="Kalliope" />
          <KalliopeTabs lang={lang} selected="index" />
          <SidebarSplit sidebar={sidebar}>
            <div>
              {renderedNews}
            </div>
          </SidebarSplit>
          <LangSelect lang={lang} />
        </Main>
      </div>
    );
  }
}
