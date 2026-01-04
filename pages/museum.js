import 'isomorphic-fetch';
import React from 'react';
import * as Client from '../common/client.js';
import _ from '../common/translations.js';
import { kalliopeCrumbs } from '../components/breadcrumbs.js';
import * as Links from '../components/links';
import { kalliopeMenu } from '../components/menu.js';
import Page from '../components/page.js';
import PicturesGrid from '../components/picturesgrid.js';
import ErrorPage from './error.js';

const MuseumPage = (props) => {
  const { lang, museum, artwork, error } = props;

  if (error) {
    return <ErrorPage error={error} lang={lang} message="Ukendt digter" />;
  }
  const crumbs = [
    ...kalliopeCrumbs(lang),
    { url: Links.museumsURL(lang), title: _('Museer', lang) },
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
      menuItems={kalliopeMenu()}
      selectedMenuItem="works"
    >
      <div className="two-columns" style={{ lineHeight: 1.7 }}>
        <PicturesGrid lang={lang} artwork={artwork} hideMuseum={true} />
      </div>
    </Page>
  );
};

MuseumPage.getInitialProps = async ({ query: { lang, museumId } }) => {
  const json = await Client.museum(museumId);

  return {
    lang,
    museum: json.museum,
    artwork: json.artwork,
    error: json.error,
  };
};

export default MuseumPage;
