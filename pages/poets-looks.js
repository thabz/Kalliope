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

class MissingPortrait extends React.Component {
  props: {
    poet: Poet,
    lang: Lang,
  };
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
      let item = null;
      if (poet.portrait != null) {
        const name = poetNameString(poet, false, true);
        const picture = {
          src: poet.portrait,
          content_html: [[name, { html: true }]],
        };
        const srcPrefix = `/static/images/${poet.id}`;
        item = <Picture picture={picture} lang={lang} srcPrefix={srcPrefix} />;
      } else {
        item = <MissingPortrait poet={poet} lang={lang} />;
      }
      const url = Links.bioURL(lang, poet.id);
      const q = poetNameString(poet).replace(/ /g, '+');
      //const searchURL = `https://duckduckgo.com/?q=${q}&t=osx&ia=images&iax=1`;
      const searchURL = `https://www.google.dk/search?tbm=isch&q=${q}&tbs=imgo:1&gws_rd=c`;
      return (
        <div style={{ flexBasis: '30%', marginTop: '30px' }} key={poet.id}>
          <Link key={poet.id} route={url}>
            <a>
              {item}
            </a>
          </Link>
          <a style={{ fontSize: '0.8em' }} href={searchURL} target="search">
            Søg
          </a>
        </div>
      );
    });

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
          <Nav lang={lang} title={pageTitle} />
          <Heading title={pageTitle} />
          <Tabs items={tabs} selected="looks" country={country} lang={lang} />
          <div className="picture-container">
            {renderedPortraits}
          </div>
          <CountryPicker
            style={{ marginTop: '40px' }}
            lang={lang}
            selectedCountry={country}
            selectedGroupBy={groupBy}
          />
          <LangSelect lang={lang} />
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
