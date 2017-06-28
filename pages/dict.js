// @flow

import 'isomorphic-fetch';
import React from 'react';
import Head from '../components/head';
import * as Links from '../components/links';
import Nav from '../components/nav';
import LangSelect from '../components/langselect.js';
import { KalliopeTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import SectionedList from '../components/sectionedlist.js';
import * as Sorting from './helpers/sorting.js';
import type { Lang, DictItem, SectionForRendering } from './helpers/types.js';
import { createURL } from './helpers/client.js';

const groupsByLetter = (dictItems: Array<DictItem>) => {
  let groups = new Map();
  dictItems.forEach(k => {
    let key = k.title.replace(/^aa/i, 'Å')[0].toLocaleUpperCase('da');
    let group = groups.get(key) || [];
    group.push(k);
    groups.set(key, group);
  });
  let sortedGroups = [];
  groups.forEach((group, key) => {
    sortedGroups.push({
      title: key,
      items: group.sort(Sorting.dictItemsByTitle),
    });
  });
  return sortedGroups.sort(Sorting.sectionsByTitle);
};

export default class extends React.Component {
  static async getInitialProps({ query: { lang } }: { query: { lang: Lang } }) {
    const res = await fetch(
      createURL('http://localhost:3000/static/api/dict.json')
    );
    const dictItems: Array<DictItem> = await res.json();
    return { lang, dictItems };
  }

  props: {
    lang: Lang,
    dictItems: Array<DictItem>,
  };

  render() {
    const { lang, dictItems } = this.props;

    const groups = groupsByLetter(dictItems);
    let sections: Array<SectionForRendering> = [];

    groups.forEach(group => {
      const items = group.items.map((item, i) => {
        return {
          id: item.id + '.' + i,
          url: Links.dictionaryURL(lang, item.id),
          html: item.title,
        };
      });
      sections.push({ title: group.title, items });
    });

    let renderedGroups = <SectionedList sections={sections} />;

    return (
      <div>
        <Head title="Ordbog - Kalliope" />
        <div className="row">
          <Nav lang={lang} title="Nøgleord" />
          <Heading title="Ordbog" />
          <KalliopeTabs lang={lang} selected="dictionary" />
          {renderedGroups}
          <LangSelect lang={lang} />
        </div>
      </div>
    );
  }
}
