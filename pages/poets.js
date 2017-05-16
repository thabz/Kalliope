import Link from 'next/link'
import Head from '../components/head'
import Nav from '../components/nav'

export default class extends React.Component {
  static getInitialProps ({ query: { lang } }) {
    return { lang }
  }
  render() {
    return (
    <div>
      <Head title="Digtere - Kalliope" />
      <Nav />

      <div className="hero">
        <h1 className="title">Poets {this.props.lang}!</h1>
        <p className="description">Here goes the list of poets</p>
      </div>
    </div>
  )
}
}
