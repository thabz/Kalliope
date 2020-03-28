// @flow

import React from 'react';
import Page from '../components/page.js';
import { poetCrumbsWithTitle } from '../components/breadcrumbs.js';
import LangSelect from '../components/langselect.js';
import PoetName from '../components/poetname.js';
import { poetNameString } from '../components/poetname-helpers.js';
import WorkName from '../components/workname.js';
import { poetMenu } from '../components/menu.js';
import SectionedList from '../components/sectionedlist.js';
import * as Links from '../components/links.js';
import * as Sorting from '../common/sorting.js';
import { createURL } from '../common/client.js';
import CommonData from '../common/commondata.js';
import _ from '../common/translations.js';
import type {
  LinesPair,
  Section,
  Lang,
  Poet,
  Work,
  SectionForRendering,
  LinesType,
} from '../common/types.js';
import * as Client from '../common/client.js';
import * as OpenGraph from '../common/opengraph.js';

const groupLines = (
  lines: Array<LinesPair>,
  type: LinesType
): Array<Section<LinesPair>> => {
  let groups: Map<string, Array<LinesPair>> = new Map();
  lines.forEach(linePair => {
    let line, alternative;
    if (type === 'titles') {
      line = linePair.title;
      alternative = linePair.firstline;
    } else {
      line = linePair.firstline;
      alternative = linePair.title;
    }
    if (line == null || line.length == 0) {
      return;
    }
    line = line.replace(',', '').replace('!', '');
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
};

type TextsProps = {
  lang: Lang,
  poet: Poet,
  lines: Array<LinesPair>,
  type: LinesType,
};
const TextsPage = (props: TextsProps) => {
  const { lang, poet, type, lines } = props;

  const groups = groupLines(lines, type);
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

  const lastCrumbTitle =
    type === 'titles' ? _('Titler', lang) : _('Førstelinjer', lang);

  return (
    <Page
      headTitle={`${lastCrumbTitle} - ${poetNameString(poet)} - Kalliope`}
      ogTitle={poetNameString(poet, false, false)}
      ogImage={OpenGraph.poetImage(poet)}
      requestPath={`/${lang}/texts/${poet.id}/${type}`}
      crumbs={poetCrumbsWithTitle(lang, poet, lastCrumbTitle)}
      pageTitle={<PoetName poet={poet} includePeriod />}
      menuItems={poetMenu(poet)}
      poet={poet}
      selectedMenuItem={type}>
      {renderedGroups}
    </Page>
  );
};

TextsPage.getInitialProps = async ({
  query: { lang, poetId, type },
}: {
  query: { lang: Lang, poetId: string, type: LinesType },
}) => {
  const json = await Client.texts(poetId);
  return {
    lang,
    poet: json.poet,
    lines: json.lines,
    type,
  };
};

export default TextsPage;
