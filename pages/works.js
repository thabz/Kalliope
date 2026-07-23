import Router from 'next/router';
import { useEffect } from 'react';
import * as Client from '../common/client.js';
import * as OpenGraph from '../common/opengraph.js';
import _ from '../common/translations.js';
import { worksCrumbs } from '../components/breadcrumbs.js';
import * as Links from '../components/links.js';
import { poetMenu } from '../components/menu.js';
import Page from '../components/page.js';
import PageLead from '../components/pagelead.js';
import PicturesGrid from '../components/picturesgrid.js';
import { poetNameString } from '../components/poetname-helpers.js';
import PoetName from '../components/poetname.js';
import Stack from '../components/stack.js';
import WorksList from '../components/workslist.js';
import ErrorPage from './error.js';

const romanNumerals = {
  16: 'XVI',
  17: 'XVII',
  18: 'XVIII',
  19: 'XIX',
};

const ordinalNumber = (number) => {
  const remainder10 = number % 10;
  const remainder100 = number % 100;
  if (remainder10 === 1 && remainder100 !== 11) {
    return `${number}st`;
  }
  if (remainder10 === 2 && remainder100 !== 12) {
    return `${number}nd`;
  }
  if (remainder10 === 3 && remainder100 !== 13) {
    return `${number}rd`;
  }
  return `${number}th`;
};

const periodFromAnonymousId = (poet, lang) => {
  const match = poet.id.match(/^anonym(\d{4})/);
  if (match == null) {
    return null;
  }
  const year = parseInt(match[1]);
  const century = year / 100 + 1;
  if (lang === 'en') {
    return `${ordinalNumber(century)} century`;
  }
  if (lang === 'de') {
    return `${century}. Jahrhundert`;
  }
  if (lang === 'fr') {
    return `${romanNumerals[century] || century}e siècle`;
  }
  return `${year}-tallet`;
};

const worksLead = (poet, lang) => {
  if (poet.id === 'bibel') {
    return _(
      'En oversigt over Bibelens bøger på Kalliope. Vælg en bog for at se dens indhold og læse de tekster, der findes i samlingen.',
      lang
    );
  }
  if (poet.id.indexOf('folkeviser') === 0) {
    return _(
      'En oversigt over folkeviser på Kalliope. Vælg et værk for at se dets indhold og læse de tekster, der findes i samlingen.',
      lang
    );
  }
  const anonymousPeriod = periodFromAnonymousId(poet, lang);
  if (anonymousPeriod != null) {
    return _(
      'En oversigt over værker på Kalliope af ukendte forfattere fra {period}. Vælg et værk for at se dets indhold og læse de tekster, der findes i samlingen.',
      lang,
      { period: anonymousPeriod }
    );
  }
  if (poet.type === 'collection') {
    return _(
      'En oversigt over værker i denne samling på Kalliope. Vælg et værk for at se dets indhold og læse de tekster, der findes i samlingen.',
      lang
    );
  }
  return _(
    'En kronologisk oversigt over værker af {poetName} på Kalliope. Vælg et værk for at se dets indhold og læse de tekster, der findes i samlingen.',
    lang,
    { poetName: poetNameString(poet, false, false, lang) }
  );
};

const WorksPage = (props) => {
  const { lang, poet, works, artwork, error } = props;

  useEffect(() => {
    if (works.length === 0 && artwork.length === 0) {
      Router.replace(Links.bioURL(lang, poet.id));
    }
  }, [artwork.length, lang, poet.id, works.length]);

  if (error) {
    return <ErrorPage error={error} lang={lang} message="Ukendt digter" />;
  }

  if (works.length === 0 && artwork.length === 0) {
    return null;
  }

  const worksList = <WorksList lang={lang} poet={poet} works={works} />;
  const artworksList = (
    <PicturesGrid lang={lang} poet={poet} artwork={artwork} hideArtist={true} />
  );
  const worksTitle =
    artwork.length === 0 || works.length === 0 ? null : (
      <h3>{_('Litteratur', lang)}</h3>
    );
  const artworksTitle =
    artwork.length === 0 || works.length === 0 ? null : (
      <h3>{_('Kunst', lang)}</h3>
    );

  const stack = (
    <>
      <Stack spacing="40px">
        {worksTitle}
        {worksList}
        {artworksTitle}
        {artworksList}
      </Stack>
      <style jsx>{`
        h3 {
          font-weight: 300;
          font-size: 22x;
          line-height: 1.6;
          padding-bottom: 1px;
          border-bottom: 1px solid #888;
          margin-bottom: 20px;
        }
      `}</style>
    </>
  );

  return (
    <Page
      headTitle={poetNameString(poet, false, false) + ' - Kalliope'}
      ogTitle={poetNameString(poet, false, false)}
      ogImage={OpenGraph.poetImage(poet)}
      ogDescription={'Værker'}
      requestPath={`/${lang}/works/${poet.id}`}
      crumbs={worksCrumbs(lang, poet)}
      pageTitle={<PoetName poet={poet} includePeriod />}
      pageSubtitle={_('Værker', lang)}
      menuItems={poetMenu(poet)}
      poet={poet}
      selectedMenuItem="works">
      <PageLead>{worksLead(poet, lang)}</PageLead>
      <div className="two-columns">
        {stack}
        <style jsx>{`
          :global(.nodata) {
            padding: 30px 0;
          }
        `}</style>
      </div>
    </Page>
  );
};

WorksPage.getInitialProps = async ({ query: { lang, poetId } }) => {
  const json = await Client.works(poetId);

  return {
    lang,
    poet: json.poet,
    works: json.works,
    artwork: json.artwork,
    error: json.error,
  };
};

export default WorksPage;
