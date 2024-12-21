import React from 'react';
import * as Client from '../common/client.js';
import _ from '../common/translations.js';
import { kalliopeCrumbs } from '../components/breadcrumbs.js';
import * as Links from '../components/links';
import { kalliopeMenu } from '../components/menu.js';
import Page from '../components/page.js';
import { Link } from '../routes';
import ErrorPage from './error.js';

const MuseumsPage = (props) => {
  const { lang, museums, error } = props;

  if (error) {
    return <ErrorPage error={error} lang={lang} message="Ukendt digter" />;
  }

  const items = museums
    .filter((a) => a.sortName != null)
    .sort((a, b) => {
      return a.sortName > b.sortName ? 1 : -1;
    })
    .map((museum) => {
      return (
        <div>
          <Link route={Links.museumURL(lang, museum.id)}>
            <a>{museum.sortName}</a>
          </Link>
        </div>
      );
    });

  const crumbs = [...kalliopeCrumbs(lang), { title: 'Museer' }];

  return (
    <Page
      headTitle={_('Museer', lang) + ' - Kalliope'}
      ogTitle={_('Museer', lang)}
      ogDescription={'Museer på Kalliope'}
      requestPath={`/${lang}/museums`}
      crumbs={crumbs}
      pageTitle={_('Museer', lang)}
      menuItems={kalliopeMenu()}
      selectedMenuItem="keywords"
    >
      <div className="two-columns" style={{ lineHeight: 1.7 }}>
        {items}
      </div>
    </Page>
  );
};

MuseumsPage.getInitialProps = async ({ query: { lang } }) => {
  const json = await Client.museums();
  return {
    lang,
    museums: json.museums,
    error: json.error,
  };
};

export default MuseumsPage;
