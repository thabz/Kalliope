// @flow
import React from 'react';
import { Link } from '../routes';
var DOMParser = require('xmldom').DOMParser;

import type {
  Text,
  TextLang,
  Lang,
  TextContentOptions,
  TextContentType,
} from '../pages/helpers/types.js';
import { Footnote } from './footnotes.js';
import * as Links from './links';

// Fiks bindestreger mellem årstal, sidetal osv.
const replaceHyphens = s => {
  return s.replace(/(\d)-(\d)/g, '$1–$2'); // Hyphen/minus (U+002D) to en-dash (U+2013)
};

type TextContentPropsType = {
  contentHtml: TextContentType,
  contentLang: TextLang,
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
    const parts = unicode.split(/ */).map((x, i) => (
      <span
        key={i}
        style={{
          display: 'inline-block',
          width: '1em',
          marginRight: '0.3em',
        }}>
        {x}
      </span>
    ));
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
          <a>{this.handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('poet')) {
      const poetId = node.getAttribute('poet');
      return (
        <Link key={this.keySeq++} route={Links.poetURL(lang, poetId)}>
          <a>{this.handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('poem')) {
      const textId = node.getAttribute('poem');
      return (
        <Link key={this.keySeq++} route={Links.textURL(lang, textId)}>
          <a>{this.handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('keyword')) {
      const keywordId = node.getAttribute('keyword');
      return (
        <Link key={this.keySeq++} route={Links.keywordURL(lang, keywordId)}>
          <a>{this.handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('dict')) {
      const keywordId = node.getAttribute('dict');
      return (
        <Link key={this.keySeq++} route={Links.dictionaryURL(lang, keywordId)}>
          <a>{this.handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('work')) {
      const parts = node.getAttribute('work').split('/');
      const poetId = parts[0];
      const workId = parts[1];
      return (
        <Link key={this.keySeq++} route={Links.workURL(lang, poetId, workId)}>
          <a>{this.handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('href')) {
      const href = node.getAttribute('href');
      return (
        <Link key={this.keySeq++} route={href}>
          <a>{this.handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('bible')) {
      const bibleId = node.getAttribute('bible');
      return (
        <Link key={this.keySeq++} route={Links.bibleURL(lang, bibleId)}>
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
        return <br key={this.keySeq++} />;
      case '#text':
        return replaceHyphens(node.textContent);
      case '#comment':
        return null;
      case 'i':
        return <i key={this.keySeq++}>{this.handle_nodes(node.childNodes)}</i>;
      case 'b':
        return <b key={this.keySeq++}>{this.handle_nodes(node.childNodes)}</b>;
      case 'u':
        return <u key={this.keySeq++}>{this.handle_nodes(node.childNodes)}</u>;
      case 'p':
        return <p>{this.handle_nodes(node.childNodes)}</p>;
      case 'blockquote':
        return <blockquote>{this.handle_nodes(node.childNodes)}</blockquote>;
      case 'sup':
        return (
          <sup key={this.keySeq++}>{this.handle_nodes(node.childNodes)}</sup>
        );
      case 'strike':
        return <strike>{this.handle_nodes(node.childNodes)}</strike>;
      case 'year':
      case 'wrap':
      case 'content':
      case 'nonum':
      case 'resetnum':
        return this.handle_nodes(node.childNodes);
      case 'block-center':
        return (
          <center
            key={this.keySeq++}
            style={{ display: 'block', width: '100%' }}>
            {this.handle_nodes(node.childNodes)}
          </center>
        );
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
            style={{
              display: 'inline',
              fontSize: '0.85em',
              lineHeight: '1.6em',
            }}>
            {this.handle_nodes(node.childNodes)}
          </small>
        );
      case 'biblio':
        return (
          <span key={this.keySeq++} style={{ color: '#888' }}>
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
              color: '#888',
              pageBreakAfter: 'avoid', // Not working.
            }}>
            {this.handle_nodes(node.childNodes)}
          </span>
        );
      case 'w':
        // Render spatieret tekst som kursiv.
        return <i key={this.keySeq++}>{this.handle_nodes(node.childNodes)}</i>;
      //        return (
      //          <span key={this.keySeq++} style={{ letterSpacing: '0.1em' }}>
      //            {this.handle_nodes(node.childNodes)}
      //          </span>
      //        );
      case 'metrik':
        return this.handle_metrik(node.textContent);
      case 'hr':
        const double = node.getAttribute('class') || 'solid';
        const width = Math.min(node.getAttribute('width') * 10, 100);
        const borderTop =
          double === 'double' ? '3px double black' : '1px solid black';
        return (
          <hr
            key={this.keySeq++}
            style={{
              border: 0,
              borderTop,
              color: 'black',
              width: `${width}%`,
            }}
          />
        );
      case 'column':
        return (
          <div style={{ textAlign: 'left' }} key={this.keySeq++}>
            {this.handle_nodes(node.childNodes)}
          </div>
        );
      case 'two-columns':
        const styles = {
          display: 'flex',
        };
        return (
          <div className="text-two-columns" style={styles} key={this.keySeq++}>
            {this.handle_nodes(node.childNodes)}
          </div>
        );
      case 'img': {
        const width = node.getAttribute('width');
        const src = node.getAttribute('src');
        const alt = node.getAttribute('alt');
        if (width == null || alt == null) {
          //console.log(`Der mangler alt-attribut på inline img.`);
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
        //console.log(`Mærkeligt tag fundet ${node.toString()}`);
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
    const {
      contentHtml,
      contentLang,
      lang,
      style,
      keyPrefix,
      className,
    } = this.props;
    const options = this.props.options || {};

    if (contentHtml == null) {
      return null;
    }
    if (!(contentHtml instanceof Array)) {
      return (
        <div>
          <pre>{JSON.stringify(contentHtml)}</pre>
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
        rendered = replaceHyphens(l[0]);
        if (rendered.trim().length === 0) {
          if (options == null || !options.isPoetry) {
            className += ' half-height-blank';
          }
          rendered = <br />;
        }
      }
      let lineInnerClass = 'inner-line';
      if (lineOptions.center) {
        lineInnerClass += ' centered-text';
      }
      if (lineOptions.right) {
        lineInnerClass += ' right-aligned-text';
      }

      if (options.isPoetry && !lineOptions.wrap && !lineOptions.hr) {
        className += ' poem-line';
        let displayedLineNum = null;
        if (lineOptions.folkevise && lineNum != null) {
          displayedLineNum = lineNum + '.';
        } else if (lineNum != null && lineNum % 5 === 0) {
          displayedLineNum = lineNum;
        }
        return (
          <div
            className={className}
            data-num={displayedLineNum}
            key={keyPrefix + i}>
            {anchor}
            <div className={lineInnerClass}>{rendered}</div>
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
      } else if (lineOptions.hr) {
        className += ' poem-line poem-hr';
        return (
          <div className={className} key={keyPrefix + i}>
            {rendered}
          </div>
        );
      } else {
        // Prose
        className += ' prose-paragraph';
        if (lineOptions.right) {
          className += ' right-aligned-prose-text';
        }
        if (lineOptions.center) {
          className += ' centered-prose-text';
        }
        return (
          <div className={className} key={i + keyPrefix}>
            {rendered}
          </div>
        );
      }
    });

    return (
      <div style={style} className={className} lang={contentLang}>
        {/*
        <pre>
          {contentLang || 'Mangler content_lang'}
        </pre>
        */}
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
            vertical-align: top;
            margin-top: 0.25em;
          }
          :global(.bible-line),
          :global(.poem-line) {
            margin-left: 1.5em;
          }
          :global(.prose-paragraph) {
            hyphens: auto;
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
          }
          :global(.poem-hr) {
            line-height: 4px !important;
            padding-bottom: 3px;
          }
          :global(.last-highlighted-line) {
            border-bottom: 1px solid rgb(238, 232, 213);
          }
          :global(.inner-line) {
            display: inline-block;
            width: calc(100%-7em);
            margin-left: 7em;
            text-indent: -7em;
          }
          :global(.right-aligned-text) {
            text-align: right;
            width: 100%;
            text-indent: 0;
            margin-left: 0;
          }
          :global(.centered-text) {
            text-align: center;
            width: 100%;
            text-indent: 0;
            margin-left: 0;
          }
          :global(.right-aligned-prose-text) {
            text-align: right;
          }
          :global(.centered-prose-text) {
            text-align: center;
          }
          :global(.half-height-blank) {
            line-height: 0.8;
          }
          :global(.text-two-columns) :global(div:first-child) {
            border-right: 1px solid black;
            padding-right: 10px;
          }
          :global(.text-two-columns) :global(div:last-child) {
            padding-left: 10px;
          }
        `}</style>
      </div>
    );
  }
}
