import Link from 'next/link';
import Head from '../components/head';
import * as Links from '../components/links';
import Nav from '../components/nav';
import Tabs from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import * as Sorting from './helpers/sorting.js';
import 'isomorphic-fetch';

const groupsByLetter = poets => {
  let groups = new Map();
  poets.forEach(p => {
    let key = 'Ukendt digter';
    if (p.name.lastname) {
      key = p.name.lastname[0];
    }
    if (key === 'A' && p.name.lastname.indexOf('Aa') === 0) {
      key = 'Å';
    }
    let group = groups.get(key) || [];
    group.push(p);
    groups.set(key, group);
  });
  let sortedGroups = [];
  groups.forEach((group, key) => {
    sortedGroups.push({
      title: key,
      items: group.sort(Sorting.poetsByLastname),
    });
  });
  return sortedGroups.sort(Sorting.sectionsByTitle);
};

const groupsByYear = poets => {
  let groups = new Map();
  poets.filter(p => p.type === 'poet').forEach(p => {
    let key = 'Ukendt fødeår';
    if (p.period.born.date !== '?') {
      const year = parseInt(p.period.born.date.substring(0, 4), 10);
      const intervalStart = year - year % 25;
      key = `${intervalStart} - ${intervalStart + 24}`;
    }
    let group = groups.get(key) || [];
    group.push(p);
    groups.set(key, group);
  });
  let sortedGroups = [];
  groups.forEach((group, key) => {
    sortedGroups.push({
      title: key,
      items: group.sort(Sorting.poetsByBirthDate),
    });
  });
  return sortedGroups.sort(Sorting.sortSectionsByTitle);
};

export default class extends React.Component {
  static async getInitialProps({ query: { lang, groupBy } }) {
    const res = await fetch('http://localhost:3000/static/api/poets-dk.json');
    const poets = await res.json();
    return { lang, groupBy, poets };
  }

  render() {
    const { lang, poets, groupBy } = this.props;

    const tabs = [
      { title: 'Efter navn', url: Links.poetsURL(lang, 'name') },
      { title: 'Efter år', url: Links.poetsURL(lang, 'year') },
    ];
    const selectedTabIndex = groupBy === 'name' ? 0 : 1;
    const groups = groupBy === 'name'
      ? groupsByLetter(poets)
      : groupsByYear(poets);

    let renderedGroups = [];
    groups.forEach(group => {
      const { title, items } = group;
      const list = items.map((poet, i) => {
        const url = `/${lang}/works/${poet.id}`;
        return (
          <div key={poet.id}>
            <a href={url}>
              <PoetName poet={poet} lastNameFirst includePeriod />
            </a>
          </div>
        );
      });
      const renderedGroup = (
        <div className="list-section" key={title}>
          <h3>{title}</h3>
          {list}
        </div>
      );

      renderedGroups.push(renderedGroup);
    });

    return (
      <div>
        <Head title="Digtere - Kalliope" />

        <div className="row">
          <Nav />
          <Heading title="Digtere" />
          <Tabs items={tabs} selectedIndex={selectedTabIndex} />
          <div className="two-columns">
            {renderedGroups}
          </div>
        </div>
      </div>
    );
  }
}
