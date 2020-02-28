// @flow
import React, { useContext } from 'react';
import Tabs from './tabs.js';
import Nav, { NavPaging } from './nav.js';
import Main from './main.js';
import Head from './head.js';
import Heading from './heading.js';
import CountryPicker from './countrypicker.js';
import LangContext from '../common/LangContext.js';
import LangSelect from './langselect.js';

const Page = props => {
  const {
    children,
    headTitle,
    pageTitle,
    requestPath,
    crumbs,
    paging,
    country,
    menuItems,
    selectedMenuItem,
    query,
  } = props;
  const lang = useContext(LangContext);

  const pagingRendered =
    paging != null ? <NavPaging prev={paging.prev} next={paging.next} /> : null;

  return (
    <div>
      <Head headTitle={headTitle} requestPath={requestPath} />
      <Main>
        <Nav lang={lang} crumbs={crumbs} rightSide={pagingRendered} />
        <Heading title={pageTitle} />
        <Tabs
          items={menuItems}
          selected={selectedMenuItem}
          country={country}
          query={query}
          lang={lang}
        />
        {children}
        <LangSelect lang={lang} path={requestPath} />
      </Main>
    </div>
  );
};

export default Page;
