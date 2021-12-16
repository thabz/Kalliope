// @flow

import React, { useContext } from 'react';
import Page from '../components/page.js';
import Head from '../components/head';
import Main from '../components/main.js';
import { Link } from '../routes';
import * as Links from '../components/links';
import { kalliopeCrumbs } from '../components/breadcrumbs.js';
import LangSelect from '../components/langselect.js';
import LangContext from '../common/LangContext.js';
import CountryPicker from '../components/countrypicker.js';
import Tabs from '../components/menu.js';
import PoetName from '../components/poetname.js';
import SectionedList from '../components/sectionedlist.js';
import * as Sorting from '../common/sorting.js';
import * as Strings from '../common/strings.js';
import _ from '../common/translations.js';
import CommonData from '../common/commondata.js';
import ErrorPage from './error.js';
import * as Client from '../common/client.js';
import { createURL } from '../common/client.js';

const nvl = (x, v) => {
  return x == null ? v : x;
};

const groupsByLetter = (poets, lang) => {
  let groups = new Map();

  poets
    .filter((p) => p.type !== 'person')
    .filter((p) => p.type !== 'artist')
    .forEach((p) => {
      let key = null;
      if (p.name.sortname != null) {
        key = p.name.sortname[0];
        if (key === 'A' && p.name.sortname.indexOf('Aa') === 0) {
          key = 'Å';
        }
      } else if (p.name.lastname != null) {
        key = p.name.lastname[0];
        if (key === 'A' && p.name.lastname.indexOf('Aa') === 0) {
          key = 'Å';
        }
      } else {
        key = _('Ukendt digter', lang);
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

const groupsByYear = (poets, lang) => {
  let groups = new Map();
  poets
    .filter((p) => p.type === 'poet')
    .forEach((p) => {
      let key = _('Ukendt fødeår', lang);
      if (
        p.period != null &&
        p.period.born != null &&
        p.period.born.date !== '?'
      ) {
        const year = parseInt(p.period.born.date.substring(0, 4), 10);
        const intervalStart = year - (year % 25);
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

const Poets = (props) => {
  const { country, poets, groupBy, error } = props;
  const lang = useContext(LangContext);

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

  let sections = [];

  groups.forEach((group) => {
    const items = group.items.map((poet) => {
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
    const cn = CommonData.countries.filter((c) => {
      return c.code === country;
    })[0];
    pageTitle =
      Strings.toTitleCase(cn.adjective[lang]) + ' ' + _('digtere', lang);
  } else {
    pageTitle = _('Digtere', lang);
  }

  const countryCodeToURL = (code) => {
    return Links.poetsURL(lang, groupBy, code);
  };
  return (
    <Page
      headTitle={_('Digtere', lang) + ' - Kalliope'}
      requestPath={requestPath}
      crumbs={[...kalliopeCrumbs(lang), { title: pageTitle }]}
      menuItems={tabs}
      selectedMenuItem={groupBy}
      country={country}
      pageTitle={pageTitle}
    >
      {renderedGroups}
      <CountryPicker
        style={{ marginTop: '40px' }}
        lang={lang}
        countryToURL={countryCodeToURL}
        selectedCountry={country}
      />
    </Page>
  );
};

Poets.getInitialProps = async ({ query: { lang, country, groupBy } }) => {
  const json = await Client.poets(country);
  return { lang, country, groupBy, poets: json.poets, error: json.error };
};

export default Poets;
