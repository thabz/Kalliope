// @flow

import 'isomorphic-fetch';
import React from 'react';
import Head from '../components/head';
import * as Links from '../components/links';
import Nav from '../components/nav';
import LangSelect from '../components/langselect.js';
import Tabs from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import SectionedList from '../components/sectionedlist.js';
import * as Sorting from './helpers/sorting.js';
import { createURL } from './helpers/client.js';
import type {
  Lang,
  Section,
  Poet,
  SortReturn,
  SectionForRendering,
} from './helpers/types.js';

type GroupBy = 'name' | 'year';

const groupsByLetter = poets => {
  let groups = new Map();
  poets.filter(p => p.type !== 'person').forEach(p => {
    let key = 'Ukendt digter';
    if (p.name.lastname) {
      key = p.name.lastname[0];
    }
    if (key === 'A' && p.name.lastname && p.name.lastname.indexOf('Aa') === 0) {
      key = 'Å';
    }
    let group = groups.get(key) || [];
    group.push(p);
    groups.set(key, group);
  });
  let sortedGroups = [];
  groups.forEach((group, key) => {
    sortedGroups.push({
      title: key,
      items: group.sort(Sorting.poetsByLastname),
    });
  });
  return sortedGroups.sort(Sorting.sectionsByTitle);
};

const groupsByYear = (poets: Array<Poet>) => {
  let groups = new Map();
  poets.filter(p => p.type === 'poet').forEach(p => {
    let key = 'Ukendt fødeår';
    if (p.period != null && p.period.born.date !== '?') {
      const year = parseInt(p.period.born.date.substring(0, 4), 10);
      const intervalStart = year - year % 25;
      key = `${intervalStart} - ${intervalStart + 24}`;
    }
    let group = groups.get(key) || [];
    group.push(p);
    groups.set(key, group);
  });
  let sortedGroups = [];
  groups.forEach((group, key) => {
    sortedGroups.push({
      title: key,
      items: group.sort(Sorting.poetsByBirthDate),
    });
  });
  return sortedGroups.sort(Sorting.sectionsByTitle);
};

export default class extends React.Component {
  static async getInitialProps({
    query: { lang, groupBy },
  }: {
    query: { lang: Lang, groupBy: GroupBy },
  }) {
    const res = await fetch(createURL(`/static/api/poets-dk.json`));
    const poets: Array<Poet> = await res.json();
    return { lang, groupBy, poets };
  }

  props: {
    lang: Lang,
    poets: Array<Poet>,
    groupBy: GroupBy,
  };

  render() {
    const { lang, poets, groupBy } = this.props;

    const tabs = [
      { id: 'name', title: 'Efter navn', url: Links.poetsURL(lang, 'name') },
      { id: 'year', title: 'Efter år', url: Links.poetsURL(lang, 'year') },
    ];
    const selectedTabIndex = groupBy === 'name' ? 0 : 1;
    const groups = groupBy === 'name'
      ? groupsByLetter(poets)
      : groupsByYear(poets);

    let sections: Array<SectionForRendering> = [];

    groups.forEach(group => {
      const items = group.items.map(poet => {
        return {
          id: poet.id,
          url: `/${lang}/works/${poet.id}`,
          html: <PoetName poet={poet} lastNameFirst includePeriod />,
        };
      });
      sections.push({ title: group.title, items });
    });

    let renderedGroups = <SectionedList sections={sections} />;

    return (
      <div>
        <Head title="Digtere - Kalliope" />
        <div className="row">
          <Nav lang={lang} title="Digtere" />
          <Heading title="Digtere" />
          <Tabs items={tabs} selected={groupBy} />
          {renderedGroups}
          <LangSelect lang={lang} />
        </div>
      </div>
    );
  }
}
