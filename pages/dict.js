// @flow

import 'isomorphic-fetch';
import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import * as Links from '../components/links';
import Nav, { kalliopeCrumbs } from '../components/nav';
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

type DictProps = {
  lang: Lang,
  dictItems: Array<DictItem>,
};
export default class extends React.Component<DictProps> {
  static async getInitialProps({ query: { lang } }: { query: { lang: Lang } }) {
    const res = await fetch(createURL('/static/api/dict.json'));
    const dictItems: Array<DictItem> = await res.json();
    return { lang, dictItems };
  }

  render() {
    const { lang, dictItems } = this.props;
    const requestPath = `/${lang}/dict`;

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
        <Head headTitle="Ordbog - Kalliope" requestPath={requestPath} />
        <Main>
          <Nav
            lang={lang}
            crumbs={[...kalliopeCrumbs(lang), { title: 'Ordbog' }]}
          />
          <Heading title="Ordbog" />
          <KalliopeTabs lang={lang} selected="dictionary" />
          {renderedGroups}
          <LangSelect lang={lang} path={requestPath} />
        </Main>
      </div>
    );
  }
}
