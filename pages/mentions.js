// @flow

import React, { useState, Fragment } from 'react';
import Page from '../components/page.js';
import { poetCrumbsWithTitle } from '../components/breadcrumbs.js';
import _ from '../common/translations.js';
import { Link } from '../routes';
import LangSelect from '../components/langselect';
import { poetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import { poetNameString } from '../components/poetname-helpers.js';
import TextContent from '../components/textcontent.js';
import TwoColumns from '../components/twocolumns.js';
import ErrorPage from './error.js';
import * as Links from '../components/links';
import * as Client from '../common/client.js';
import type {
  Lang,
  Text,
  TextId,
  Poet,
  Work,
  TextContentType,
  Error,
} from '../common/types.js';
import { poetsByLastname } from '../common/sorting.js';
import { createURL } from '../common/client.js';
import * as OpenGraph from '../common/opengraph.js';

const joinedByComma = (items, lang) => {
  let result = [];
  items.forEach((item, i) => {
    result.push(item);
    if (i < items.length - 2) {
      result.push(', ');
    } else if (i === items.length - 2) {
      result.push(` ${_('og', lang)} `);
    }
  });
  return result;
};

const sectionTitle = (sectionType, lang) => {
  switch (sectionType) {
    case 'mentions':
      return _('Omtaler', lang);
    case 'translations':
      return _('Oversættelser', lang);
    case 'primary':
      return _('Primær litteratur', lang);
    case 'secondary':
      return _('Sekundær litteratur', lang);
    default:
      return 'Ukendt sektion ' + sectionType;
  }
};

const Section = props => {
  const { title, items } = props;
  return (
    <div className="list-section" style={{ marginBottom: '40px' }}>
      <h3 style={{ columnSpan: 'all' }}>{title}</h3>
      <TwoColumns>{items}</TwoColumns>
      <style jsx>{`
        h3 {
          font-weight: 300;
          font-size: 22x;
          line-height: 1.6;
          padding-bottom: 1px;
          border-bottom: 1px solid #888;
          margin-bottom: 50px;
        }
      `}</style>
    </div>
  );
};

const Item = props => {
  const { children } = props;
  return (
    <div
      style={{
        marginBottom: '10px',
        marginLeft: '30px',
        textIndent: '-30px',
        breakInside: 'avoid',
        lineHeight: 1.4,
      }}>
      {children}
    </div>
  );
};

const PoemLink = (props: { poem: Text, lang: Lang }) => {
  const { poem, lang } = props;
  const url = Links.textURL(lang, poem.id);
  return (
    <Link route={url}>
      <a>»{poem.linkTitle}«</a>
    </Link>
  );
};

type PoemType = {
  poet: Poet,
  poem: Text,
};
type TranslationsProps = {
  lang: Lang,
  translations: Array<{
    translated?: PoemType,
    translation: PoemType,
  }>,
};

const TranslationsGroupedByTranslated = (props: TranslationsProps) => {
  const { translations, lang } = props;

  const byTranslated = {};
  // Build byTranslated
  translations
    .filter(t => t.translated != null)
    .forEach(t => {
      const { translated, translation } = t;
      const a = byTranslated[translated.poem.id] || {
        translated,
        translations: [],
      };
      a.translations.push(translation);
      byTranslated[translated.poem.id] = a;
    });
  // Render byTranslated
  const result = Object.values(byTranslated)
    .sort((a, b) => {
      return a.translated.poem.title < b.translated.poem.title ? -1 : 1;
    })
    .map(a => {
      const translations = a.translations.map(t => {
        return (
          <Fragment key={t.poem.id}>
            <PoetName poet={t.poet} />: <PoemLink poem={t.poem} lang={lang} />
          </Fragment>
        );
      });
      return (
        <Item key={a.translated.poem.id}>
          <PoemLink poem={a.translated.poem} lang={lang} />{' '}
          {_('er oversat af', lang)} {joinedByComma(translations, lang)}.
        </Item>
      );
    });
  return result.concat(
    translations
      .filter(t => t.translated == null)
      .map(a => {
        return (
          <Item key={a.translation.poem.id}>
            {_('Et ukendt digt er oversat af', lang)}{' '}
            <PoetName poet={a.translation.poet} />:{' '}
            <PoemLink poem={a.translation.poem} lang={lang} />
          </Item>
        );
      })
  );
};

const TranslationsGroupedByTranslator = (props: TranslationsProps) => {
  const { translations, lang } = props;

  const byTranslator = {};
  // Build byTranslator
  translations.forEach(t => {
    const { translated, translation } = t;
    const a = byTranslator[translation.poet.id] || {
      translator: translation.poet,
      translations: [],
    };
    a.translations.push(t);
    byTranslator[translation.poet.id] = a;
  });
  // Render byTranslator
  return Object.values(byTranslator)
    .sort((a, b) => {
      return poetsByLastname(a.translator, b.translator);
    })
    .map(a => {
      const translations = a.translations.map(t => {
        if (t.translated != null) {
          return (
            <>
              <PoemLink poem={t.translated.poem} lang={lang} /> {_('til', lang)}{' '}
              <PoemLink poem={t.translation.poem} lang={lang} />
            </>
          );
        } else {
          return (
            <>
              {_(' et ukendt digt ', lang)}
              {_('til', lang)}{' '}
              <PoemLink poem={t.translation.poem} lang={lang} />
            </>
          );
        }
      });
      return (
        <Item key={a.translator.id}>
          <PoetName poet={a.translator} lastNameFirst={true} />{' '}
          {_('har oversat', lang)} {joinedByComma(translations, lang)}.
        </Item>
      );
    });
};
const TranslationsSection = props => {
  const { translations, lang } = props;
  const [groupBy, setGroupBy] = useState('by-translated');

  const groupByOptions = [
    { title: _('Efter titel', lang), value: 'by-translated' },
    { title: _('Efter oversætter', lang), value: 'by-translator' },
  ].map(o => {
    const selected = o.value === groupBy;
    const style = {
      marginLeft: '10px',
      fontWeight: selected ? 'bold' : 'normal',
      cursor: selected ? 'auto' : 'pointer',
    };
    const onClick = () => {
      setGroupBy(o.value);
    };
    return (
      <span style={style} onClick={onClick} key={o.title}>
        {o.title}
      </span>
    );
  });
  let items = [];
  if (groupBy === 'by-translated') {
    items = (
      <TranslationsGroupedByTranslated
        translations={translations}
        lang={lang}
      />
    );
  } else if (groupBy === 'by-translator') {
    items = (
      <TranslationsGroupedByTranslator
        translations={translations}
        lang={lang}
      />
    );
  } else {
    items = <p>Ukendt tilstand</p>;
  }
  const title = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}>
      <div>{sectionTitle('translations', lang)}</div>
      <div style={{ fontSize: '16px' }}>{groupByOptions}</div>
    </div>
  );

  return <Section title={title} items={items} />;
};

