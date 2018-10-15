// @flow

import React from 'react';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav from '../components/nav';
import { KalliopeTabs } from '../components/tabs.js';
import SubHeading from '../components/subheading.js';
import Heading from '../components/heading.js';
import type { Lang, Error } from './helpers/types.js';

type ErrorProps = {
  lang: Lang,
  message?: ?string,
  error: Error,
};
export default class extends React.Component<ErrorProps> {
  render() {
    const { lang, message, error } = this.props;
    return (
      <div>
        <Head headTitle="Kalliope" />
        <Main>
          <Nav lang={lang} title={message} />
          <Heading title="&nbsp;" />
          <KalliopeTabs lang={lang} selected="index" />
          <SubHeading>{message}</SubHeading>
          <div style={{ lineHeight: 1.7 }}>
            Noget er gået helt galt. Hvis du har lyst, må du meget gerne skrive
            til <a href="mailto:jesper@kalliope">jesper@kalliope.org</a> og
            forklare, hvordan du er endt på denne side. Så vil jeg sørge for at
            ingen andre får den oplevelse.
          </div>
        </Main>
      </div>
    );
  }
}
