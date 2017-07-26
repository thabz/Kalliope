// @flow
import React from 'react';
import { Link } from '../routes';
var DOMParser = require('xmldom').DOMParser;

import type { Text, Lang, TextContentOptions } from '../pages/helpers/types.js';
import { Footnote } from './footnotes.js';
import * as Links from './links';

export default class TextContent extends React.Component {
  props: {
    contentHtml: string,
    lang: Lang,
    options?: TextContentOptions,
  };
  keySeq: number;
  constructor(props) {
    super(props);
    this.keySeq = 1;
  }
  handle_metrik(s: string) {
    // Disse metrik symboler ligger i Unicode 23Dx
    // http://www.unicode.org/charts/PDF/U2300.pdf
    const unicode = s
      .replace(/_u/g, '\u23D3')
      .replace(/_/g, '\u00A0')
      .replace(/uu/g, '\u23D6')
      .replace(/u/g, '\u23D1')
      .replace(/-/g, '\u23BC');
    const parts = unicode.split(/ */).map(x =>
      <span
        style={{
          display: 'inline-block',
          width: '1em',
        }}>
        {x}
      </span>
    );
    return <span style={{ fontSize: '1.1em' }}>{parts}</span>;
  }
  handle_a(node: any) {
    const lang = this.props.lang;
    if (node.hasAttribute('person')) {
      const poetId = node.getAttribute('person');
      return (
        <Link route={Links.poetURL(lang, poetId)}>
          <a>{this.handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('poet')) {
      const poetId = node.getAttribute('poet');
      return (
        <Link route={Links.poetURL(lang, poetId)}>
          <a>{this.handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('poem')) {
      const textId = node.getAttribute('poem');
      return (
        <Link route={Links.textURL(lang, textId)}>
          <a>{this.handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('keyword')) {
      const keywordId = node.getAttribute('keyword');
      return (
        <Link route={Links.keywordURL(lang, keywordId)}>
          <a>
            {this.handle_nodes(node.childNodes)}
          </a>
        </Link>
      );
    } else if (node.hasAttribute('dict')) {
      const keywordId = node.getAttribute('dict');
      return (
        <Link route={Links.dictionaryURL(lang, keywordId)}>
          <a>
            {this.handle_nodes(node.childNodes)}
          </a>
        </Link>
      );
    } else if (node.hasAttribute('work')) {
      const parts = node.getAttribute('work').split('/');
      const poetId = parts[0];
      const workId = parts[1];
      return (
        <Link route={Links.workURL(lang, poetId, workId)}>
          <a>
            {this.handle_nodes(node.childNodes)}
          </a>
        </Link>
      );
    } else if (node.hasAttribute('href')) {
      const href = node.getAttribute('href');
      return (
        <Link route={href}>
          <a>{this.handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('bible')) {
      const bibleId = node.getAttribute('bible');
      return (
        <Link route={Links.bibleURL(lang, bibleId)}>
          <a>{this.handle_nodes(node.childNodes)}</a>
        </Link>
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
        return <i key={this.keySeq++}>{this.handle_nodes(node.childNodes)}</i>;
      case 'b':
        return <b>{this.handle_nodes(node.childNodes)}</b>;
      case 'p':
        return <p>{this.handle_nodes(node.childNodes)}</p>;
      case 'blockquote':
        return <blockquote>{this.handle_nodes(node.childNodes)}</blockquote>;
      case 'sup':
        return <sup>{this.handle_nodes(node.childNodes)}</sup>;
      case 'strike':
        return <strike>{this.handle_nodes(node.childNodes)}</strike>;
      case 'year':
      case 'wrap':
      case 'content':
      case 'nonum':
      case 'resetnum':
        return this.handle_nodes(node.childNodes);
      case 'center':
        // <center> er et block element og for at undgå dobbelt
        // linjeskift efter (vi laver jo \n til <br/>) renderer
        // vi som inline-block.
        return (
          <center style={{ display: 'inline-block', width: '100%' }}>
            {this.handle_nodes(node.childNodes)}
          </center>
        );
      case 's':
      case 'small':
        return (
          <small style={{ display: 'inline', lineHeight: '1.4em' }}>
            {this.handle_nodes(node.childNodes)}
          </small>
        );
      case 'biblio':
        return (
          <span style={{ opacity: 0.5 }}>
            [{this.handle_nodes(node.childNodes)}]
          </span>
        );
      case 'right':
        return (
          <div
            style={{
              display: 'inline-block',
              width: '100%',
              textAlign: 'right',
            }}>
            {this.handle_nodes(node.childNodes)}
          </div>
        );
      case 'num':
        return (
          <div
            style={{
              display: 'inline',
              opacity: 0.4,
              pageBreakAfter: 'avoid', // Not working.
            }}>
            {this.handle_nodes(node.childNodes)}
          </div>
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
            size="1"
            color="black"
            style={{ color: 'black', width: `${width}%` }}
          />
        );
      case 'footnote':
      case 'note':
        const noteContent = this.handle_nodes(node.childNodes);
        return <Footnote key={this.keySeq++} text={noteContent} />;
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
    const { contentHtml, options } = this.props;
    if (contentHtml == null) {
      return null;
    }
    const frag = new DOMParser().parseFromString(
      '<content>' + contentHtml + '</content>'
    );
    let rendered = this.handle_nodes(frag.childNodes);
    if (options != null && options.isBibleVerses) {
      //console.log(rendered);
    }
    return <div>{rendered}</div>;
  }
}
