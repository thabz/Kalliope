// @flow

import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import { Link } from '../routes';
import * as Links from '../components/links';
import Nav from '../components/nav';
import LangSelect from '../components/langselect.js';
import CountryPicker from '../components/countrypicker.js';
import Tabs from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import SectionedList from '../components/sectionedlist.js';
import * as Sorting from './helpers/sorting.js';
import * as Strings from './helpers/strings.js';
import _ from './helpers/translations.js';
import CommonData from '../pages/helpers/commondata.js';
import ErrorPage from './error.js';
import * as Client from './helpers/client.js';
import { createURL } from './helpers/client.js';
import type {
  Lang,
  Country,
  Section,
  Poet,
  SortReturn,
  SectionForRendering,
  Error,
} from './helpers/types.js';

type GroupBy = 'name' | 'year';

const groupsByLetter = (poets: Array<Poet>, lang: Lang) => {
  let groups = new Map();
  poets
    .filter(p => p.type !== 'person')
    .filter(p => p.type !== 'artist')
    .forEach(p => {
      let key = _('Ukendt digter', lang);
      if (p.name.lastname != null) {
        key = p.name.lastname[0];
      }
      if (
        key === 'A' &&
        p.name.lastname != null &&
        p.name.lastname.indexOf('Aa') === 0
      ) {
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

const groupsByYear = (poets: Array<Poet>, lang: Lang) => {
  let groups = new Map();
  poets.filter(p => p.type === 'poet').forEach(p => {
    let key = _('Ukendt fødeår', lang);
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

type PoetsProps = {
  lang: Lang,
  country: Country,
  poets: Array<Poet>,
  groupBy: GroupBy,
  error: ?Error,
};
export default class extends React.Component<PoetsProps> {
  static async getInitialProps({
    query: { lang, country, groupBy },
  }: {
    query: { lang: Lang, country: Country, groupBy: GroupBy },
  }) {
    const json = await Client.poets(country);
    return { lang, country, groupBy, poets: json.poets, error: json.error };
  }

  render() {
    const { lang, country, poets, groupBy, error } = this.props;

    if (error) {
      return <ErrorPage error={error} lang={lang} message="Ukendt land" />;
    }
    const requestPath = `/${lang}/poets`;

    const tabs = [
      {
        id: 'name',
        title: _('Efter navn', lang),
        url: Links.poetsURL(lang, 'name', country),
      },
      {
        id: 'year',
        title: _('Efter år', lang),
        url: Links.poetsURL(lang, 'year', country),
      },
    ];
    const selectedTabIndex = groupBy === 'name' ? 0 : 1;
    const groups =
      groupBy === 'name'
        ? groupsByLetter(poets, lang)
        : groupsByYear(poets, lang);

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
      pageTitle =
        Strings.toTitleCase(cn.adjective[lang]) + ' ' + _('digtere', lang);
    } else {
      pageTitle = _('Digtere', lang);
    }

    const countryCodeToURL = (code: Country) => {
      return Links.poetsURL(lang, groupBy, code);
    };
    return (
      <div>
        <Head
          headTitle={_('Digtere', lang) + ' - Kalliope'}
          requestPath={requestPath}
        />
        <Main>
          <Nav lang={lang} title={pageTitle} />
          <Heading title={pageTitle} />
          <Tabs items={tabs} selected={groupBy} country={country} lang={lang} />
          {renderedGroups}
          <CountryPicker
            style={{ marginTop: '40px' }}
            lang={lang}
            countryToURL={countryCodeToURL}
            selectedCountry={country}
          />
          <LangSelect lang={lang} path={requestPath} />
        </Main>
      </div>
    );
  }
}
