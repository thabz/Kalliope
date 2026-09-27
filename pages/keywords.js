import { useContext } from 'react';
import { createURL } from '../common/client.js';
import LangContext from '../common/LangContext.js';
import * as Sorting from '../common/sorting.js';
import _ from '../common/translations.js';
import { kalliopeCrumbs } from '../components/breadcrumbs.js';
import LangSelect from '../components/langselect.js';
import * as Links from '../components/links.js';
import { kalliopeMenu } from '../components/menu.js';
import Page from '../components/page.js';
import PageLead from '../components/pagelead.js';
import SectionedList from '../components/sectionedlist.js';
import SubHeading from '../components/subheading.js';

const groupsByLetter = (keywords) => {
  let groups = new Map();
  keywords.forEach((k) => {
    let key = k.title[0];
    let group = groups.get(key) || [];
    group.push(k);
    groups.set(key, group);
  });
  let sortedGroups = [];
  groups.forEach((group, key) => {
    sortedGroups.push({
      title: key,
      items: group.sort(Sorting.keywordsByTitle),
    });
  });
  return sortedGroups.sort(Sorting.sectionsByTitle);
};

const keywordListItem = (keyword, lang) => {
  const url =
    keyword.redirectURL != null
      ? keyword.redirectURL.replace('${lang}', lang)
      : Links.keywordURL(lang, keyword.id);
  return {
    id: keyword.id,
    url,
    html: keyword.title,
  };
};

const Keywords = (props) => {
  const { keywords, categories } = props;
  const lang = useContext(LangContext);

  const requestPath = `/${lang}/keywords`;

  const nonDrafts = keywords.filter((k) => !k.is_draft);
  const groups = groupsByLetter(nonDrafts);
  const sections = [];

  groups.forEach((group) => {
    const items = group.items.map(keyword => keywordListItem(keyword, lang));
    sections.push({ title: group.title, items });
  });

  const categorySections = categories.map(category => ({
    id: `keyword-category-${category.id}`,
    title: category.title,
    items: nonDrafts
      .filter(keyword =>
        (keyword.categories ?? []).some(item => item.id === category.id)
      )
      .sort(Sorting.keywordsByTitle)
      .map(keyword => keywordListItem(keyword, lang)),
  })).filter(section => section.items.length > 0);

  return (
    <Page
      headTitle={_('Nøgleord', lang) + ' - Kalliope'}
      requestPath={requestPath}
      crumbs={[...kalliopeCrumbs(lang), { title: _('Nøgleord', lang) }]}
      pageTitle={_('Nøgleord', lang)}
      menuItems={kalliopeMenu()}
      selectedMenuItem="keywords">
      <PageLead>
        {_(
          'Her finder du Kalliopes artikler om litterære perioder, genrer, versformer, begreber og andre emner med tilknytning til digtningen.',
          lang
        )}
      </PageLead>
      {categorySections.length > 0 ? (
        <>
          <SubHeading>{_('Efter emne', lang)}</SubHeading>
          <SectionedList sections={categorySections} />
        </>
      ) : null}
      <SubHeading>{_('Alfabetisk', lang)}</SubHeading>
      <SectionedList sections={sections} />
      <LangSelect path={requestPath} />
    </Page>
  );
};

Keywords.getInitialProps = async ({ query: { lang } }) => {
  const [keywordsResponse, categoriesResponse] = await Promise.all([
    fetch(createURL('/api/keywords.json')),
    fetch(createURL('/api/keyword-categories.json')),
  ]);
  const [keywords, categories] = await Promise.all([
    keywordsResponse.json(),
    categoriesResponse.json(),
  ]);
  return { lang, keywords, categories };
};

export default Keywords;
