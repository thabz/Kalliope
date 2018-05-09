// @flow

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
  LinesType,
  Error,
} from './helpers/types.js';

type LinesGlobalProps = {
  lang: Lang,
  country: Country,
  letter: String,
  type: LinesType,
};
export default class extends React.Component<LinesGlobalProps> {
  static async getInitialProps({
    query: { lang, country, groupBy },
  }: {
    query: { lang: Lang, country: Country, type: LinesType },
  }) {
    const json = await Client.globalLines(country, type, letter);
    return {
      lang,
      country,
      type,
      lines: json.lines,
      letters: json.letters,
      error: json.error,
    };
  }

  render() {
    const { lang, country, lines, letters, error } = this.props;

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
            selectedCountry={country}
            selectedGroupBy={groupBy}
          />
          <LangSelect lang={lang} path={requestPath} />
        </Main>
      </div>
    );
  }
}
