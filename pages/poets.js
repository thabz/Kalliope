import Link from 'next/link'
import Head from '../components/head'
import Nav from '../components/nav'

export default () => (
  <div>
    <Head title="Digtere - Kalliope" />
    <Nav />

    <div className="hero">
      <h1 className="title">Poets!</h1>
      <p className="description">Here goes the list of poets</p>
    </div>
  </div>
)
