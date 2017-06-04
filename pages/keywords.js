// @flow

import 'isomorphic-fetch';
import React from 'react';
import Link from 'next/link';
import Head from '../components/head';
import * as Links from '../components/links';
import Nav from '../components/nav';
import LangSelect from '../components/langselect.js';
import { KalliopeTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import SectionedList from '../components/sectionedlist.js';
import * as Sorting from './helpers/sorting.js';
import type { Lang, Keyword, SectionForRendering } from './helpers/types.js';

const groupsByLetter = (keywords: Array<Keyword>) => {
  let groups = new Map();
  keywords.forEach(k => {
    let key = k.title[0];
    let group = groups.get(key) || [];
    group.push(k);
    groups.set(key, group);
  });
  let sortedGroups = [];
  groups.forEach((group, key) => {
    sortedGroups.push({
      title: key,
      items: group.sort(Sorting.keywordsByTitle),
    });
  });
  return sortedGroups.sort(Sorting.sectionsByTitle);
};

export default class extends React.Component {
  static async getInitialProps({ query: { lang } }: { query: { lang: Lang } }) {
    const res = await fetch('http://localhost:3000/static/api/keywords.json');
    const keywords: Array<Keyword> = await res.json();
    return { lang, keywords };
  }

  props: {
    lang: Lang,
    keywords: Array<Keyword>,
  };

  render() {
    const { lang, keywords } = this.props;

    const groups = groupsByLetter(keywords);
    let sections: Array<SectionForRendering> = [];

    groups.forEach(group => {
      const items = group.items.map(keyword => {
        return {
          id: keyword.id,
          url: Links.keywordURL(lang, keyword.id),
          html: keyword.title,
        };
      });
      sections.push({ title: group.title, items });
    });

    let renderedGroups = <SectionedList sections={sections} />;

    return (
      <div>
        <Head title="Nøgleord - Kalliope" />
        <div className="row">
          <Nav lang={lang} title="Nøgleord" />
          <Heading title="Nøgleord" />
          <KalliopeTabs lang={lang} selected="keywords" />
          {renderedGroups}
          <LangSelect lang={lang} />
        </div>
      </div>
    );
  }
}
