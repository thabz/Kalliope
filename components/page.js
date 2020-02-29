// @flow
import React, { useContext } from 'react';
import Tabs from './tabs.js';
import Breadcrumbs, { Paging } from './breadcrumbs.js';
import Main from './main.js';
import Head from './head.js';
import Heading from './heading.js';
import CountryPicker from './countrypicker.js';
import LangContext from '../common/LangContext.js';
import LangSelect from './langselect.js';
import CommonData from '../common/commondata.js';

const Page = props => {
  const {
    children,
    headTitle,
    pageTitle,
    pageSubtitle,
    ogTitle,
    ogImage,
    ogDescription,
    requestPath,
    crumbs = [],
    paging,
    country,
    menuItems,
    selectedMenuItem,
    query,
  } = props;
  const lang = useContext(LangContext);

  const pagingRendered =
    paging != null ? <Paging prev={paging.prev} next={paging.next} /> : null;

  return (
    <div>
      <Head
        headTitle={headTitle}
        ogTitle={ogTitle}
        ogImage={ogImage}
        ogDescription={ogDescription}
        requestPath={requestPath}
      />
      <Main>
        <Breadcrumbs lang={lang} crumbs={crumbs} rightSide={pagingRendered} />
        <Heading title={pageTitle} subtitle={pageSubtitle} />
        <Tabs
          items={menuItems}
          selected={selectedMenuItem}
          country={country}
          query={query}
          lang={lang}
        />
        {children}
        <LangSelect lang={lang} path={requestPath} />
        <style jsx>{`
          @font-face {
            font-family: 'Alegreya';
            font-style: italic;
            font-weight: 400;
            font-display: swap;
            src: local('Alegreya Italic'), local('Alegreya-Italic'),
              url(https://fonts.gstatic.com/s/alegreya/v13/4UaHrEBBsBhlBjvfkSLkx60.ttf)
                format('truetype');
          }
          @font-face {
            font-family: 'Alegreya';
            font-style: italic;
            font-weight: 700;
            font-display: swap;
            src: local('Alegreya Bold Italic'), local('Alegreya-BoldItalic'),
              url(https://fonts.gstatic.com/s/alegreya/v13/4UaErEBBsBhlBjvfkSLk_xHMwps.ttf)
                format('truetype');
          }
          @font-face {
            font-family: 'Alegreya';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: local('Alegreya Regular'), local('Alegreya-Regular'),
              url(https://fonts.gstatic.com/s/alegreya/v13/4UaBrEBBsBhlBjvfkRLm.ttf)
                format('truetype');
          }
          @font-face {
            font-family: 'Alegreya';
            font-style: normal;
            font-weight: 700;
            font-display: swap;
            src: local('Alegreya Bold'), local('Alegreya-Bold'),
              url(https://fonts.gstatic.com/s/alegreya/v13/4UaGrEBBsBhlBjvfkSpa4o3J.ttf)
                format('truetype');
          }
          @font-face {
            font-family: 'Alegreya SC';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: local('Alegreya SC Regular'), local('AlegreyaSC-Regular'),
              url(https://fonts.gstatic.com/s/alegreyasc/v11/taiOGmRtCJ62-O0HhNEa-a6o.ttf)
                format('truetype');
          }
          @font-face {
            font-family: 'Alegreya Sans';
            font-style: italic;
            font-weight: 400;
            font-display: swap;
            src: local('Alegreya Sans Italic'), local('AlegreyaSans-Italic'),
              url(https://fonts.gstatic.com/s/alegreyasans/v10/5aUt9_-1phKLFgshYDvh6Vwt7V9tuA.ttf)
                format('truetype');
          }
          @font-face {
            font-family: 'Alegreya Sans';
            font-style: italic;
            font-weight: 700;
            font-display: swap;
            src: local('Alegreya Sans Bold Italic'),
              local('AlegreyaSans-BoldItalic'),
              url(https://fonts.gstatic.com/s/alegreyasans/v10/5aUo9_-1phKLFgshYDvh6Vwt7V9VBEh2jg.ttf)
                format('truetype');
          }
          @font-face {
            font-family: 'Alegreya Sans';
            font-style: normal;
            font-weight: 300;
            font-display: swap;
            src: local('Alegreya Sans Light'), local('AlegreyaSans-Light'),
              url(https://fonts.gstatic.com/s/alegreyasans/v10/5aUu9_-1phKLFgshYDvh6Vwt5fFPmE0.ttf)
                format('truetype');
          }
          @font-face {
            font-family: 'Alegreya Sans';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: local('Alegreya Sans Regular'), local('AlegreyaSans-Regular'),
              url(https://fonts.gstatic.com/s/alegreyasans/v10/5aUz9_-1phKLFgshYDvh6Vwt3V0.ttf)
                format('truetype');
          }
          @font-face {
            font-family: 'Alegreya Sans';
            font-style: normal;
            font-weight: 700;
            font-display: swap;
            src: local('Alegreya Sans Bold'), local('AlegreyaSans-Bold'),
              url(https://fonts.gstatic.com/s/alegreyasans/v10/5aUu9_-1phKLFgshYDvh6Vwt5eFImE0.ttf)
                format('truetype');
          }
          @font-face {
            font-family: 'Alegreya Sans';
            font-style: normal;
            font-weight: 100;
            font-display: swap;
            src: local('Alegreya Sans Thin'), local('AlegreyaSans-Thin'),
              url(https://fonts.gstatic.com/s/alegreyasans/v10/5aUt9_-1phKLFgshYDvh6Vwt5TltuA.ttf)
                format('truetype');
          }

          :global(body) {
            margin: 0;
            font-family: 'Alegreya Sans', sans-serif;
            box-sizing: border-box;
            font-size: 18px;
            height: 150px;
            -webkit-tap-highlight-color: ${CommonData.backgroundLinkColor};
          }
          :global(.small-caps) {
            fontfamily: 'Alegreya SC';
          }
          :global(a) {
            color: ${CommonData.linkColor};
            text-decoration: none;
          }
          :global(a):global(.lighter) {
            color: ${CommonData.lightLinkColor};
          }
          @media print {
            :global(a) {
              color: black;
            }
            :global(body) {
              font-size: 9pt;
            }
          }
        `}</style>
      </Main>
    </div>
  );
};

export default Page;
