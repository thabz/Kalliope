// @flow

import 'isomorphic-fetch';
import React, { useContext } from 'react';
import Page from '../components/page.js';
import * as Links from '../components/links';
import { kalliopeCrumbs } from '../components/breadcrumbs.js';
import LangSelect from '../components/langselect.js';
import { kalliopeMenu } from '../components/menu.js';
import PoetName from '../components/poetname.js';
import SectionedList from '../components/sectionedlist.js';
import * as Sorting from '../common/sorting.js';
import type { Lang, Keyword, SectionForRendering } from '../common/types.js';
import { createURL } from '../common/client.js';
import _ from '../common/translations.js';
import LangContext from '../common/LangContext.js';

const groupsByLetter = (keywords: Array<Keyword>) => {
  let groups = new Map();
  keywords.forEach(k => {
    let key = k.title[0];
    let group = groups.get(key) || [];
    group.push(k);
    groups.set(key, group);
  });
  let sortedGroups = [];
  groups.forEach((group, key) => {
    sortedGroups.push({
      title: key,
      items: group.sort(Sorting.keywordsByTitle),
    });
  });
  return sortedGroups.sort(Sorting.sectionsByTitle);
};

type KeywordsProps = {
  keywords: Array<Keyword>,
};
const Keywords = (props: KeywordsProps) => {
  const { keywords } = props;
  const lang = useContext(LangContext);

  const requestPath = `/${lang}/keywords`;

  const nonDrafts = keywords.filter(k => !k.is_draft);
  const groups = groupsByLetter(nonDrafts);
  let sections: Array<SectionForRendering> = [];

  groups.forEach(group => {
    const items = group.items.map(keyword => {
      const url =
        keyword.redirectURL != null
          ? keyword.redirectURL.replace('${lang}', lang)
          : Links.keywordURL(lang, keyword.id);
      return {
        id: keyword.id,
        url,
        html: keyword.title,
      };
    });
    sections.push({ title: group.title, items });
  });

  let renderedGroups = <SectionedList sections={sections} />;

  return (
    <Page
      headTitle={_('Nøgleord', lang) + ' - Kalliope'}
      requestPath={requestPath}
      crumbs={[...kalliopeCrumbs(lang), { title: _('Nøgleord', lang) }]}
      pageTitle={_('Nøgleord', lang)}
      menuItems={kalliopeMenu()}
      selectedMenuItem="keywords">
      {renderedGroups}
      <LangSelect path={requestPath} />
    </Page>
  );
};

Keywords.getInitialProps = async ({
  query: { lang },
}: {
  query: { lang: Lang },
}) => {
  const res = await fetch(createURL('/static/api/keywords.json'));
  const keywords: Array<Keyword> = await res.json();
  return { lang, keywords };
};

export default Keywords;
