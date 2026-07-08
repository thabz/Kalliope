import Router from 'next/router';
import { useEffect } from 'react';
import * as Client from '../common/client.js';
import * as OpenGraph from '../common/opengraph.js';
import _ from '../common/translations.js';
import { worksCrumbs } from '../components/breadcrumbs.js';
import * as Links from '../components/links';
import { poetMenu } from '../components/menu.js';
import Page from '../components/page.js';
import PicturesGrid from '../components/picturesgrid.js';
import { poetNameString } from '../components/poetname-helpers.js';
import PoetName from '../components/poetname.js';
import Stack from '../components/stack.js';
import WorksList from '../components/workslist.js';
import ErrorPage from './error.js';

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
