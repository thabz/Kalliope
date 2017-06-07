// @flow

import React from 'react';
import Link from 'next/link';
import Head from '../components/head';
import Nav from '../components/nav';
import SidebarSplit from '../components/sidebarsplit.js';
import LangSelect from '../components/langselect';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import WorkName from '../components/workname.js';
import TextContent from '../components/textcontent.js';
import * as Links from '../components/links';
import type { Lang, Poet } from './helpers/types.js';
import 'isomorphic-fetch';

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
    const name = <PoetName poet={poet} />;
    const fullName = (() => {
      return poet.name.fullname;
    })();
    return (
      <div>
        <PersonMetaLine value={name} label="Navn" />
        <PersonMetaLine value={poet.name.fullname} label="Fulde navn" />
      </div>
    );
  }
}

export default class extends React.Component {
  props: {
    lang: Lang,
    poet: Poet,
    content_html: string,
  };

  static async getInitialProps({
    query: { lang, poetId },
  }: {
    query: { lang: Lang, poetId: string },
  }) {
    const res = await fetch(
      `http://localhost:3000/static/api/${poetId}/bio.json`
    );
    const json: { poet: Poet, content_html: string } = await res.json();
    return { lang, poet: json.poet, content_html: json.content_html };
  }

  render() {
    const { lang, poet, content_html } = this.props;
    const title = <PoetName poet={poet} includePeriod />;
    return (
      <div>
        <Head title="Digtere - Kalliope" />
        <div className="row">
          <Nav lang={lang} poet={poet} title="Værker" />
          <Heading title={title} subtitle="Værker" />
          <PoetTabs lang={lang} poet={poet} selected="bio" />
          <SidebarSplit>
            <div style={{ lineHeight: '1.6' }}>
              <TextContent contentHtml={content_html} lang={lang} />
            </div>
            <PersonMeta poet={poet} />
          </SidebarSplit>
          <LangSelect lang={lang} />
        </div>
      </div>
    );
  }
}
