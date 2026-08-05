import { useContext, useEffect, useState } from 'react';
import {
  getKalliopeIconDate,
  getKalliopeIconSrc,
} from '../common/kalliope-icon.js';
import CommonData from '../common/commondata.js';
import LangContext from '../common/LangContext.js';
import Breadcrumbs, { Paging } from './breadcrumbs.js';
import Head from './head.js';
import LangSelect from './langselect.js';
import Main from './main.js';
import Picture from './picture.js';
import Tabs from './menu.js';

const Heading = (props) => {
  const { title, poet, iconSrc: customIconSrc } = props;
  const [kalliopeIconSrc, setKalliopeIconSrc] = useState(
    '/images/about/poet.jpg'
  );
  useEffect(() => {
    const iconDate = getKalliopeIconDate(window.location.search);
    setKalliopeIconSrc(getKalliopeIconSrc(iconDate));
  }, []);
  const iconSrc =
    poet == null ? customIconSrc ?? kalliopeIconSrc : poet.square_portrait;
  const iconClassName =
    poet == null ? 'heading-icon kalliope-icon' : 'heading-icon poet-icon';
  const headingClassName =
    poet == null ? 'heading kalliope-heading' : 'heading';
  const kalliopeIcon =
    poet == null ? (
      <Picture
        pictures={[{ src: iconSrc }]}
        bare={true}
        sizes="(max-width: 640px) 60px, 120px"
        imgClassName={iconClassName}
      />
    ) : null;

  return (
    <div className={headingClassName}>
      <h1>{title}</h1>
      {kalliopeIcon}
      {poet != null && iconSrc != null ? (
        <img className={iconClassName} src={iconSrc} alt="" />
      ) : null}
      <style jsx>{`
        .heading {
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          min-height: 128px;
          margin-bottom: 50px;
          margin-top: -30px;
        }

        .heading :global(h1) {
          margin: 0;
          min-width: 0;
          flex: 1;
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
        :global(.heading-icon) {
          display: block;
          flex: 0 0 auto;
        }
        :global(.poet-icon) {
          width: 128px;
          height: 128px;
          border-radius: 50%;
          object-fit: cover;
        }
        :global(.kalliope-icon) {
          position: absolute;
          top: 0;
          right: 0;
          width: 120px;
          height: 158px;
          object-fit: contain;
          object-position: top right;
          box-shadow: none;
        }
        .kalliope-heading :global(h1) {
          margin-right: 144px;
        }

        @media (max-width: 640px) {
          .heading :global(h1) {
            padding-top: 10px;
            line-height: 40px;
            font-size: 40px;
          }
          .heading {
            gap: 16px;
            min-height: 90px;
          }
          :global(.poet-icon) {
            width: 90px;
            height: 90px;
          }
          :global(.kalliope-icon) {
            width: 60px;
            height: 79px;
          }
          .kalliope-heading :global(h1) {
            margin-right: 76px;
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
          :global(.heading-icon) {
            display: none;
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
    canonicalPath,
    noIndex,
    crumbs = [],
    paging,
    country,
    poet,
    iconSrc,
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
        description={ogDescription}
        requestPath={requestPath}
        canonicalPath={canonicalPath}
        noIndex={noIndex}
      />
      <Main>
        <Breadcrumbs lang={lang} crumbs={crumbs} rightSide={pagingRendered} />
        <Heading
          title={pageTitle}
          subtitle={pageSubtitle}
          poet={poet}
          iconSrc={iconSrc}
        />
        <Tabs
          items={menuItems}
          selected={selectedMenuItem}
          country={country}
          query={query}
          poet={poet}
          lang={lang}
          requestPath={requestPath}
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
            text-decoration-thickness: 0.5px !important;
          }
          :global(.prose-paragraph a),
          :global(.poem-line a) {
            text-decoration: underline;
            text-underline-offset: 0.12em;
          }
          :global(.tabs a) {
            text-decoration: none;
          }
          :global(a:focus-visible) {
            outline: 2px solid ${CommonData.linkColor};
            outline-offset: 3px;
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
