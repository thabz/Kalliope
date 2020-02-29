// @flow

import React from 'react';
import 'isomorphic-fetch';
import { Link, Router } from '../routes';
import Page from '../components/page.js';
import Main from '../components/main.js';
import Nav, { kalliopeCrumbs } from '../components/nav';
import LangSelect from '../components/langselect';
import { kalliopeTabs } from '../components/tabs.js';
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
const MuseumPage = (props: MuseumProps) => {
  const { lang, museum, artwork, error } = props;

  if (error) {
    return <ErrorPage error={error} lang={lang} message="Ukendt digter" />;
  }
  const crumbs = [
    ...kalliopeCrumbs(lang),
    { title: 'Museer' },
    { title: museum.name },
  ];

  return (
    <Page
      headTitle={museum.name + ' - Kalliope'}
      ogTitle={museum.name}
      ogDescription={'Malerier på ' + museum.name}
      requestPath={`/${lang}/museum/${museum.id}`}
      crumbs={crumbs}
      pageTitle={museum.name}
      pageSubtitle={_('Værker', lang)}
      menuItems={kalliopeTabs()}
      selectedMenuItem="works">
      <div className="two-columns" style={{ lineHeight: 1.7 }}>
        <PicturesGrid lang={lang} artwork={artwork} hideMuseum={true} />
      </div>
    </Page>
  );
};

MuseumPage.getInitialProps = async ({
  query: { lang, museumId },
}: {
  query: { lang: Lang, museumId: string },
}) => {
  const json = await Client.museum(museumId);

  return {
    lang,
    museum: json.museum,
    artwork: json.artwork,
    error: json.error,
  };
};

export default MuseumPage;
