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
import PoetName, { poetNameString } from '../components/poetname.js';
import Picture from '../components/picture.js';
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
  PictureItem,
} from './helpers/types.js';

type GroupBy = 'name' | 'year';

function joinWithCommaAndOr(
  items: Array<string | React$Element<*>>,
  andOrWord
) {
  const result = [];
  items.forEach((item, i) => {
    result.push(item);
    if (i == items.length - 2) {
      result.push(' ' + andOrWord + ' ');
    } else if (i < items.length - 2) {
      result.push(
        <span key={i} style={{ marginLeft: '-0.25em' }}>
          ,{' '}
        </span>
      );
    }
  });
  return result;
}

type CountryPickerProps = {
  lang: Lang,
  selectedCountry: Country,
  selectedGroupBy: GroupBy,
  style: any,
};
class CountryPicker extends React.Component<CountryPickerProps> {
  render() {
    const { lang, selectedCountry, selectedGroupBy, style } = this.props;
    const items = CommonData.countries.map(country => {
      const url = Links.poetsURL(lang, selectedGroupBy, country.code);
      const adj = country.adjective[lang] + ' ';
      if (country.code === selectedCountry) {
        return <b key={country.code}>{adj}</b>;
      } else {
        return (
          <Link route={url} key={country.code}>
            <a>{adj}</a>
          </Link>
        );
      }
    });
    const joinedItems = joinWithCommaAndOr(items, 'eller');
    return (
      <div style={style}>
        <div>Skift mellem {joinedItems} digtere.</div>
      </div>
    );
  }
}

type MissingPortraitProps = {
  poet: Poet,
  lang: Lang,
};
class MissingPortrait extends React.Component<MissingPortraitProps> {
  render() {
    const { lang, poet } = this.props;
    const style = {
      display: 'inline-block',
      border: '3px dotted black',
      width: '100%',
      height: '300px',
      borderRadius: '20px',
    };
    return (
      <div>
        <div style={style} />
        <div style={{ fontSize: '0.8em', marginTop: '8px' }}>
          <PoetName poet={poet} includePeriod />
        </div>
      </div>
    );
  }
}

type PoetLooksProps = {
  lang: Lang,
  country: Country,
  poets: Array<Poet>,
  groupBy: GroupBy,
};
export default class extends React.Component<PoetLooksProps> {
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
      {
        id: 'looks',
        title: 'Efter udseende',
        url: Links.poetsURL(lang, 'looks', country),
      },
    ];

    let renderedPortraits = poets.map((poet, i) => {
      if (poet.type === 'collection') {
        return null;
      }
      const url = Links.bioURL(lang, poet.id);
      let item = null;
      if (poet.portrait != null) {
        const name = `<a href="/${lang}/bio/${poet.id}">${poetNameString(
          poet,
          false,
          true
        )}</a>`;
        const picture: PictureItem = {
          src: poet.portrait,
          content_html: [[name, { html: true }]],
          content_lang: 'da',
        };
        const srcPrefix = `/static/images/${poet.id}`;
        item = (
          <Picture
            pictures={[picture]}
            lang={lang}
            srcPrefix={srcPrefix}
            contentLang={'da'}
          />
        );
      } else {
        item = (
          <Link key={poet.id} route={url}>
            <a>
              <MissingPortrait poet={poet} lang={lang} />
            </a>
          </Link>
        );
      }
      const q = poetNameString(poet).replace(/ /g, '+');
      //const searchURL = `https://duckduckgo.com/?q=${q}&t=osx&ia=images&iax=1`;
      const searchURL = `https://www.google.dk/search?tbm=isch&q=${q}&tbs=imgo:1&gws_rd=c`;
      return (
        <div style={{ flexBasis: '30%', marginTop: '30px' }} key={poet.id}>
          {item}
          <a style={{ fontSize: '0.8em' }} href={searchURL} target="search">
            Søg
          </a>
        </div>
      );
    });

    let pageTitle = null;
    const requestPath = `/${lang}/poets-looks}`;

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
          <Nav lang={lang} title={pageTitle} />
          <Heading title={pageTitle} />
          <Tabs items={tabs} selected="looks" country={country} lang={lang} />
          <div className="picture-container">{renderedPortraits}</div>
          <CountryPicker
            style={{ marginTop: '40px' }}
            lang={lang}
            selectedCountry={country}
            selectedGroupBy={groupBy}
          />
          <LangSelect lang={lang} path={requestPath} />
          <style jsx>{`
            .picture-container {
              display: flex;
              flex-wrap: wrap;
              justify-content: space-between;
              align-items: flex-start;
            }
          `}</style>
        </Main>
      </div>
    );
  }
}
