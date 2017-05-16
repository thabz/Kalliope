import Link from 'next/link'
import Head from '../components/head'
import Nav from '../components/nav'
import 'isomorphic-fetch'

export default class extends React.Component {
  static async getInitialProps ({ query: { lang } }) {
    const res = await fetch('http://localhost:3000/static/api/poets-dk.json')
    const poets = await res.json()
    return { lang, poets }
  }
  render() {
    const { lang, poets } = this.props;
    const list = poets.map( (poet, i) => {
      return <div key={i}>{poet.lastName}</div>;
    })
    return (
    <div>
      <Head title="Digtere - Kalliope" />
      <Nav />

      <div className="hero">
        <h1 className="title">Poets {this.props.lang}!</h1>
        <p className="description">Here goes the list of poets</p>
        {list}
      </div>
    </div>
    )
  }
}
