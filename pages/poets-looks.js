import 'isomorphic-fetch';
import React from 'react';
import { createURL } from '../common/client.js';
import CommonData from '../common/commondata.js';
import * as Strings from '../common/strings.js';
import * as Links from '../components/links';
import Page from '../components/page.js';
import Picture from '../components/picture.js';
import { poetNameString } from '../components/poetname-helpers.js';
import PoetName from '../components/poetname.js';
import { Link } from '../routes';

function joinWithCommaAndOr(items, andOrWord) {
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
  render() {
    const { lang, selectedCountry, selectedGroupBy, style } = this.props;
    const items = CommonData.countries.map((country) => {
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

class MissingPortrait extends React.Component {
  render() {
    const { lang, poet } = this.props;
    const style = {
      display: 'inline-block',
      border: '3px dotted black',
      width: '100%',
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

const PoetLooksPage = (props) => {
  const { lang, country, poets, groupBy } = props;

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
      const picture = {
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
  const requestPath = `/${lang}/poets/${country}/looks}`;

  if (country !== 'dk') {
    const cn = CommonData.countries.filter((c) => {
      return c.code === country;
    })[0];
    pageTitle = Strings.toTitleCase(cn.adjective[lang]) + ' ' + ' digtere';
  } else {
    pageTitle = 'Digtere';
  }
  return (
    <Page
      headTitle={'Digtere - Kalliope'}
      requestPath={requestPath}
      pageTitle={pageTitle}
      menuItems={tabs}
      selectedMenuItem="looks"
    >
      <div className="picture-container">{renderedPortraits}</div>
      <CountryPicker
        style={{ marginTop: '40px' }}
        lang={lang}
        selectedCountry={country}
        selectedGroupBy={groupBy}
      />
      <style jsx>{`
        .picture-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: flex-start;
        }
      `}</style>
    </Page>
  );
};

PoetLooksPage.getInitialProps = async ({
  query: { lang, country, groupBy },
}) => {
  const url = `/static/api/poets-${country}.json`;
  const res = await fetch(createURL(url));
  const json = await res.json();
  const poets = json.poets;
  return { lang, country, groupBy, poets };
};

export default PoetLooksPage;
