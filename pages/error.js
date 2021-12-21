// @flow

import React from 'react';
import Page from '../components/page.js';
import { kalliopeCrumbs } from '../components/breadcrumbs.js';
import { kalliopeMenu } from '../components/menu.js';
import SubHeading from '../components/subheading.js';

const ErrorPage = (props) => {
  const { lang, message, error } = props;
  return (
    <Page
      headTitle={'Kalliope'}
      crumbs={[...kalliopeCrumbs(lang), { title: message }]}
      pageTitle=" "
      pageSubtitle={message}
      menuItems={kalliopeMenu()}
      selectedMenuItem="index"
    >
      <SubHeading>{message}</SubHeading>
      <div style={{ lineHeight: 1.7 }}>
        Noget er gået helt galt. Hvis du har lyst, må du meget gerne skrive til{' '}
        <a href="mailto:jesper@kalliope.org">jesper@kalliope.org</a> og
        forklare, hvordan du er endt på denne side. Så vil jeg sørge for at
        ingen andre får den oplevelse.
      </div>
    </Page>
  );
};

export default ErrorPage;
