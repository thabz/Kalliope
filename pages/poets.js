import Link from 'next/link';
import Head from '../components/head';
import * as Links from '../components/links';
import Nav from '../components/nav';
import Tabs from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
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
  return groups;
};

const groupsByYear = poets => {
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
  return groups;
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
    groups.forEach((poets, key) => {
      const list = poets.map((poet, i) => {
        const url = `/${lang}/works/${poet.id}`;
        return (
          <div key={i}>
            <a href={url}>
              <PoetName poet={poet} lastNameFirst includePeriod />
            </a>
          </div>
        );
      });
      const renderedGroup = (
        <div className="list-section" key={key}>
          <h3>{key}</h3>
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
