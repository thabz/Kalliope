import Link from 'next/link';
import Head from '../components/head';
import Nav from '../components/nav';
import Heading from '../components/heading.js';

const todoItems = ["To digtere har 'kjaer' som id."];

export default class extends React.Component {
  render() {
    const items = todoItems.map(item => {
      return <div>{item.name}</div>;
    });
    return (
      <div>
        <Head title="Digtere - Kalliope" />
        <div className="row">
          <Nav />
          <Heading title="Kalliope" subtitle="Spring/summer 2017" />
          <div className="two-columns">
            {todoItems}
          </div>
        </div>
      </div>
    );
  }
}
