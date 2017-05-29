// @flow
import React from 'react';
var DOMParser = require('xmldom').DOMParser;

import type { Text, Lang } from '../pages/helpers/types.js';
import { Footnote } from './footnotes.js';
import * as Links from './links';

export default class extends React.Component {
  props: {
    contentHtml: string,
    lang: Lang,
  };
  handle_a(node: any) {
    const lang = this.props.lang;
    if (node.hasAttribute('person')) {
      const poetId = node.getAttribute('person');
      return (
        <a href={Links.poetURL(lang, poetId)}>
          {this.handle_nodes(node.childNodes)}
        </a>
      );
    } else if (node.hasAttribute('work')) {
      const parts = node.getAttribute('work').split('/');
      const poetId = parts[0];
      const workId = parts[1];
      return (
        <a href={Links.workURL(lang, poetId, workId)}>
          {this.handle_nodes(node.childNodes)}
        </a>
      );
    } else {
      return <code>{node.toString()}</code>;
    }
  }
  handle_node(node: any) {
    switch (node.nodeName) {
      case 'br':
        return <br />;
      case '#text':
        return node.textContent;
      case '#comment':
        return null;
      case 'i':
        return <i>{this.handle_nodes(node.childNodes)}</i>;
      case 'content':
      case 'nonum':
        return this.handle_nodes(node.childNodes);
      case 'center':
        return <center>{this.handle_nodes(node.childNodes)}</center>;
      case 'w':
        return (
          <span style={{ letterSpacing: '0.2em' }}>
            {this.handle_nodes(node.childNodes)}
          </span>
        );
      case 'note':
        const noteContent = this.handle_nodes(node.childNodes);
        return <Footnote text={noteContent} />;
      case 'sc':
        return (
          <span style={{ fontVariant: 'small-caps' }}>
            {this.handle_nodes(node.childNodes)}
          </span>
        );
      case 'a':
        return this.handle_a(node);
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
