// @flow

import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import { KalliopeTabs } from '../components/tabs.js';
import LangSelect from '../components/langselect';
import Nav, { NavPaging } from '../components/nav';
import SubHeading from '../components/subheading.js';
import SidebarSplit from '../components/sidebarsplit.js';
import * as Links from '../components/links';
import Heading from '../components/heading.js';
import TextContent from '../components/textcontent.js';
import Picture from '../components/picture.js';
import FormattedDate from '../components/formatteddate.js';
import type { Lang, NewsItem } from './helpers/types.js';
import { createURL } from './helpers/client.js';
import 'isomorphic-fetch';

class TodaysEvents extends React.Component {
  props: {
    lang: Lang,
    events: ?Array<TimelineItem>,
  };
  render() {
    const { lang, events } = this.props;
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
          <div className="today-date">
            <FormattedDate date={item.date} lang={lang} />
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
        <SubHeading>Dagen i dag</SubHeading>
        {renderedEvents}
        <style jsx>{`
          :global(div.today-item) {
            margin-bottom: 20px;
          }
          :global(div.today-date) {
            font-size: 0.8em;
            margin-bottom: 3px;
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

class News extends React.Component {
  props: {
    news: Array<NewsItem>,
    lang: Lang,
  };

  render() {
    const { lang, news } = this.props;

    const items = news.filter((_, i) => i < 5).map((item, i) => {
      const { date, content_html, title } = item;

      return (
        <div className="news-item" key={date + i}>
          <h3>
            {title}
          </h3>
          <div className="news-body">
            <TextContent contentHtml={content_html} lang={lang} />
          </div>
          <div className="news-date">
            <FormattedDate date={date} lang={lang} />
          </div>
          <style jsx>{`
            div.news-item {
              margin-bottom: 20px;
            }
            div.news-item:first-child {
              padding-bottom: 40px;
              border-bottom: 1px solid #777;
              margin-bottom: 50px;
            }

            div.news-item h3 {
              font-weight: lighter;
              font-size: 1.3em;
              margin: 0 0 20px 0;
              padding: 0;
            }
            div.news-body {
              line-height: 1.6;
              font-weight: lighter;
            }
            div.news-date {
              margin-top: 5px;
              font-weight: lighter;
              font-size: 0.8em;
              color: #777;
            }
          `}</style>
        </div>
      );
    });

    return (
      <div>
        {items}
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

    const renderedNews = <News news={news} lang={lang} />;

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
              <SubHeading>Nyheder</SubHeading>
              {renderedNews}
            </div>
          </SidebarSplit>
          <LangSelect lang={lang} />
        </Main>
      </div>
    );
  }
}
