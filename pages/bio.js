// @flow

import React from 'react';
import Page from '../components/page.js';
import Main from '../components/main.js';
import { poetCrumbsWithTitle } from '../components/breadcrumbs.js';
import SidebarSplit from '../components/sidebarsplit.js';
import LangSelect from '../components/langselect';
import { poetMenu } from '../components/menu.js';
import PoetName from '../components/poetname.js';
import {
  poetNameString,
  poetLastNameString,
} from '../components/poetname-helpers.js';
import WorkName from '../components/workname.js';
import Picture from '../components/picture.js';
import TextContent from '../components/textcontent.js';
import SplitWhenSmall from '../components/split-when-small.js';
import {
  formattedDate,
  parseDate,
  extractYear,
} from '../components/formatteddate.js';
import TwoColumns from '../components/twocolumns.js';
import ErrorPage from './error.js';
import * as Links from '../components/links';
import * as Client from '../common/client.js';
import * as OpenGraph from '../common/opengraph.js';
import _ from '../common/translations.js';

import { createURL } from '../common/client.js';

const dateAndPlace = (datePlace, lang, age) => {
  if (datePlace == null) {
    return _('Ukendt år', lang);
  }
  let result = [];
  if (datePlace.date === '?') {
    result.push(_('Ukendt år', lang));
  } else {
    result.push(formattedDate(datePlace.date));
  }
  if (datePlace.place != null) {
    result.push(<span key="place">{', ' + datePlace.place}</span>);
  }
  if (age != null) {
    result.push(<span key="age"> {age}</span>);
  }
  return result;
};

class PersonMetaLine extends React.Component {
  render() {
    const { label, value } = this.props;
    if (value == null) {
      return null;
    }
    const styles = {
      key: {
        fontWeight: 'bold',
        fontSize: '0.8em',
      },
      item: {
        marginBottom: '10px',
      },
    };
    return (
      <div style={styles.item}>
        <div style={styles.key}>{label}</div>
        <div>{value}</div>
      </div>
    );
  }
}

class PersonMeta extends React.Component {
  render() {
    const { poet, lang } = this.props;
    if (poet.type === 'collection') {
      return null;
    }
    const name = <PoetName poet={poet} />;

    // Age when dead
    let age = null;
    if (
      poet.period != null &&
      poet.period.born != null &&
      poet.period.dead != null &&
      poet.period.born.date != null &&
      poet.period.dead.date != null &&
      poet.period.born.date !== '?' &&
      poet.period.dead.date !== '?'
    ) {
      const lastName = poetLastNameString(poet);
      let born = parseDate(poet.period.born.date);
      const dead = parseDate(poet.period.dead.date);
      born.month = born.month || 0;
      born.day = born.day || 0;
      dead.month = dead.month || 0;
      dead.day = dead.day || 0;
      if (born != null && dead != null) {
        let yearDiff = dead.year - born.year;
        const deadBeforeBirthday =
          dead.month < born.month ||
          (born.month == dead.month && dead.day <= born.day);
        if (deadBeforeBirthday) {
          yearDiff -= 1;
        }
        let ca = '';
        if (
          born.prefix != null ||
          dead.prefix != null ||
          born.month === 0 ||
          dead.month === 0 ||
          born.day === 0 ||
          dead.day === 0
        ) {
          ca = _('ca.', lang) + ' ';
        }
        age = _(`(blev {ca}{yearDiff} år)`, lang, {
          ca,
          yearDiff: yearDiff + '',
        });
      }
    }

    let born =
      poet.period == null ? null : dateAndPlace(poet.period.born, lang);
    let dead =
      poet.period == null ? null : dateAndPlace(poet.period.dead, lang, age);

    const christened =
      poet.name.christened == null ? poet.name.realname : poet.name.christened;
    let coronationMetaLine = null;
    if (poet.period != null && poet.period.coronation != null) {
      const coronation =
        poet.period == null ? null : dateAndPlace(poet.period.coronation, lang);
      coronationMetaLine = (
        <PersonMetaLine value={coronation} label={_('Tiltrådt', lang)} />
      );
    }
    return (
      <div>
        <PersonMetaLine value={name} label={_('Navn', lang)} />
        <PersonMetaLine
          value={poet.name.fullname}
          label={_('Fulde navn', lang)}
        />
        <PersonMetaLine value={christened} label={_('Døbt', lang)} />
        <PersonMetaLine
          value={poet.name.pseudonym}
          label={_('Pseudonym', lang)}
        />
        <PersonMetaLine value={born} label={_('Født', lang)} />
        {coronationMetaLine}
        <PersonMetaLine value={dead} label={_('Død', lang)} />
      </div>
    );
  }
}

