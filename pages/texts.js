import * as Client from '../common/client.js';
import CommonData from '../common/commondata.js';
import * as OpenGraph from '../common/opengraph.js';
import * as Sorting from '../common/sorting.js';
import _ from '../common/translations.js';
import { poetCrumbsWithTitle } from '../components/breadcrumbs.js';
import * as Links from '../components/links.js';
import { poetMenu } from '../components/menu.js';
import Page from '../components/page.js';
import { poetNameString } from '../components/poetname-helpers.js';
import PoetName from '../components/poetname.js';
import SectionedList from '../components/sectionedlist.js';

const groupLines = (lines, type) => {
  let groups = new Map();
  lines.forEach((linePair) => {
    let line, alternative;
    if (type === 'titles') {
      line = linePair.title;
      alternative = linePair.firstline;
    } else {
      line = linePair.firstline;
      alternative = linePair.title;
    }
    if (line == null || line.length == 0) {
      return;
    }
    line = line.replace(',', '').replace('!', '');
    linePair['sortBy'] = line + ' [' + alternative + '[' + linePair.id;
    let letter = line[0];
    if (line.indexOf('Aa') === 0) {
      letter = 'Å';
    }
    if (line.indexOf('Ö') === 0) {
      letter = 'Ø';
    }
    if (line.indexOf('È') === 0) {
      letter = 'E';
    }
    // Oldgræsk. Nedenstående dog virker ikke lige her, men
    // er OK i Node-terminalen.
    letter = letter
      .normalize('NFD') // splitter prækomponerede tegn
      .replace(/[\u0300-\u036f]/g, '') // fjern kombinerende diakritika
      .normalize('NFC');
    letter = letter.toUpperCase();
    let array = groups.get(letter) || [];
    array.push(linePair);
    groups.set(letter, array);
  });
  let sortedGroups = [];
  groups.forEach((group, key) => {
    sortedGroups.push({
      title: key,
      items: group.sort(Sorting.linesPairsByLine),
    });
  });
  return sortedGroups.sort(Sorting.sectionsByTitle);
};

const TextsPage = (props) => {
  const { lang, poet, type, lines } = props;

  const groups = groupLines(lines, type);
  let sections = [];
  groups.forEach((group) => {
    const items = group.items.map((lines) => {
      const url = Links.textURL(lang, lines.id);
      let line = lines[type === 'titles' ? 'title' : 'firstline'];
      let alternative = lines[type === 'titles' ? 'firstline' : 'title'];
      let renderedAlternative = null;
      let isNonUnique =
        lines[
          type === 'titles' ? 'non_unique_indextitle' : 'non_unique_firstline'
        ];
      if (isNonUnique != null && alternative != null) {
        renderedAlternative = (
          <span style={{ color: CommonData.lightLinkColor }}>
            {' '}
            [{alternative}]
          </span>
        );
      }
      return {
        id: lines.id,
        url: url,
        html: (
          <span>
            {line}
            {renderedAlternative}
          </span>
        ),
      };
    });
    sections.push({ title: group.title, items });
  });

  let renderedGroups = <SectionedList sections={sections} />;

  const lastCrumbTitle =
    type === 'titles' ? _('Titler', lang) : _('Førstelinjer', lang);

  return (
    <Page
      headTitle={`${lastCrumbTitle} - ${poetNameString(poet)} - Kalliope`}
      ogTitle={poetNameString(poet, false, false)}
      ogImage={OpenGraph.poetImage(poet)}
      requestPath={`/${lang}/texts/${poet.id}/${type}`}
      crumbs={poetCrumbsWithTitle(lang, poet, lastCrumbTitle)}
      pageTitle={<PoetName poet={poet} includePeriod />}
      menuItems={poetMenu(poet)}
      poet={poet}
      selectedMenuItem={type}
    >
      {renderedGroups}
    </Page>
  );
};

TextsPage.getInitialProps = async ({ query: { lang, poetId, type } }) => {
  const json = await Client.texts(poetId);
  return {
    lang,
    poet: json.poet,
    lines: json.lines,
    type,
  };
};

export default TextsPage;
