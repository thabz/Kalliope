// @flow
import React from 'react';
var DOMParser = require('xmldom').DOMParser;

import type { Text } from '../pages/helpers/types.js';

export default class extends React.Component {
  props: {
    contentHtml: string,
  };
  handle_node(node: any) {
    switch (node.nodeName) {
      case 'br':
        return <br />;
      case '#text':
        return node.textContent;
      case 'i':
        return <i>{this.handle_nodes(node.childNodes)}</i>;
      case 'content':
        return this.handle_nodes(node.childNodes);
      default:
        return <code>{node.toString()}</code>;
    }
  }

  handle_nodes(nodes: any) {
    let collected = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes.item(i);
      collected.push(this.handle_node(node));
    }
    return collected;
  }
  render() {
    // TODO: We need lang too, and some context.
    const { contentHtml } = this.props;
    const frag = new DOMParser().parseFromString(
      '<content>' + contentHtml + '</content>'
    );
    const rendered = this.handle_nodes(frag.childNodes);
    return (
      <div>
        <div>{rendered}</div>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{contentHtml}</pre>
      </div>
    );
  }
}
