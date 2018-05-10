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
import TwoColumns from '../components/twocolumns';
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
  PoetId,
  WorkId,
} from './helpers/types.js';

type LineRecord = {
  poet: {
    id: PoetId,
    name: string,
  },
  work: {
    id: WorkId,
    title: string,
  },
  line: string,
  textId: string,
};
type AllTextsProps = {
  lang: Lang,
  country: Country,
  letter: string,
  type: LinesType,
  lines: Array<LineRecord>,
  letters: Array<string>,
  error?: Error,
};
export default class extends React.Component<AllTextsProps> {
  static async getInitialProps({
    query: { lang, country, type, letter },
  }: {
    query: { lang: Lang, country: Country, type: LinesType, letter: string },
  }) {
    const json = await Client.allTexts(country, type, letter);
    return {
      lang,
      country,
      type,
      letter,
      lines: json.lines,
      letters: json.letters,
      error: json.error,
    };
  }

  render() {
    const { lang, country, type, letter, lines, letters, error } = this.props;

    if (error) {
      return <ErrorPage error={error} lang={lang} message="Ukendt land" />;
    }
    const requestPath = Links.allTextsURL(lang, country, type, letter);

    const tabs = [
      {
        id: 'titles',
        title: _('Digttitler', lang),
        url: Links.allTextsURL(lang, country, 'titles', 'A'),
      },
      {
        id: 'first',
        title: _('Førstelinjer', lang),
        url: Links.allTextsURL(lang, country, 'first', 'A'),
      },
    ];

    const renderedLines = lines.map(line => {
      const url = Links.textURL(lang, line.textId);
      return (
        <div
          key={line.textId}
          style={{
            marginBottom: '5px',
            marginLeft: '30px',
            textIndent: '-30px',
            breakInside: 'avoid',
            lineHeight: 1.5,
          }}>
          <Link to={url}>{line.line}</Link> - {line.poet.name}:{' '}
          {line.work.title}
        </div>
      );
    });

    const letterPicker = letters.map(l => {
      const url = Links.allTextsURL(lang, country, type, l);
      const shownLetter = l === '_' ? 'Tegn' : l;
      const style = {
        marginRight: '5px',
        fontWeight: l === letter ? 'bold' : 'normal',
      };
      const link =
        l === letter ? shownLetter : <Link to={url}>{shownLetter}</Link>;
      return <span style={style}>{link}</span>;
    });

    let pageTitle = null;
    if (country !== 'dk') {
      const cn = CommonData.countries.filter(c => {
        return c.code === country;
      })[0];
      pageTitle =
        Strings.toTitleCase(cn.adjective[lang]) + ' ' + _('digte', lang);
    } else {
      pageTitle = _('Digte', lang);
    }
    pageTitle += ': ' + letter;

    const countryToURL = country => {
      return Links.allTextsURL(lang, country, type, 'A');
    };
    return (
      <div>
        <Head
          headTitle={_('Digte', lang) + ' - Kalliope'}
          requestPath={requestPath}
        />
        <Main>
          <Nav lang={lang} title={pageTitle} />
          <Heading title={pageTitle} />
          <Tabs items={tabs} selected={type} country={country} lang={lang} />
          <div style={{ lineHeight: 1.5 }}>
            <TwoColumns>{renderedLines}</TwoColumns>
          </div>
          <div style={{ margin: '40px 0 10px 0', fontSize: '1.5em' }}>
            {letterPicker}
          </div>
          <CountryPicker
            style={{ marginTop: '40px' }}
            lang={lang}
            countryToURL={countryToURL}
            selectedCountry={country}
          />
          <LangSelect lang={lang} path={requestPath} />
        </Main>
      </div>
    );
  }
}
