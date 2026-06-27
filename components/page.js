import { useContext } from 'react';
import CommonData from '../common/commondata.js';
import LangContext from '../common/LangContext.js';
import Breadcrumbs, { Paging } from './breadcrumbs.js';
import Head from './head.js';
import LangSelect from './langselect.js';
import Main from './main.js';
import Tabs from './menu.js';

const Heading = (props) => {
  const { title } = props;
  return (
    <div className="heading">
      <h1>{title}</h1>
      <style jsx>{`
        .heading {
          margin-bottom: 30px;
        }

        .heading :global(h1) {
          margin: 0;
          width: 100%;
          padding-top: 10px;
          line-height: 56px;
          font-size: 56px;
          font-weight: 100;
          margin-left: -2px;
          transition: font-size 0.2s;
        }
        .heading :global(h1):global(.lighter) {
          color: #757575;
        }

        @media (max-width: 480px) {
          .heading :global(h1) {
            padding-top: 10px;
            line-height: 40px;
            font-size: 40px;
          }
        }

        @media print {
          .heading :global(h1) {
            font-size: 24px;
            border-bottom: 1px solid #888;
          }
          .heading {
            margin-bottom: 40px;
          }
        }
      `}</style>
    </div>
  );
};

const Page = (props) => {
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
    poet,
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
          poet={poet}
          lang={lang}
        />
        {children}
        <LangSelect lang={lang} path={requestPath} />
        <style jsx>{`
          :global(body) {
            margin: 0;
            font-family: 'Alegreya Sans', sans-serif;
            box-sizing: border-box;
            font-size: 18px;
            height: 150px;
            -webkit-tap-highlight-color: ${CommonData.backgroundLinkColor};
          }
          :global(.small-caps) {
            font-family: 'Alegreya SC';
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
