import Link from 'next/link';
import Head from '../components/head';
import Nav from '../components/nav';
import Heading from '../components/heading';
import 'isomorphic-fetch';

export default class extends React.Component {
  static async getInitialProps({ query: { lang } }) {
    const res = await fetch('http://localhost:3000/static/api/poets-dk.json');
    const poets = await res.json();
    return { lang, poets };
  }
  render() {
    const { lang, poets } = this.props;
    const list = poets.map((poet, i) => {
      const url = `/${lang}/works/${poet.id}`;
      return <div key={i}><a href={url}>{poet.name.lastname}</a></div>;
    });
    return (
      <div>
        <Head title="Digtere - Kalliope" />
        <Nav />

        <div className="row">
        <Heading title="Digtere"/>
          {list}
        </div>
      </div>
    );
  }
}
