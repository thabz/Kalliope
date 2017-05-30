// @flow

import Link from 'next/link';
import React from 'react';
import Head from '../components/head';
import Tabs from '../components/tabs';
import Nav from '../components/nav';
import * as Links from '../components/links';
import Heading from '../components/heading.js';

export default class extends React.Component {
  render() {
    const { lang } = this.props;
    const tabs = [
      { id: 'index', title: 'Kalliope', url: '/' },
      { id: 'poets', title: 'Digtere', url: Links.poetsURL(lang, 'year') },
    ];

    return (
      <div>
        <Head title="Digtere - Kalliope" />
        <div className="row">
          <Nav lang="da" />
          <Heading title="Kalliope" subtitle="Spring/summer 2017" />
          <Tabs items={tabs} selected="index" />
          <div className="two-columns">
            Nyheder kommer her
          </div>
        </div>
      </div>
    );
  }
}