class PersonPortrait extends React.Component {
  render() {
    const { portraits, poet, lang } = this.props;
    if (!poet.has_portraits || portraits == null) {
      return null;
    }
    let primaryIndex = 0;
    const primary = portraits.filter((p, i) => {
      if (p.primary == true) {
        primaryIndex = i;
      }
      return p.primary;
    })[0];
    return (
      <Picture
        pictures={portraits}
        startIndex={primaryIndex}
        lang={lang}
        contentLang={primary.content_lang || 'da'}
      />
    );
  }
}

class Timeline extends React.Component {
  render() {
    const { timeline, lang } = this.props;
    if (timeline.length === 0) {
      return null;
    }
    let prevYearNumeric = null;
    const items = timeline.map((item, i) => {
      const [curYearFormatted, curYearNumeric] = extractYear(item.date);
      let year = null;
      if (prevYearNumeric !== curYearNumeric) {
        year = curYearFormatted;
      }
      prevYearNumeric = curYearNumeric;

      let html = null;
      if (item.type === 'image' && item.src != null) {
        const picture = {
          src: item.src,
          lang: lang,
          content_lang: item.content_lang,
          content_html: item.content_html,
        };
        html = (
          <div style={{ paddingTop: '0.37em' }}>
            <Picture
              pictures={[picture]}
              lang={lang}
              contentLang={picture.content_lang || 'da'}
            />
          </div>
        );
      } else {
        html = (
          <TextContent
            contentHtml={item.content_html}
            contentLang={item.content_lang}
            lang={lang}
          />
        );
      }

      return (
        <div
          key={i}
          style={{
            marginBottom: '10px',
            breakInside: 'avoid',
            lineHeight: '22px',
          }}
        >
          <div style={{ float: 'left', fontSize: '15px' }}>{year}</div>
          <div
            style={{
              marginLeft: '50px',
              fontSize: '16px',
              color: item.is_history_item ? '#666' : 'black',
            }}
          >
            {html}
          </div>
        </div>
      );
    });
    return (
      <div className="timeline">
        <TwoColumns>{items}</TwoColumns>
      </div>
    );
  }
}

const BioPage = (props) => {
  const { lang, poet, portraits, content_html, content_lang, timeline, error } =
    props;

  if (error) {
    return <ErrorPage error={error} lang={lang} message="Ukendt person" />;
  }
  const sidebarItems = (
    <SplitWhenSmall key="first-and-on">
      <PersonMeta poet={poet} lang={lang} />
      <div style={{ width: '100%', marginTop: '40px' }}>
        <PersonPortrait poet={poet} portraits={portraits} lang={lang} />
      </div>
    </SplitWhenSmall>
  );

  return (
    <Page
      headTitle={`${_('Biografi', lang)} - ${poetNameString(poet)} - Kalliope`}
      ogTitle={poetNameString(poet, false, false) + ' ' + _('biografi', lang)}
      ogImage={OpenGraph.poetImage(poet)}
      ogDescription={OpenGraph.trimmedDescription(content_html)}
      requestPath={`/${lang}/bio/${poet.id}`}
      crumbs={poetCrumbsWithTitle(lang, poet, _('Biografi', lang))}
      pageTitle={<PoetName poet={poet} includePeriod />}
      pageSubtitle={_('Biografi', lang)}
      menuItems={poetMenu(poet)}
      poet={poet}
      selectedMenuItem="bio"
    >
      <SidebarSplit sidebar={sidebarItems} sidebarOnTopWhenSplit={true}>
        <div style={{ lineHeight: '1.6' }}>
          <TextContent
            contentHtml={content_html}
            contentLang={content_lang}
            className="bio-text"
          />
          <Timeline timeline={timeline} lang={lang} />
          <style jsx>{`
            :global(.bio-text) {
              margin-bottom: 40px;
            }
            @media (max-width: 600px) {
              :global(.bio-text) {
                border-bottom: 1px solid #666;
                padding-bottom: 30px;
              }
            }
          `}</style>
        </div>
      </SidebarSplit>
    </Page>
  );
};

BioPage.getInitialProps = async ({ query: { lang, poetId } }) => {
  const json = await Client.bio(poetId);
  return {
    lang,
    portraits: json.portraits,
    poet: json.poet,
    content_html: json.content_html,
    content_lang: json.content_lang,
    timeline: json.timeline,
    error: json.error,
  };
};

export default BioPage;
