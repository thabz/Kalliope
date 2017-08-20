// @flow
import React from 'react';
import { Link } from '../routes';
var DOMParser = require('xmldom').DOMParser;

import type {
  Text,
  Lang,
  TextContentOptions,
  TextContentType,
} from '../pages/helpers/types.js';
import { Footnote } from './footnotes.js';
import * as Links from './links';

type TextContentPropsType = {
  contentHtml: TextContentType,
  lang: Lang,
  options?: TextContentOptions,
  style?: ?Object,
  className?: ?string,
  keyPrefix?: string, // Ved bladring hopper linjenumrene hvis alle digtes linjer har samme key.
};
export default class TextContent extends React.Component {
  props: TextContentPropsType;
  static defaultProps = {
    keyPrefix: 'linje-',
  };
  keySeq: number;

  constructor(props: TextContentPropsType) {
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
    const parts = unicode.split(/ */).map((x, i) =>
      <span
        key={i}
        style={{
          display: 'inline-block',
          width: '1em',
          marginRight: '0.3em',
        }}>
        {x}
      </span>
    );
    return (
      <span key={this.keySeq++} style={{ fontSize: '1.1em' }}>
        {parts}
      </span>
    );
  }
  handle_a(node: any) {
    const lang = this.props.lang;
    if (node.hasAttribute('person')) {
      const poetId = node.getAttribute('person');
      return (
        <Link key={this.keySeq++} route={Links.poetURL(lang, poetId)}>
          <a>
            {this.handle_nodes(node.childNodes)}
          </a>
        </Link>
      );
    } else if (node.hasAttribute('poet')) {
      const poetId = node.getAttribute('poet');
      return (
        <Link key={this.keySeq++} route={Links.poetURL(lang, poetId)}>
          <a>
            {this.handle_nodes(node.childNodes)}
          </a>
        </Link>
      );
    } else if (node.hasAttribute('poem')) {
      const textId = node.getAttribute('poem');
      return (
        <Link key={this.keySeq++} route={Links.textURL(lang, textId)}>
          <a>
            {this.handle_nodes(node.childNodes)}
          </a>
        </Link>
      );
    } else if (node.hasAttribute('keyword')) {
      const keywordId = node.getAttribute('keyword');
      return (
        <Link key={this.keySeq++} route={Links.keywordURL(lang, keywordId)}>
          <a>
            {this.handle_nodes(node.childNodes)}
          </a>
        </Link>
      );
    } else if (node.hasAttribute('dict')) {
      const keywordId = node.getAttribute('dict');
      return (
        <Link key={this.keySeq++} route={Links.dictionaryURL(lang, keywordId)}>
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
        <Link key={this.keySeq++} route={Links.workURL(lang, poetId, workId)}>
          <a>
            {this.handle_nodes(node.childNodes)}
          </a>
        </Link>
      );
    } else if (node.hasAttribute('href')) {
      const href = node.getAttribute('href');
      return (
        <Link key={this.keySeq++} route={href}>
          <a>
            {this.handle_nodes(node.childNodes)}
          </a>
        </Link>
      );
    } else if (node.hasAttribute('bible')) {
      const bibleId = node.getAttribute('bible');
      return (
        <Link key={this.keySeq++} route={Links.bibleURL(lang, bibleId)}>
          <a>
            {this.handle_nodes(node.childNodes)}
          </a>
        </Link>
      );
    } else {
      return (
        <code>
          {node.toString()}
        </code>
      );
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
        return (
          <i key={this.keySeq++}>
            {this.handle_nodes(node.childNodes)}
          </i>
        );
      case 'b':
        return (
          <b key={this.keySeq++}>
            {this.handle_nodes(node.childNodes)}
          </b>
        );
      case 'p':
        return (
          <p>
            {this.handle_nodes(node.childNodes)}
          </p>
        );
      case 'blockquote':
        return (
          <blockquote>
            {this.handle_nodes(node.childNodes)}
          </blockquote>
        );
      case 'sup':
        return (
          <sup key={this.keySeq++}>
            {this.handle_nodes(node.childNodes)}
          </sup>
        );
      case 'strike':
        return (
          <strike>
            {this.handle_nodes(node.childNodes)}
          </strike>
        );
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
          <center
            key={this.keySeq++}
            style={{ display: 'inline-block', width: '100%' }}>
            {this.handle_nodes(node.childNodes)}
          </center>
        );
      case 's':
      case 'small':
        return (
          <small
            key={this.keySeq++}
            style={{ display: 'inline', lineHeight: '1.4em' }}>
            {this.handle_nodes(node.childNodes)}
          </small>
        );
      case 'biblio':
        return (
          <span key={this.keySeq++} style={{ opacity: 0.5 }}>
            [{this.handle_nodes(node.childNodes)}]
          </span>
        );
      case 'right':
        return (
          <span
            key={this.keySeq++}
            style={{
              display: 'inline-block',
              width: '100%',
              textAlign: 'right',
            }}>
            {this.handle_nodes(node.childNodes)}
          </span>
        );
      case 'num':
        return (
          <span
            key={this.keySeq++}
            style={{
              display: 'inline',
              opacity: 0.4,
              pageBreakAfter: 'avoid', // Not working.
            }}>
            {this.handle_nodes(node.childNodes)}
          </span>
        );
      case 'w':
        return (
          <span key={this.keySeq++} style={{ letterSpacing: '0.2em' }}>
            {this.handle_nodes(node.childNodes)}
          </span>
        );
      case 'metrik':
        return this.handle_metrik(node.textContent);
      case 'hr':
        const width = Math.min(node.getAttribute('width') * 10, 100);
        return (
          <hr
            key={this.keySeq++}
            size="1"
            color="black"
            style={{ color: 'black', width: `${width}%` }}
          />
        );
      case 'img': {
        const width = node.getAttribute('width');
        const src = node.getAttribute('src');
        const alt = node.getAttribute('alt');
        if (width == null || alt == null) {
          console.log(`Der mangler alt-attribut på inline img.`);
        }
        const style = {
          width: width,
          maxWidth: '100%',
        };
        return <img key={this.keySeq++} src={src} style={style} alt={alt} />;
      }
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
        console.log(`Mærkeligt tag fundet ${node.toString()}`);
        return (
          <code>
            {node.toString()}
          </code>
        );
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
    const { contentHtml, style, keyPrefix, className } = this.props;
    const options = this.props.options || {};

    if (contentHtml == null) {
      return null;
    }
    if (!(contentHtml instanceof Array)) {
      return (
        <div>
          <pre>
            {JSON.stringify(contentHtml)}
          </pre>
        </div>
      );
    }

    if (options.highlight != null) {
      const lastLineNum = contentHtml
        .map(l => {
          const lineOptions = l.length > 1 ? l[1] : {};
          const lineNum =
            lineOptions.num != null ? parseInt(lineOptions.num) : null;
          return lineNum != null ? lineNum : -1;
        })
        .reduce((maxLineNum, lineNum) => {
          return Math.max(lineNum, maxLineNum);
        }, -1);
      // Bound the values
      options.highlight.from = Math.max(1, options.highlight.from);
      options.highlight.to = Math.min(lastLineNum, options.highlight.to);
    }

    let isHighlighting = false;
    const lines = contentHtml.map((l, i) => {
      const lineOptions = l.length > 1 ? l[1] : {};
      const lineNum =
        lineOptions.num != null ? parseInt(lineOptions.num) : null;
      let className = '';
      let anchor = null;

      let rendered = null;
      if (options.highlight != null) {
        if (lineNum != null && lineNum === options.highlight.from) {
          isHighlighting = true;
          className += ' highlighted-line first-highlighted-line';
        }
        if (lineNum != null && lineNum === options.highlight.to) {
          isHighlighting = false;
          className += ' highlighted-line last-highlighted-line';
        }
        if (isHighlighting) {
          className += ' highlighted-line';
        }
        if (lineNum === options.highlight.from - 4) {
          anchor = <a id="h" name="h" />;
        }
      }

      if (lineOptions.html) {
        const frag = new DOMParser().parseFromString(
          '<content>' + l[0] + '</content>'
        );
        rendered = this.handle_nodes(frag.childNodes);
      } else {
        rendered = l[0];
        if (rendered.trim().length === 0) {
          if (options == null || !options.isPoetry) {
            className += ' half-height-blank';
          }
          rendered = <br />;
        }
      }
      if (lineOptions.center) {
        className += ' center';
      }
      if (lineOptions.right) {
        className += ' right';
      }

      if (options.isPoetry) {
        className += ' poem-line';
        const displayedLineNum =
          lineNum != null && lineNum % 5 === 0 ? lineNum : null;
        return (
          <div
            className={className}
            data-num={displayedLineNum}
            key={keyPrefix + i}>
            {anchor}
            {rendered}
          </div>
        );
      } else if (options.isBible) {
        className += ' bible-line';
        return (
          <div className={className} data-num={lineNum} key={keyPrefix + i}>
            {anchor}
            {rendered}
          </div>
        );
      } else {
        // Prose
        return (
          <div className={className} key={i + keyPrefix}>
            {rendered}
          </div>
        );
      }
    });

    return (
      <div style={style} className={className}>
        {lines}
        <style jsx>{`
          :global(.poem-line::before),
          :global(.bible-line::before) {
            content: attr(data-num);
            color: #888;
            margin-right: 1em;
            width: 1.5em;
            font-size: 0.8em;
            text-align: right;
            display: inline-block;
            margin-left: -2.5em;
          }
          :global(.bible-line),
          :global(.poem-line) {
            margin-left: 1.5em;
          }
          :global(.highlighted-line) {
            background-color: rgb(253, 246, 227);
            margin-left: 1em;
            padding-left: 0.5em;
            margin-right: -0.5em;
            padding-right: 0.5em;
            margin-top: -0.08em;
            padding-top: 0.08em;
            margin-bottom: -0.08em;
            padding-bottom: 0.08em;
            border-left: 1px solid rgb(238, 232, 213);
            border-right: 1px solid rgb(238, 232, 213);
          }

          :global(.first-highlighted-line) {
            border-top: 1px solid rgb(238, 232, 213);
            /*
            border-top-left-radius: 0.25em;
            border-top-right-radius: 0.25em;
            */
          }

          :global(.last-highlighted-line) {
            border-bottom: 1px solid rgb(238, 232, 213);
            /*
            border-bottom-left-radius: 0.25em;
            border-bottom-right-radius: 0.25em;
            */
          }

          :global(.right) {
            text-align: right;
          }
          :global(.center) {
            text-align: center;
          }
          :global(.half-height-blank) {
            line-height: 0.8;
          }
        `}</style>
      </div>
    );
  }
}
