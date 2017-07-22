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
import TwoColumns from '../components/twocolumns.js';
import * as Links from '../components/links';
import type {
  Lang,
  Poet,
  DateWithPlace,
  PictureItem,
  TimelineItem,
} from './helpers/types.js';
import { createURL } from './helpers/client.js';
import 'isomorphic-fetch';

class DateAndPlace extends React.Component {
  props: {
    datePlace?: DateWithPlace,
  };
  render() {
    const { datePlace } = this.props;
    if (datePlace == null) {
      return <div>Ukendt år</div>;
    }
    let result = '';
    if (datePlace.date === '?') {
      result += 'Ukendt år';
    } else {
      result += datePlace.date;
    }
    if (datePlace.place != null) {
      result += `, ${datePlace.place}`;
    }
    return <div>{result}</div>;
  }
}

class PersonMetaLine extends React.Component {
  props: {
    label: string,
    value: any,
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
        <div style={styles.key}>{label}</div>
        <div>{value}</div>
      </div>
    );
  }
}

class PersonMeta extends React.Component {
  props: {
    poet: Poet,
  };
  render() {
    const { poet } = this.props;
    if (poet.type === 'collection') {
      return null;
    }
    const name = <PoetName poet={poet} />;
    let born, dead;
    if (poet.period != null) {
      born = (
        <DateAndPlace datePlace={poet.period.born} nullText="Ukendt fødeår" />
      );
      dead = (
        <DateAndPlace datePlace={poet.period.dead} nullText="Ukendt dødsår" />
      );
    }
    return (
      <div>
        <PersonMetaLine value={name} label="Navn" />
        <PersonMetaLine value={poet.name.fullname} label="Fulde navn" />
        <PersonMetaLine
          value={poet.name.christened || poet.name.realname}
          label="Døbt"
        />
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
      const year = curYear !== prevYear ? <div>{curYear}</div> : null;
      prevYear = curYear;

      let html = null;
      if (item.type === 'image' && item.src != null) {
        const picture: PictureItem = {
          src: item.src,
          lang: item.lang,
          content_html: item.content_html,
        };
        html = (
          <Picture picture={picture} lang={item.lang} srcPrefix="/static" />
        );
      } else {
        html = <TextContent contentHtml={item.content_html} lang={item.lang} />;
      }

      return (
        <div key={i} style={{ marginBottom: '10px', breakInside: 'avoid' }}>
          <div style={{ float: 'left' }}>{year}</div>
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
        <TwoColumns>{items}</TwoColumns>
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
    content_html: string,
  };

  static async getInitialProps({
    query: { lang, poetId },
  }: {
    query: { lang: Lang, poetId: string },
  }) {
    const res = await fetch(createURL(`/static/api/${poetId}/bio.json`));
    const json: {
      poet: Poet,
      portrait?: PictureItem,
      timeline: Array<TimelineItem>,
      content_html: string,
    } = await res.json();
    return {
      lang,
      portrait: json.portrait,
      poet: json.poet,
      content_html: json.content_html,
      timeline: json.timeline,
    };
  }

  render() {
    const { lang, poet, portrait, content_html, timeline } = this.props;
    const title = <PoetName poet={poet} includePeriod />;
    const headTitle = poetNameString(poet, false, false) + ' - Kalliope';
    return (
      <div>
        <Head headTitle={headTitle} />
        <Main>
          <Nav lang={lang} poet={poet} title="Værker" />
          <Heading title={title} subtitle="Værker" />
          <PoetTabs lang={lang} poet={poet} selected="bio" />
          <SidebarSplit>
            <div style={{ lineHeight: '1.6' }}>
              <TextContent contentHtml={content_html} lang={lang} />
              <Timeline timeline={timeline} />
            </div>
            <div>
              <div className="horizontal-on-small">
                <PersonMeta poet={poet} />
                <div style={{ width: '100%', marginTop: '40px' }}>
                  <PersonPortrait poet={poet} portrait={portrait} lang={lang} />
                </div>
                <style jsx>{`
                  .horizontal-on-small {
                    display: flex;
                    flex-direction: column;
                  }
                  @media (max-width: 700px) {
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
            </div>
          </SidebarSplit>
          <LangSelect lang={lang} />
        </Main>
      </div>
    );
  }
}
