// @flow

import React from 'react';
import Page from '../components/page.js';
import Main from '../components/main.js';
import { Link } from '../routes';
import * as Links from '../components/links';
import Nav, { kalliopeCrumbs } from '../components/nav';
import LangSelect from '../components/langselect.js';
import CountryPicker from '../components/countrypicker.js';
import Tabs from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import TwoColumns from '../components/twocolumns';
import * as Sorting from '../common/sorting.js';
import * as Strings from '../common/strings.js';
import _ from '../common/translations.js';
import CommonData from '../common/commondata.js';
import ErrorPage from './error.js';
import * as Client from '../common/client.js';
import { createURL } from '../common/client.js';
import type {
  Lang,
  Country,
  Section,
  Poet,
  LinesType,
  Error,
  PoetId,
  WorkId,
} from '../common/types.js';

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
const AllTextsPage = (props: AllTextsProps) => {
  const { lang, country, type, letter, lines, letters, error } = props;

  if (error) {
    return <ErrorPage error={error} lang={lang} message="Ukendt land" />;
  }

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
  const compareLocales = {
    dk: 'da-DK',
    de: 'de',
    fr: 'fr-FR',
    gb: 'en-GB',
    us: 'en-US',
    it: 'it-IT',
    un: 'da-DK' /* Tager bare en tilfældig, da un er alle sprog */,
    se: 'se',
    no:
      'da-DK' /* no-NO locale virker ikke, men sortering er ligesom 'da-DK' */,
  };
  const locale = compareLocales[country] || 'da-DK';

  const renderedLines = lines
    .sort((a, b) => {
      if (a.line === b.line) {
        return a.poet.name.localeCompare(b.poet.name, locale);
      } else {
        return a.line.localeCompare(b.line, locale);
      }
    })
    .map(line => {
      const url = Links.textURL(lang, line.textId);
      const postfix = ` - ${line.poet.name}: ${line.work.title}`;
      return (
        <div key={line.textId} className="line">
          <Link to={url}>
            <a>{line.line}</a>
          </Link>
          {postfix}
          <style jsx>{`
            div.line {
              margin-bottom: 5px;
              margin-left: 30px;
              text-indent: -30px;
              break-inside: avoid;
              line-height: 1.5;
            }
          `}</style>
        </div>
      );
    });

  const letterPicker = letters
    .sort((a, b) => a.localeCompare(b, locale))
    .map(l => {
      const url = Links.allTextsURL(lang, country, type, l);
      const shownLetter = l === '_' ? 'Tegn' : l;
      const style = {
        marginRight: '5px',
        fontSize: '18px',
        fontWeight: l === letter ? 'bold' : 'normal',
      };
      const link =
        l === letter ? (
          shownLetter
        ) : (
          <Link to={url}>
            <a>{shownLetter}</a>
          </Link>
        );
      return (
        <span key={l} style={style}>
          {link}
        </span>
      );
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
    <Page
      headTitle={`${_('Digte', lang)} - Kalliope`}
      requestPath={Links.allTextsURL(lang, country, type, letter)}
      crumbs={[...kalliopeCrumbs(lang), { title: pageTitle }]}
      pageTitle={pageTitle}
      menuItems={tabs}
      selectedMenuItem={type}>
      <div style={{ lineHeight: 1.5 }}>
        <TwoColumns>{renderedLines}</TwoColumns>
      </div>
      <div style={{ margin: '40px 0 10px 0', fontSize: '1.5em' }}>
        {letterPicker}
      </div>
    </Page>
  );
};

AllTextsPage.getInitialProps = async ({
  query: { lang, country, type, letter },
}: {
  query: { lang: Lang, country: Country, type: LinesType, letter: string },
}) => {
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
};

export default AllTextsPage;
