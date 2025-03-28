import 'isomorphic-fetch';
import React, { useContext } from 'react';
import { createURL } from '../common/client.js';
import LangContext from '../common/LangContext.js';
import { kalliopeCrumbs } from '../components/breadcrumbs';
import { formattedDate } from '../components/formatteddate.js';
import { kalliopeMenu } from '../components/menu.js';
import Page from '../components/page.js';
import Picture from '../components/picture.js';
import SidebarSplit from '../components/sidebarsplit.js';
import SplitWhenSmall from '../components/split-when-small.js';
import SubHeading from '../components/subheading.js';
import TextContent from '../components/textcontent.js';

const TodaysEvents = ({ events }) => {
  const lang = useContext(LangContext);

  if (events == null || events.length == 0) {
    return null;
  }
  const nowYear = new Date().getFullYear();
  const renderedEvents = events
    .filter((item) => item.type !== 'image')
    .map((item, i) => {
      const yearsAgo = nowYear - parseInt(item.date.substring(0, 4));
      const yearHtml = (
        <div className="today-date" title={yearsAgo + ' år siden i dag'}>
          {formattedDate(item.date)}
        </div>
      );
      const html = (
        <TextContent
          contentHtml={item.content_html}
          contentLang={item.content_lang}
          lang={lang}
        />
      );
      return (
        <div className="today-item" key={i}>
          {yearHtml}
          <div className="today-body">{html}</div>
        </div>
      );
    });
  let pictureItems = events
    .filter((item) => item.type === 'image' && item.src != null)
    .map((item, i) => {
      const picture = {
        src: item.src || '',
        lang: item.content_lang,
        content_html: item.content_html,
      };
      const html = (
        <div className="picture-item">
          <Picture
            pictures={[picture]}
            lang={lang}
            contentLang={item.content_lang}
          />
        </div>
      );
      return (
        <div className="today-item" key={i}>
          <div className="today-body">{html}</div>
        </div>
      );
    });
  let pictureItem = pictureItems.length > 0 ? pictureItems[0] : null;
  return (
    <div>
      <SubHeading>Dagen i dag</SubHeading>
      <SplitWhenSmall>
        <div>{renderedEvents}</div>
        <div style={{ marginTop: '40px' }}>{pictureItem}</div>
      </SplitWhenSmall>
      <style jsx>{`
        :global(div.today-item) {
          margin-bottom: 20px;
        }
        :global(div.today-date) {
          font-size: 0.9em;
          margin-bottom: 3px;
        }
        :global(div.today-body) {
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

const News = ({ news }) => {
  const lang = useContext(LangContext);

  const items = news
    .filter((_, i) => i < 5)
    .map((item, i) => {
      const { date, content_html, content_lang, title } = item;
      let renderedTitle = null;
      if (i === 0 && title != null) {
        renderedTitle = <h3>{title}</h3>;
      }
      return (
        <div className="news-item" key={date + i}>
          {renderedTitle}
          <div className="news-body">
            <TextContent
              contentHtml={content_html}
              contentLang={content_lang}
              lang={lang}
            />
          </div>
          <div className="news-date">{formattedDate(date)}</div>
          <style jsx>{`
            div.news-item {
              margin-bottom: 20px;
            }
            div.news-item:first-child {
              padding-bottom: 40px;
              border-bottom: 1px solid #757575;
              margin-bottom: 50px;
            }

            :global(div.news-item h3) {
              font-weight: 100;
              font-size: 26px;
              margin: 0 0 20px 0;
              padding: 0;
            }
            div.news-body {
              line-height: 1.6;
            }
            div.news-date {
              margin-top: 5px;
              font-size: 0.9em;
              color: #757575;
            }
          `}</style>
        </div>
      );
    });

  return <div>{items}</div>;
};

const zeroPad = (n) => {
  return n < 10 ? `0${n}` : `${n}`;
};

let Index = (props) => {
  const { news, todaysEvents, pagingContext } = props;
  const lang = useContext(LangContext);

  const requestPath = `/${lang}/`;

  const paging =
    pagingContext != null
      ? {
          prev: {
            url: `/${lang}/?date=${pagingContext.prev}`,
            title: 'En dag tilbage',
          },
          next: {
            url: `/${lang}/?date=${pagingContext.next}`,
            title: 'En dag frem',
          },
        }
      : null;

  const sidebar = <TodaysEvents events={todaysEvents} />;

  return (
    <Page
      headTitle="Kalliope"
      pageTitle="Kalliope"
      requestPath={requestPath}
      crumbs={kalliopeCrumbs(lang)}
      menuItems={kalliopeMenu()}
      selectedMenuItem="index"
      paging={paging}
    >
      <SidebarSplit sidebar={sidebar}>
        <div>
          <News news={news} lang={lang} />
        </div>
      </SidebarSplit>
    </Page>
  );
};

Index.getInitialProps = async ({ query: { lang, date } }) => {
  if (lang == null) {
    lang = 'da';
  }
  const country = lang === 'da' ? 'dk' : 'gb';
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
    const month = parseInt(parts[0]) - 1;
    const day = parseInt(parts[1]);
    const date = new Date();
    date.setFullYear(new Date().getFullYear(), month, day);
    const prev = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    const next = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    pagingContext = {
      prev: `${zeroPad(prev.getMonth() + 1)}-${zeroPad(prev.getDate())}`,
      next: `${zeroPad(next.getMonth() + 1)}-${zeroPad(next.getDate())}`,
    };
  }
  const newsPromise = fetch(createURL(`/static/api/news_${lang}.json`));
  const todayPromise = fetch(
    createURL(`/static/api/today/${lang}/${dayAndMonth}.json`)
  );
  const todayResponse = await todayPromise;
  const newsResponse = await newsPromise;
  const todaysEvents = await todayResponse.json();
  const news = await newsResponse.json();

  return { lang, country, news, todaysEvents, pagingContext };
};

export default Index;
