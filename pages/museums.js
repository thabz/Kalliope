import Link from 'next/link';
import * as Client from '../common/client.js';
import _ from '../common/translations.js';
import { kalliopeCrumbs } from '../components/breadcrumbs.js';
import * as Links from '../components/links.js';
import Page from '../components/page.js';
import PageLead from '../components/pagelead.js';
import SectionedList from '../components/sectionedlist.js';
import ErrorPage from './error.js';

const countryNames = {
  at: { da: 'Østrig', de: 'Österreich', en: 'Austria', fr: 'Autriche' },
  au: { da: 'Australien', de: 'Australien', en: 'Australia', fr: 'Australie' },
  ca: { da: 'Canada', de: 'Kanada', en: 'Canada', fr: 'Canada' },
  de: { da: 'Tyskland', de: 'Deutschland', en: 'Germany', fr: 'Allemagne' },
  dk: { da: 'Danmark', de: 'Dänemark', en: 'Denmark', fr: 'Danemark' },
  es: { da: 'Spanien', de: 'Spanien', en: 'Spain', fr: 'Espagne' },
  fi: { da: 'Finland', de: 'Finnland', en: 'Finland', fr: 'Finlande' },
  fr: { da: 'Frankrig', de: 'Frankreich', en: 'France', fr: 'France' },
  gb: {
    da: 'Storbritannien',
    de: 'Vereinigtes Königreich',
    en: 'United Kingdom',
    fr: 'Royaume-Uni',
  },
  it: { da: 'Italien', de: 'Italien', en: 'Italy', fr: 'Italie' },
  nl: {
    da: 'Nederlandene',
    de: 'Niederlande',
    en: 'Netherlands',
    fr: 'Pays-Bas',
  },
  no: { da: 'Norge', de: 'Norwegen', en: 'Norway', fr: 'Norvège' },
  ru: { da: 'Rusland', de: 'Russland', en: 'Russia', fr: 'Russie' },
  se: { da: 'Sverige', de: 'Schweden', en: 'Sweden', fr: 'Suède' },
  us: { da: 'USA', de: 'USA', en: 'United States', fr: 'États-Unis' },
  va: {
    da: 'Vatikanstaten',
    de: 'Vatikanstadt',
    en: 'Vatican City',
    fr: 'Cité du Vatican',
  },
};

const museumSort = (a, b) => a.sortName.localeCompare(b.sortName);

export const museumsByCountry = (museums, lang) => {
  const groups = new Map();
  museums.forEach((museum) => {
    const title =
      museum.country == null
        ? _('Ukendt land', lang)
        : (countryNames[museum.country]?.[lang] ?? museum.country);
    const items = groups.get(title) ?? [];
    items.push(museum);
    groups.set(title, items);
  });
  return Array.from(groups, ([title, items]) => ({
    title,
    items: items.sort(museumSort),
  })).sort((a, b) => a.title.localeCompare(b.title, lang));
};

const MuseumsPage = (props) => {
  const { lang, museums, groupBy, error } = props;

  if (error) {
    return <ErrorPage error={error} lang={lang} message="Ukendt digter" />;
  }

  const sortedMuseums = museums
    .filter((a) => a.sortName != null)
    .sort(museumSort);
  const museumItem = (museum) => ({
    id: museum.id,
    url: Links.museumURL(lang, museum.id),
    html: museum.sortName,
  });
  const items = sortedMuseums.map((museum) => {
    return (
      <div key={museum.id}>
        <Link href={Links.museumURL(lang, museum.id)}>{museum.sortName}</Link>
      </div>
    );
  });
  const sections = museumsByCountry(sortedMuseums, lang).map((section) => ({
    title: section.title,
    items: section.items.map(museumItem),
  }));
  const tabs = [
    {
      id: 'name',
      title: _('Efter navn', lang),
      url: Links.museumsURL(lang, 'name'),
    },
    {
      id: 'country',
      title: _('Efter land', lang),
      url: Links.museumsURL(lang, 'country'),
    },
  ];

  const crumbs = [...kalliopeCrumbs(lang), { title: _('Museer', lang) }];

  return (
    <Page
      headTitle={_('Museer', lang) + ' - Kalliope'}
      ogTitle={_('Museer', lang)}
      ogDescription={'Museer på Kalliope'}
      requestPath={Links.museumsURL(lang, groupBy)}
      crumbs={crumbs}
      pageTitle={_('Museer', lang)}
      menuItems={tabs}
      selectedMenuItem={groupBy}>
      <PageLead>
        {_(
          'En oversigt over museer og samlinger, som ejer kunstværker og portrætter gengivet på Kalliope. Vælg et museum for at se de tilknyttede billeder.',
          lang
        )}
      </PageLead>
      {groupBy === 'country' ? (
        <SectionedList sections={sections} />
      ) : (
        <div className="two-columns" style={{ lineHeight: 1.7 }}>
          {items}
        </div>
      )}
    </Page>
  );
};

MuseumsPage.getInitialProps = async ({ query: { lang, groupBy = 'name' } }) => {
  const json = await Client.museums();
  return {
    lang,
    groupBy,
    museums: json.museums,
    error: json.error,
  };
};

export default MuseumsPage;
