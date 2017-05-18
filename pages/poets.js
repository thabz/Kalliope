import Link from 'next/link';
import Head from '../components/head';
import Nav from '../components/nav';
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

export default class extends React.Component {
  static async getInitialProps({ query: { lang } }) {
    const res = await fetch('http://localhost:3000/static/api/poets-dk.json');
    const poets = await res.json();
    return { lang, poets };
  }

  render() {
    const { lang, poets } = this.props;

    const groups = groupsByLetter(poets);

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
        <div className="list-section">
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
          <Heading title="Digtere" subtitle="Efter navn" />
          <div className="two-columns">
            {renderedGroups}
          </div>
        </div>
      </div>
    );
  }
}
