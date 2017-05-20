// @flow

import Link from 'next/link';
import Head from '../components/head';
import Nav from '../components/nav';
import Heading from '../components/heading.js';

export default class extends React.Component {
  render() {
    return (
      <div>
        <Head title="Digtere - Kalliope" />
        <div className="row">
          <Nav />
          <Heading title="Kalliope" subtitle="Spring/summer 2017" />
          <div className="two-columns" />
        </div>
      </div>
    );
  }
}
