// @flow

import React from 'react';
import Page from '../components/page.js';
import { kalliopeCrumbs } from '../components/nav';
import { kalliopeTabs } from '../components/tabs.js';
import SubHeading from '../components/subheading.js';
import type { Lang, Error } from '../common/types.js';

type ErrorProps = {
  lang: Lang,
  message?: ?string,
  error: Error,
};
const ErrorPage = (props: ErrorProps) => {
  const { lang, message, error } = props;
  return (
    <Page
      headTitle={'Kalliope'}
      crumbs={[...kalliopeCrumbs(lang), { title: message }]}
      pageTitle=" "
      pageSubtitle={_('Værker', lang)}
      menuItems={kalliopeTabs()}
      selectedMenuItem="index">
      <SubHeading>{message}</SubHeading>
      <div style={{ lineHeight: 1.7 }}>
        Noget er gået helt galt. Hvis du har lyst, må du meget gerne skrive til{' '}
        <a href="mailto:jesper@kalliope">jesper@kalliope.org</a> og forklare,
        hvordan du er endt på denne side. Så vil jeg sørge for at ingen andre
        får den oplevelse.
      </div>
    </Page>
  );
};

export default ErrorPage;
