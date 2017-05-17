import Link from 'next/link';
import Head from '../components/head';
import Nav from '../components/nav';
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
      return <div key={i}>{work.title}</div>;
    });
    return (
      <div>
        <Head title="Digtere - Kalliope" />
        <Nav />

        <div className="row">
          <h1 className="title">Værker for {poet.id}</h1>
          {list}
        </div>
      </div>
    );
  }
}
