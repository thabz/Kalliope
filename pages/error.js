// @flow

import React from 'react';
import { Link, Router } from '../routes';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav from '../components/nav';
import LangSelect from '../components/langselect';
import { KalliopeTabs } from '../components/tabs.js';
import SubHeading from '../components/subheading.js';
import Heading from '../components/heading.js';
import type { Lang, Error } from './helpers/types.js';
import 'isomorphic-fetch';

export default class extends React.Component {
  props: {
    lang: Lang,
    message?: ?string,
    error: Error,
  };

  render() {
    const { lang, message, error } = this.props;

    return (
      <div>
        <Head headTitle="Kalliope" />
        <Main>
          <Nav lang={lang} title={message} />
          <Heading title="&nbsp;" />
          <KalliopeTabs lang={lang} selected="index" />
          <SubHeading>
            {message}
          </SubHeading>
          <div style={{ lineHeight: 1.7 }}>
            Noget er gået helt galt. Hvis du har lyst, må du meget gerne skrive
            til <a href="mailto:jesper@kalliope">jesper@kalliope.org</a> og
            forklare, hvordan du er endt på denne side. Så vil jeg sørge for at
            ingen andre får den oplevelse.
          </div>
          <LangSelect lang={lang} />
        </Main>
      </div>
    );
  }
}
