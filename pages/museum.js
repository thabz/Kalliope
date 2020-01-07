// @flow

import React from 'react';
import 'isomorphic-fetch';
import { Link, Router } from '../routes';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav, { kalliopeCrumbs } from '../components/nav';
import LangSelect from '../components/langselect';
import { KalliopeTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import WorkName from '../components/workname.js';
import PicturesGrid from '../components/picturesgrid.js';
import * as Links from '../components/links';
import * as Client from '../common/client.js';
import ErrorPage from './error.js';
import CommonData from '../common/commondata.js';
import type {
  Lang,
  Poet,
  Museum,
  PictureItem,
  Error,
} from '../common/types.js';
import _ from '../common/translations.js';
import * as OpenGraph from '../common/opengraph.js';

type MuseumProps = {
  lang: Lang,
  museum: Museum,
  artwork: Array<PictureItem>,
  error: ?Error,
};
export default class extends React.Component<MuseumProps> {
  static async getInitialProps({
    query: { lang, museumId },
  }: {
    query: { lang: Lang, museumId: string },
  }) {
    const json = await Client.museum(museumId);

    return {
      lang,
      museum: json.museum,
      artwork: json.artwork,
      error: json.error,
    };
  }

  render() {
    const { lang, museum, artwork, error } = this.props;

    if (error) {
      return <ErrorPage error={error} lang={lang} message="Ukendt digter" />;
    }
    const requestPath = `/${lang}/museum/${museum.id}`;

    const noDataString = null;

    const headTitle = museum.name + ' - Kalliope';

    const ogDescription = 'Malerier på ' + museum.name;
    const title = museum.name;

    return (
      <div>
        <Head
          headTitle={headTitle}
          ogTitle={title}
          description={ogDescription}
          requestPath={requestPath}
        />
        <Main>
          <Nav
            lang={lang}
            crumbs={[
              ...kalliopeCrumbs(lang),
              { title: 'Museer' },
              { title: museum.name },
            ]}
          />
          <Heading title={title} subtitle={_('Værker', lang)} />
          <KalliopeTabs lang={lang} selected="museum" />
          <div className="two-columns" style={{ lineHeight: 1.7 }}>
            <PicturesGrid lang={lang} artwork={artwork} hideMuseum={true} />
          </div>
          <LangSelect lang={lang} path={requestPath} />
        </Main>
      </div>
    );
  }
}
