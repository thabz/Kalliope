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
  handle_metrik(s: string) {
    // Disse metrik symboler ligger i Unicode 23Dx
    // http://www.unicode.org/charts/PDF/U2300.pdf
    const unicode = s
      .replace(/_u/g, '\u23D3')
      .replace(/_/g, '\u00A0')
      .replace(/uu/g, '\u23D6')
      .replace(/u/g, '\u23D1')
      .replace(/-/g, '\u23BC');
    const parts = unicode.split(/ */).map(x => (
      <span
        style={{
          display: 'inline-block',
          width: '1em',
        }}>
        {x}
      </span>
    ));
    return <span style={{ fontSize: '1.1em' }}>{parts}</span>;
  }
  handle_a(node: any) {
    const lang = this.props.lang;
    if (node.hasAttribute('person')) {
      const poetId = node.getAttribute('person');
      return (
        <a href={Links.poetURL(lang, poetId)}>
          {this.handle_nodes(node.childNodes)}
        </a>
      );
    } else if (node.hasAttribute('poet')) {
      const poetId = node.getAttribute('poet');
      return (
        <a href={Links.poetURL(lang, poetId)}>
          {this.handle_nodes(node.childNodes)}
        </a>
      );
    } else if (node.hasAttribute('poem')) {
      const textId = node.getAttribute('poem');
      return (
        <a href={Links.textURL(lang, textId)}>
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
    } else if (node.hasAttribute('href')) {
      const href = node.getAttribute('href');
      return (
        <a href={href}>
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
      case 'b':
        return <b>{this.handle_nodes(node.childNodes)}</b>;
      case 'wrap':
      case 'content':
      case 'nonum':
        return this.handle_nodes(node.childNodes);
      case 'center':
        return <center>{this.handle_nodes(node.childNodes)}</center>;
      case 's':
      case 'small':
        return <small>{this.handle_nodes(node.childNodes)}</small>;
      case 'right':
        return (
          <p style={{ textAlign: 'right' }}>
            {this.handle_nodes(node.childNodes)}
          </p>
        );
      case 'w':
        return (
          <span style={{ letterSpacing: '0.2em' }}>
            {this.handle_nodes(node.childNodes)}
          </span>
        );
      case 'metrik':
        return this.handle_metrik(node.textContent);
      case 'hr':
        const width = Math.min(node.getAttribute('width') * 10, 100);
        return (
          <hr
            noshade
            align="center"
            size="1"
            color="black"
            style={{ color: 'black', width: `${width}%` }}
          />
        );
      case 'footnote':
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
      let renderedNode = this.handle_node(node);
      collected.push(renderedNode);
    }
    return collected;
  }
  render() {
    // TODO: Some refs-context with titles of references poems and works.
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
