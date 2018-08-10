// @flow

import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav from '../components/nav';
import LangSelect from '../components/langselect.js';
import Heading from '../components/heading.js';
import PoetName, { poetNameString } from '../components/poetname.js';
import WorkName from '../components/workname.js';
import { PoetTabs } from '../components/tabs.js';
import SectionedList from '../components/sectionedlist.js';
import * as Links from '../components/links.js';
import * as Sorting from './helpers/sorting.js';
import { createURL } from './helpers/client.js';
import CommonData from '../pages/helpers/commondata.js';
import _ from '../pages/helpers/translations.js';
import type {
  LinesPair,
  Section,
  Lang,
  Poet,
  Work,
  SectionForRendering,
  LinesType,
} from './helpers/types.js';
import 'isomorphic-fetch';

type TextsProps = {
  lang: Lang,
  poet: Poet,
  lines: Array<LinesPair>,
  type: LinesType,
};
export default class Texts extends React.Component<TextsProps> {
  static async getInitialProps({
    query: { lang, poetId, type },
  }: {
    query: { lang: Lang, poetId: string, type: LinesType },
  }) {
    const res = await fetch(createURL(`/static/api/${poetId}/texts.json`));
    const json: { poet: Poet, lines: Array<LinesPair> } = await res.json();
    return { lang, poet: json.poet, lines: json.lines, type };
  }

  groupLines(lines: Array<LinesPair>): Array<Section<LinesPair>> {
    let groups: Map<string, Array<LinesPair>> = new Map();
    lines.forEach(linePair => {
      let line, alternative;
      if (this.props.type === 'titles') {
        line = linePair.title;
        alternative = linePair.firstline;
      } else {
        line = linePair.firstline;
        alternative = linePair.title;
      }
      if (line == null || line.length == 0) {
        return;
      }
      line = line.replace(',','').replace('!','');
      linePair['sortBy'] = line + ' [' + alternative + '[' + linePair.id;
      let letter: string = line[0];
      if (line.startsWith('Aa')) {
        letter = 'Å';
      }
      if (line.startsWith('Ö')) {
        letter = 'Ø';
      }
      if (line.startsWith('È')) {
        letter = 'E';
      }
      letter = letter.toUpperCase();
      let array = groups.get(letter) || [];
      array.push(linePair);
      groups.set(letter, array);
    });
    let sortedGroups = [];
    groups.forEach((group, key) => {
      sortedGroups.push({
        title: key,
        items: group.sort(Sorting.linesPairsByLine),
      });
    });
    return sortedGroups.sort(Sorting.sectionsByTitle);
  }

  render() {
    const { lang, poet, type, lines } = this.props;
    const requestPath = `/${lang}/texts/${poet.id}/${type}`;

    const groups = this.groupLines(lines);
    let sections: Array<SectionForRendering> = [];
    groups.forEach(group => {
      const items = group.items.map(lines => {
        const url = Links.textURL(lang, lines.id);
        let line = lines[type === 'titles' ? 'title' : 'firstline'];
        let alternative = lines[type === 'titles' ? 'firstline' : 'title'];
        let renderedAlternative = null;
        let isNonUnique =
          lines[
            type === 'titles' ? 'non_unique_indextitle' : 'non_unique_firstline'
          ];
        if (isNonUnique != null && alternative != null) {
          renderedAlternative = (
            <span style={{ color: CommonData.lightLinkColor }}>
              {' '}
              [{alternative}]
            </span>
          );
        }
        return {
          id: lines.id,
          url: url,
          html: (
            <span>
              {line}
              {renderedAlternative}
            </span>
          ),
        };
      });
      sections.push({ title: group.title, items });
    });
    let renderedGroups = <SectionedList sections={sections} />;

    const title = <PoetName poet={poet} includePeriod />;
    const headTitle = poetNameString(poet, false, false) + ' - Kalliope';
    return (
      <div>
        <Head
          headTitle={headTitle}
          ogTitle={headTitle}
          requestPath={requestPath}
        />
        <Main>
          <Nav
            lang={lang}
            poet={poet}
            title={
              type === 'titles' ? _('Titler', lang) : _('Førstelinjer', lang)
            }
          />
          <Heading title={title} />
          <PoetTabs lang={lang} poet={poet} selected={type} />
          {renderedGroups}
          <LangSelect lang={lang} path={requestPath} />
        </Main>
      </div>
    );
  }
}
