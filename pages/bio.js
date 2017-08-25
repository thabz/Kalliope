// @flow

import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav from '../components/nav';
import SidebarSplit from '../components/sidebarsplit.js';
import LangSelect from '../components/langselect';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName, { poetNameString } from '../components/poetname.js';
import WorkName from '../components/workname.js';
import Picture from '../components/picture.js';
import TextContent from '../components/textcontent.js';
import FormattedDate from '../components/formatteddate.js';
import TwoColumns from '../components/twocolumns.js';
import ErrorPage from './error.js';
import * as Links from '../components/links';
import * as Client from './helpers/client.js';
import * as OpenGraph from './helpers/opengraph.js';

import type {
  Lang,
  Poet,
  DateWithPlace,
  PictureItem,
  TimelineItem,
  TextContentType,
  Error,
} from './helpers/types.js';
import { createURL } from './helpers/client.js';

const dateAndPlace = (
  datePlace: ?DateWithPlace,
  lang: Lang
): Array<?React$Element<*>> => {
  if (datePlace == null) {
    return 'Ukendt år';
  }
  let result = [];
  if (datePlace.date === '?') {
    result.push('Ukendt år');
  } else {
    result.push(
      <FormattedDate key={datePlace.date} date={datePlace.date} lang={lang} />
    );
  }
  if (datePlace.place != null) {
    result.push(
      <span key="place">
        {', ' + datePlace.place}
      </span>
    );
  }
  return result;
};

class PersonMetaLine extends React.Component {
  props: {
    label: string,
    value: string | ?React$Element<*> | Array<?React$Element<*>>,
  };
  render() {
    const { label, value } = this.props;
    if (value == null) {
      return null;
    }
    const styles = {
      key: {
        fontWeight: 'bold',
        fontSize: '0.8em',
      },
      item: {
        marginBottom: '10px',
      },
    };
    return (
      <div style={styles.item}>
        <div style={styles.key}>
          {label}
        </div>
        <div>
          {value}
        </div>
      </div>
    );
  }
}

class PersonMeta extends React.Component {
  props: {
    poet: Poet,
    lang: Lang,
  };
  render() {
    const { poet, lang } = this.props;
    if (poet.type === 'collection') {
      return null;
    }
    const name = <PoetName poet={poet} />;
    let born =
      poet.period == null ? null : dateAndPlace(poet.period.born, lang);
    let dead =
      poet.period == null ? null : dateAndPlace(poet.period.dead, lang);

    const christened =
      poet.name.christened == null ? poet.name.realname : poet.name.christened;
    return (
      <div>
        <PersonMetaLine value={name} label="Navn" />
        <PersonMetaLine value={poet.name.fullname} label="Fulde navn" />
        <PersonMetaLine value={christened} label="Døbt" />
        <PersonMetaLine value={poet.name.pseudonym} label="Pseudonym" />
        <PersonMetaLine value={born} label="Født" />
        <PersonMetaLine value={dead} label="Død" />
      </div>
    );
  }
}

class PersonPortrait extends React.Component {
  props: {
    poet: Poet,
    portrait?: PictureItem,
    lang: Lang,
  };
  render() {
    const { portrait, poet, lang } = this.props;
    if (!poet.has_portraits || portrait == null) {
      return null;
    }
    const srcPrefix = `/static/images/${poet.id}`;
    return (
      <Picture picture={portrait} lang={portrait.lang} srcPrefix={srcPrefix} />
    );
  }
}

class Timeline extends React.Component {
  props: {
    timeline: Array<TimelineItem>,
  };
  render() {
    const { timeline } = this.props;
    if (timeline.length === 0) {
      return null;
    }
    let prevYear = null;
    const items = timeline.map((item, i) => {
      const curYear = item.date.substring(0, 4);
      const year =
        curYear !== prevYear
          ? <div>
              {curYear}
            </div>
          : null;
      prevYear = curYear;

      let html = null;
      if (item.type === 'image' && item.src != null) {
        const picture: PictureItem = {
          src: item.src,
          lang: item.lang,
          content_html: item.content_html,
        };
        html = (
          <div style={{ paddingTop: '0.37em' }}>
            <Picture picture={picture} lang={item.lang} srcPrefix="/static" />
          </div>
        );
      } else {
        html = <TextContent contentHtml={item.content_html} lang={item.lang} />;
      }

      return (
        <div key={i} style={{ marginBottom: '10px', breakInside: 'avoid' }}>
          <div style={{ float: 'left' }}>
            {year}
          </div>
          <div
            style={{
              marginLeft: '50px',
              color: item.is_history_item ? '#666' : 'black',
            }}>
            {html}
          </div>
        </div>
      );
    });
    return (
      <div className="timeline">
        <TwoColumns>
          {items}
        </TwoColumns>
      </div>
    );
  }
}

export default class extends React.Component {
  props: {
    lang: Lang,
    portrait?: PictureItem,
    poet: Poet,
    timeline: Array<TimelineItem>,
    content_html: TextContentType,
    Error: ?Error,
  };

  static async getInitialProps({
    query: { lang, poetId },
  }: {
    query: { lang: Lang, poetId: string },
  }) {
    const json = await Client.bio(poetId);
    return {
      lang,
      portrait: json.portrait,
      poet: json.poet,
      content_html: json.content_html,
      timeline: json.timeline,
      error: json.error,
    };
  }

  render() {
    const { lang, poet, portrait, content_html, timeline, error } = this.props;

    if (error) {
      return <ErrorPage error={error} lang={lang} message="Ukendt person" />;
    }

    const sidebarItems = (
      <div className="horizontal-on-small" key="first-and-on">
        <PersonMeta poet={poet} lang={lang} />
        <div style={{ width: '100%', marginTop: '40px' }}>
          <PersonPortrait poet={poet} portrait={portrait} lang={lang} />
        </div>
        <style jsx>{`
          .horizontal-on-small {
            display: flex;
            flex-direction: column;
          }
          @media (max-width: 800px) {
            .horizontal-on-small {
              flex-direction: row;
              justify-content: space-between;
              width: 100%;
            }
            .horizontal-on-small > * {
              flex-basis: 50%;
              margin: 0 !important;
            }
          }
        `}</style>
      </div>
    );

    const title = <PoetName poet={poet} includePeriod />;
    const headTitle =
      'Biografi  - ' + poetNameString(poet, false, false) + ' - Kalliope';

    const ogDescription = OpenGraph.trimmedDescription(content_html);
    const ogImage = OpenGraph.poetImage(poet);
    const ogTitle = poetNameString(poet, false, false) + ' biografi';

    return (
      <div>
        <Head
          headTitle={headTitle}
          ogTitle={ogTitle}
          ogImage={ogImage}
          description={ogDescription}
        />
        <Main>
          <Nav lang={lang} poet={poet} title="Biografi" />
          <Heading title={title} subtitle="Værker" />
          <PoetTabs lang={lang} poet={poet} selected="bio" />
          <SidebarSplit sidebar={sidebarItems}>
            <div style={{ lineHeight: '1.6' }}>
              <TextContent
                contentHtml={content_html}
                lang={lang}
                className="bio-text"
                style={{ marginBottom: '40px' }}
              />
              <Timeline timeline={timeline} />
              <style jsx>{`
                @media (max-width: 800px) {
                  :global(.bio-text) {
                    border-bottom: 1px solid #666;
                    padding-bottom: 40px;
                  }
                }
              `}</style>
            </div>
          </SidebarSplit>
          <LangSelect lang={lang} />
        </Main>
      </div>
    );
  }
}
