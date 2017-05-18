import Link from 'next/link';
import Head from '../components/head';
import Nav from '../components/nav';
import Heading from '../components/heading.js';
import PoetName from '../components/poetname.js';
import WorkName from '../components/workname.js';
import 'isomorphic-fetch';

export default class extends React.Component {
  static async getInitialProps({ query: { lang, poetId } }) {
    const res = await fetch(
      `http://localhost:3000/static/api/${poetId}/works.json`
    );
    const json = await res.json();
    return { lang, poet: json.poet, works: json.works };
  }

  render() {
    const { lang, poet, works } = this.props;
    const list = works.map((work, i) => {
      const url = `/${lang}/work/${poet.id}/${work.id}`;
      return <div key={i}><a href={url}><WorkName work={work} /></a></div>;
    });
    const title = <PoetName poet={poet} includePeriod />;
    return (
      <div>
        <Head title="Digtere - Kalliope" />
        <Nav />

        <div className="row">
          <Heading title={title} subtitle="Værker" />
          <div className="two-columns">
            {list}
          </div>
        </div>
      </div>
    );
  }
}
