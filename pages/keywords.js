// @flow

import 'isomorphic-fetch';
import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import * as Links from '../components/links';
import Nav from '../components/nav';
import LangSelect from '../components/langselect.js';
import { KalliopeTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import SectionedList from '../components/sectionedlist.js';
import * as Sorting from './helpers/sorting.js';
import type { Lang, Keyword, SectionForRendering } from './helpers/types.js';
import { createURL } from './helpers/client.js';
import _ from '../pages/helpers/translations.js';

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
    const res = await fetch(createURL('/static/api/keywords.json'));
    const keywords: Array<Keyword> = await res.json();
    return { lang, keywords };
  }

  props: {
    lang: Lang,
    keywords: Array<Keyword>,
  };

  render() {
    const { lang, keywords } = this.props;

    const requestPath = `/${lang}/keywords`;

    const nonDrafts = keywords.filter(k => !k.is_draft);
    const groups = groupsByLetter(nonDrafts);
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
        <Head
          headTitle={_('Nøgleord', lang) + ' - Kalliope'}
          requestPath={requestPath}
        />
        <Main>
          <Nav lang={lang} title={_('Nøgleord', lang)} />
          <Heading title={_('Nøgleord', lang)} />
          <KalliopeTabs lang={lang} selected="keywords" />
          {renderedGroups}
          <LangSelect lang={lang} path={requestPath} />
        </Main>
      </div>
    );
  }
}