type MentionsProps = {
  lang: Lang,
  poet: Poet,
  mentions: Array<TextContentType>,
  translations: Array<TextContentType>,
  primary: Array<TextContentType>,
  secondary: Array<TextContentType>,
  error: ?Error,
};
const MentionsPage = (props: MentionsProps) => {
  const {
    lang,
    poet,
    mentions,
    translations,
    primary,
    secondary,
    error,
  } = props;

  if (error != null) {
    return <ErrorPage error={error} lang={lang} message="Ukendt person" />;
  }

  const sections = ['mentions', 'primary', 'secondary']
    .map((section, i) => {
      return {
        title: sectionTitle(section, lang),
        items: props[section].map((line, j) => {
          return (
            <Item key={j}>
              <TextContent contentHtml={line} lang={lang} contentLang="da" />
            </Item>
          );
        }),
      };
    })
    .filter(g => g.items.length > 0)
    .map(g => {
      return <Section title={g.title} items={g.items} key={g.title} />;
    });

  if (translations.length > 0) {
    sections.push(
      <TranslationsSection
        translations={translations}
        lang={lang}
        key={'translations'}
      />
    );
  }

  return (
    <Page
      headTitle={`${_('Henvisninger', lang)} - ${poetNameString(
        poet
      )} - Kalliope`}
      ogTitle={poetNameString(poet, false, false)}
      ogImage={OpenGraph.poetImage(poet)}
      requestPath={`/${lang}/mentions/${poet.id}`}
      crumbs={poetCrumbsWithTitle(lang, poet, _('Henvisninger', lang))}
      pageTitle={<PoetName poet={poet} includePeriod />}
      subtitle={_('Henvisninger', lang)}
      menuItems={poetTabs(poet)}
      selectedMenuItem="mentions">
      {sections}
    </Page>
  );
};

MentionsPage.getInitialProps = async ({
  query: { lang, poetId },
}: {
  query: { lang: Lang, poetId: string },
}) => {
  const json = await Client.mentions(poetId);
  return {
    lang,
    poet: json.poet,
    mentions: json.mentions || [],
    translations: json.translations || [],
    primary: json.primary || [],
    secondary: json.secondary || [],
    error: json.error,
  };
};

export default MentionsPage;
