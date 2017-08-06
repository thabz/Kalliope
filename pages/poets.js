// @flow

import 'isomorphic-fetch';
import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import { Link } from '../routes';
import * as Links from '../components/links';
import Nav from '../components/nav';
import LangSelect from '../components/langselect.js';
import Tabs from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import SectionedList from '../components/sectionedlist.js';
import * as Sorting from './helpers/sorting.js';
import * as Strings from './helpers/strings.js';
import CommonData from '../pages/helpers/commondata.js';
import { createURL } from './helpers/client.js';
import type {
  Lang,
  Country,
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
    if (
      p.period != null &&
      p.period.born != null &&
      p.period.born.date !== '?'
    ) {
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

function joinWithCommaAndOr(items, andOrWord) {
  const result = [];
  items.forEach((item, i) => {
    result.push(item);
    if (i == items.length - 2) {
      result.push(' ' + andOrWord + ' ');
    } else if (i < items.length - 2) {
      result.push(<span style={{ marginLeft: '-0.25em' }}>, </span>);
    }
  });
  return result;
}

class CountryPicker extends React.Component {
  props: {
    lang: Lang,
    selectedCountry: Country,
    selectedGroupBy: GroupBy,
    style: any,
  };
  render() {
    const { lang, selectedCountry, selectedGroupBy, style } = this.props;
    const items = CommonData.countries.map(country => {
      const url = Links.poetsURL(lang, selectedGroupBy, country.code);
      const adj = country.adjective[lang] + ' ';
      if (country.code === selectedCountry) {
        return (
          <b key={country.code}>
            {adj}
          </b>
        );
      } else {
        return (
          <Link route={url} key={country.code}>
            <a>
              {adj}
            </a>
          </Link>
        );
      }
    });
    const joinedItems = joinWithCommaAndOr(items, 'eller');
    return (
      <div style={style}>
        <div>
          Skift mellem {joinedItems} digtere.
        </div>
      </div>
    );
  }
}

export default class extends React.Component {
  static async getInitialProps({
    query: { lang, country, groupBy },
  }: {
    query: { lang: Lang, country: Country, groupBy: GroupBy },
  }) {
    const url = `/static/api/poets-${country}.json`;
    const res = await fetch(createURL(url));
    const poets: Array<Poet> = await res.json();
    return { lang, country, groupBy, poets };
  }

  props: {
    lang: Lang,
    country: Country,
    poets: Array<Poet>,
    groupBy: GroupBy,
  };

  render() {
    const { lang, country, poets, groupBy } = this.props;

    const tabs = [
      {
        id: 'name',
        title: 'Efter navn',
        url: Links.poetsURL(lang, 'name', country),
      },
      {
        id: 'year',
        title: 'Efter år',
        url: Links.poetsURL(lang, 'year', country),
      },
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

    let pageTitle = null;

    if (country !== 'dk') {
      const cn = CommonData.countries.filter(c => {
        return c.code === country;
      })[0];
      pageTitle = Strings.toTitleCase(cn.adjective[lang]) + ' ' + ' digtere';
    } else {
      pageTitle = 'Digtere';
    }
    return (
      <div>
        <Head headTitle="Digtere - Kalliope" />
        <Main>
          <Nav lang={lang} title="Digtere" />
          <Heading title={pageTitle} />
          <Tabs items={tabs} selected={groupBy} country={country} lang={lang} />
          {renderedGroups}
          <CountryPicker
            style={{ marginTop: '40px' }}
            lang={lang}
            selectedCountry={country}
            selectedGroupBy={groupBy}
          />
          <LangSelect lang={lang} />
        </Main>
      </div>
    );
  }
}
