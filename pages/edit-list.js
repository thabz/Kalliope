// @flow

import 'isomorphic-fetch';
import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import * as Links from '../components/links';
import Nav, { kalliopeCrumbs } from '../components/nav';
import LangSelect from '../components/langselect.js';
import { KalliopeTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import SectionedList from '../components/sectionedlist.js';
import * as Sorting from './helpers/sorting.js';
import type { Lang, Poet, Work } from './helpers/types.js';
import { createURL } from './helpers/client.js';
import _ from '../pages/helpers/translations.js';

type EditWork = {
  poet: Poet,
  work: Work,
  facsimile: string,
  pagesNum: number,
};
type EditListProps = {
  lang: Lang,
  editworks: Array<EditWork>,
};
export default class extends React.Component<EditListProps> {
  static async getInitialProps({ query: { lang } }: { query: { lang: Lang } }) {
    const res = await fetch(createURL('/static/edit/edit-list.json'));
    const editworks: Array<EditWork> = await res.json();
    return { lang, editworks };
  }

  render() {
    const { lang, editworks } = this.props;

    const requestPath = `/${lang}/edit-works`;

    let renderedEditWorks = editworks.map(editwork => {
      const { work, poet } = editwork;
      return (
        <div>
          <h2>
            {work.title} ({work.year})
          </h2>
        </div>
      );
    });

    return (
      <div>
        <Head
          headTitle={_('Bagkontoret', lang) + ' - Kalliope'}
          requestPath={requestPath}
        />
        <Main>
          <Nav
            lang={lang}
            crumbs={[
              ...kalliopeCrumbs(lang),
              { title: _('Bagkontoret', lang) },
            ]}
          />
          <Heading title={_('Bagkontoret', lang)} />
          <KalliopeTabs lang={lang} selected={'about'} />
          {renderedEditWorks}
          <LangSelect lang={lang} path={requestPath} />
        </Main>
      </div>
    );
  }
}
