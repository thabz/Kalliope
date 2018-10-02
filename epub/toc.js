import React from 'react';
import ReactDOMServer from 'react-dom/server';

// Invoke with ./node_modules/.bin/babel-node epub/toc.js

class TOC extends React.Component {
  render() {
    return 'Hej';
  }
}

const markup = ReactDOMServer.renderToStaticMarkup(<p>Hej</p>);

console.log(markup);
