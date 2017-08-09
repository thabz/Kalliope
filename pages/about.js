// @flow

import React from 'react';
import { Link } from '../routes';
import Head from '../components/head';
import Main from '../components/main.js';
import { KalliopeTabs } from '../components/tabs.js';
import LangSelect from '../components/langselect';
import Nav from '../components/nav';
import SubHeading from '../components/subheading.js';
import SidebarSplit from '../components/sidebarsplit.js';
import * as Links from '../components/links';
import Heading from '../components/heading.js';
import TextContent from '../components/textcontent.js';
import type { Lang, NewsItem, TextContentType } from './helpers/types.js';
import { createURL } from './helpers/client.js';
import 'isomorphic-fetch';

export default class extends React.Component {
  props: {
    lang: Lang,
    item: { title: string, content_html: TextContentType },
  };

  static async getInitialProps({
    query: { lang, aboutItemId },
  }: {
    query: { lang: Lang, aboutItemId: string },
  }) {
    if (lang == null) {
      lang = 'da';
    }
    const res = await fetch(
      createURL(`/static/api/about/${aboutItemId}_${lang}.json`)
    );
    const item = await res.json();
    return { lang, item };
  }

  render() {
    const { lang, item } = this.props;
    const navbar = [
      <Link route={Links.aboutURL(lang, 'kalliope')}>
        <a>Om</a>
      </Link>,
    ];

    const renderedAbout = (
      <TextContent contentHtml={item.content_html} lang={lang} />
    );

    return (
      <div>
        <Head headTitle="Kalliope" />
        <Main>
          <Nav lang="da" links={navbar} title={item.title} />
          <Heading title="Kalliope" />
          <KalliopeTabs lang={lang} selected="about" />
          <SidebarSplit sidebar={null}>
            <div>
              <SubHeading>
                {item.title}
              </SubHeading>
              <div className="about-body">
                {renderedAbout}
              </div>
              <style jsx>{`
                .about-body {
                  font-weight: lighter;
                }
              `}</style>
            </div>
            <div />
          </SidebarSplit>
          <LangSelect lang={lang} />
        </Main>
      </div>
    );
  }
}
