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
          <Nav lang={lang} title="Fejl" />
          <Heading title="Fejl" />
          <KalliopeTabs lang={lang} selected="index" />
          <SubHeading>Der er opstået en fejl</SubHeading>
          <div>
            {message}
          </div>
          <LangSelect lang={lang} />
        </Main>
      </div>
    );
  }
}
