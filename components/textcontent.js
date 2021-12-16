// @flow
import React, { useContext } from 'react';
import { Link } from '../routes';
var DOMParser = require('xmldom').DOMParser;
import LangContext from '../common/LangContext.js';
import { Footnote } from './footnotes.js';
import * as Links from './links';
import CommonData from '../common/commondata.js';

// Render xml
const renderXmlString = (inputString) => {
  const lang = useContext(LangContext);

  const handle_metrik = (s) => {
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
        }}
      >
        {x}
      </span>
    ));
    return (
      <span key={keySeq++} style={{ fontSize: '1.1em' }}>
        {parts}
      </span>
    );
  };

  const handle_a = (node) => {
    if (node.hasAttribute('person')) {
      const poetId = node.getAttribute('person');
      return (
        <Link key={keySeq++} route={Links.poetURL(lang, poetId)}>
          <a>{handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('poet')) {
      const poetId = node.getAttribute('poet');
      return (
        <Link key={keySeq++} route={Links.poetURL(lang, poetId)}>
          <a>{handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('poem')) {
      const textId = node.getAttribute('poem');
      return (
        <Link key={keySeq++} route={Links.textURL(lang, textId)}>
          <a>{handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('text')) {
      const textId = node.getAttribute('text');
      return (
        <Link key={keySeq++} route={Links.textURL(lang, textId)}>
          <a>{handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('keyword')) {
      const keywordId = node.getAttribute('keyword');
      return (
        <Link key={keySeq++} route={Links.keywordURL(lang, keywordId)}>
          <a>{handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('dict')) {
      const keywordId = node.getAttribute('dict');
      return (
        <Link key={keySeq++} route={Links.dictionaryURL(lang, keywordId)}>
          <a>{handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('work')) {
      const parts = node.getAttribute('work').split('/');
      const poetId = parts[0];
      const workId = parts[1];
      return (
        <Link key={keySeq++} route={Links.workURL(lang, poetId, workId)}>
          <a>{handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('href')) {
      const href = node.getAttribute('href');
      return (
        <Link key={keySeq++} route={href}>
          <a>{handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else if (node.hasAttribute('bible')) {
      const bibleId = node.getAttribute('bible');
      return (
        <Link key={keySeq++} route={Links.bibleURL(lang, bibleId)}>
          <a>{handle_nodes(node.childNodes)}</a>
        </Link>
      );
    } else {
      return <code key={keySeq++}>{node.toString()}</code>;
    }
  };

  const handle_node = (node) => {
    switch (node.nodeName) {
      case 'br':
        return <br key={keySeq++} />;
      case '#text':
        return replaceHyphens(node.textContent);
      case '#comment':
        return null;
      case 'pb':
        return null;
      case 'i':
        return <i key={keySeq++}>{handle_nodes(node.childNodes)}</i>;
      case 'b':
        return <b key={keySeq++}>{handle_nodes(node.childNodes)}</b>;
      case 'u':
        return <u key={keySeq++}>{handle_nodes(node.childNodes)}</u>;
      case 'p':
        return <p>{handle_nodes(node.childNodes)}</p>;
      case 'sup':
        return <sup key={keySeq++}>{handle_nodes(node.childNodes)}</sup>;
      case 'sub':
        return <sub key={keySeq++}>{handle_nodes(node.childNodes)}</sub>;
      case 'strike':
        return <strike key={keySeq++}>{handle_nodes(node.childNodes)}</strike>;
      case 'year':
      case 'wrap':
      case 'content':
      case 'nonum':
      case 'resetnum':
        return handle_nodes(node.childNodes);
      case 'asterism': {
        const glyph = '\u2042';
        return (
          <center key={keySeq++} style={{ display: 'block', width: '100%' }}>
            {glyph}
          </center>
        );
      }
      case 'block-center':
        return (
          <center key={keySeq++} style={{ display: 'block', width: '100%' }}>
            {handle_nodes(node.childNodes)}
          </center>
        );
      case 'center':
        // <center> er et block element og for at undgå dobbelt
        // linjeskift efter (vi laver jo \n til <br/>) renderer
        // vi som inline-block.
        return (
          <center
            key={keySeq++}
            style={{ display: 'inline-block', width: '100%' }}
          >
            {handle_nodes(node.childNodes)}
          </center>
        );
      case 'blockquote':
        const left = node.hasAttribute('left')
          ? node.getAttribute('left')
          : '50%';
        const right = node.hasAttribute('right')
          ? node.getAttribute('right')
          : '0';
        return (
          <blockquote
            key={keySeq++}
            style={{
              display: 'block',
              position: 'absolute',
              margin: `0 ${right} 0 ${left}`,
            }}
          >
            {handle_nodes(node.childNodes)}
          </blockquote>
        );
      case 'colored':
        const color = node.getAttribute('color') || 'solid';
        return (
          <span key={keySeq++} style={{ color: color }}>
            {handle_nodes(node.childNodes)}
          </span>
        );
      case 's':
      case 'small':
        return (
          <small
            key={keySeq++}
            style={{
              display: 'inline',
              fontSize: '1.0rem',
              lineHeight: '1.1rem', // Virker ikke i en inline block
            }}
          >
            {handle_nodes(node.childNodes)}
          </small>
        );
      case 'biblio':
        return (
          <span key={keySeq++} style={{ color: CommonData.lightTextColor }}>
            [{handle_nodes(node.childNodes)}]
          </span>
        );
      case 'right':
        return (
          <span
            key={keySeq++}
            style={{
              display: 'inline-block',
              width: '100%',
              textAlign: 'right',
            }}
          >
            {handle_nodes(node.childNodes)}
          </span>
        );
      case 'versenum': // Linjer med kun tal eller romertal.
        return (
          <span
            key={keySeq++}
            style={{
              display: 'inline',
              color: CommonData.lightTextColor,
              pageBreakAfter: 'avoid', // Not working.
            }}
          >
            {handle_nodes(node.childNodes)}
          </span>
        );
      case 'w':
        // Render spatieret tekst som kursiv.
        return <i key={keySeq++}>{handle_nodes(node.childNodes)}</i>;
      //        return (
      //          <span key={keySeq++} style={{ letterSpacing: '0.1em' }}>
      //            {handle_nodes(node.childNodes)}
      //          </span>
      //        );
      case 'metrik':
        return handle_metrik(node.textContent);
      case 'hr':
        const double = node.getAttribute('class') || 'solid';
        const width = Math.min(node.getAttribute('width') * 10, 100);
        const borderTop =
          double === 'double' ? '3px double black' : '1px solid black';
        return (
          <hr
            key={keySeq++}
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
          <div style={{ textAlign: 'left' }} key={keySeq++}>
            {handle_nodes(node.childNodes)}
          </div>
        );
      case 'two-columns':
        const styles = {
          display: 'flex',
        };
        return (
          <div className="text-two-columns" style={styles} key={keySeq++}>
            {handle_nodes(node.childNodes)}
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
          pageBreakInside: 'avoid',
          maxWidth: '100%',
        };
        return <img key={keySeq++} src={src} style={style} alt={alt} />;
      }
      case 'footnote':
      case 'note':
        const noteContent = handle_nodes(node.childNodes);
        return <Footnote key={keySeq++} text={noteContent} />;
      case 'sc':
        return (
          <span key={keySeq++} className="small-caps">
            {handle_nodes(node.childNodes)}
          </span>
        );
      case 'a':
        return handle_a(node);
      default:
        //console.log(`Mærkeligt tag fundet ${node.toString()}`);
        return <code key={keySeq++}>{node.toString()}</code>;
    }
  };

  const handle_nodes = (nodes) => {
    let collected = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes.item(i);
      let renderedNode = handle_node(node);
      collected.push(renderedNode);
    }
    return collected;
  };

  const frag = new DOMParser().parseFromString(
    '<content>' + inputString + '</content>'
  );
  return handle_nodes(frag.childNodes);
};
export { renderXmlString };

// Fiks bindestreger mellem årstal, sidetal osv.
const replaceHyphens = (s) => {
  return s.replace(/(\d)-(\d)/g, '$1–$2'); // Hyphen/minus (U+002D) to en-dash (U+2013)
};

const TextInline = (propsContentPropsType) => {
  const { contentHtml } = props;
  if (contentHtml == null) {
    return null;
  }
  const rendered = contentHtml.map((l, i) => renderXmlString(l[0]));

  return <div style={{ display: 'inline' }}>{rendered}</div>;
};
export { TextInline };

let keySeq = 1;
const TextContent = (props) => {
  const lang = useContext(LangContext);

  const {
    contentHtml,
    contentLang,
    style,
    keyPrefix = 'linje-',
    className = 'block',
    options = {},
    type = 'prose',
  } = props;

  if (contentHtml == null) {
    return null;
  }
  if (!(contentHtml instanceof Array)) {
    return (
      <div key={keyPrefix + 'failed'}>
        <pre>{JSON.stringify(contentHtml)}</pre>
      </div>
    );
  }

  const showNums =
    contentHtml.find((l) => {
      const lineOptions = l.length > 1 ? l[1] : {};
      return lineOptions.displayNum != null || lineOptions.margin != null;
    }) != null;

  if (options.highlight != null) {
    const highlight = options.highlight;
    const lastLineNum = contentHtml
      .map((l) => {
        const lineOptions = l.length > 1 ? l[1] : {};
        const lineNum =
          lineOptions.num != null ? parseInt(lineOptions.num) : null;
        return lineNum != null ? lineNum : -1;
      })
      .reduce((maxLineNum, lineNum) => {
        return Math.max(lineNum, maxLineNum);
      }, -1);
    // Bound the values
    highlight.from = Math.max(1, highlight.from);
    highlight.to = Math.min(lastLineNum, highlight.to);
  }

  let isHighlighting = false;
  const lines = contentHtml.map((l, i) => {
    const lineOptions = l.length > 1 ? l[1] : {};
    const lineNum = lineOptions.num != null ? parseInt(lineOptions.num) : null;
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
      rendered = renderXmlString(l[0], lang);
    } else {
      rendered = replaceHyphens(l[0]);
      if (rendered.trim().length === 0) {
        if (type === 'prose') {
          className += ' half-height-blank';
        }
        rendered = <br />;
      }
    }
    let lineInnerClass = '';
    if (lineOptions.center) {
      lineInnerClass += ' centered-text';
    }
    if (lineOptions.right) {
      lineInnerClass += ' right-aligned-text';
    }

    if (lineOptions.margin) {
      className += ' with-margin-text';
    }
    if (showNums) {
      className += ' line-with-num';
    }

    if (type !== 'prose' && !lineOptions.wrap && !lineOptions.hr) {
      lineInnerClass += ' inner-poem-line';
      className += ' poem-line';
      return (
        <div
          className={className}
          data-num={lineOptions.displayNum || lineOptions.margin}
          key={keyPrefix + i}
        >
          {anchor}
          <div className={lineInnerClass}>{rendered}</div>
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
      lineInnerClass += ' inner-prose-line';
      if (lineOptions.right) {
        className += ' right-aligned-prose-text';
      }
      if (lineOptions.center) {
        className += ' centered-prose-text';
      }
      return (
        <div
          className={className}
          key={i + keyPrefix}
          data-num={lineOptions.displayNum}
        >
          {anchor}
          <div className={lineInnerClass}>{rendered}</div>
        </div>
      );
    }
  });

  let quoteClassName = '';
  if (type === 'quote') {
    quoteClassName = 'blockquote';
  }

  let smallClassName = '';
  if (options.fontSize === 'small') {
    smallClassName = ' small';
  }

  return (
    <div
      style={style}
      className={[className, smallClassName, quoteClassName]
        .filter((a) => a != null)
        .join(' ')}
      lang={contentLang}
      key={keyPrefix + 'outer'}
    >
      {/*
        <pre>
          {contentLang || 'Mangler content_lang'}
        </pre>
        */}
      {lines}
      <style jsx>{`
        :global(.line-with-num::before) {
          content: attr(data-num);
          color: ${CommonData.lightTextColor};
          margin-right: 1em;
          width: 1.5em;
          font-size: 0.8em;
          text-align: right;
          display: inline-block;
          margin-left: -2.5em;
          vertical-align: top;
          margin-top: 0.25em;
        }
        :global(.poem-line.with-margin-text::before) {
          content: attr(data-num);
          color: black;
          margin-right: 1em;
          width: 1.5em;
          font-size: 1em;
          text-align: right;
          display: inline-block;
          margin-left: -2.5em;
          vertical-align: top;
          margin-top: 0;
        }
        :global(.line-with-num) {
          margin-left: 1.5em;
        }
        :global(.prose-paragraph) {
          hyphens: auto;
        }
        :global(.block.small) {
          font-size: 1rem;
          line-height: 1.45rem;
        }
        :global(.block.small .line-with-num::before) {
          margin-top: 0;
          font-size: 0.8rem;
        }
        :global(.block) {
          display: inline-block;
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
          margin-left: 0 !important;
        }
        :global(.last-highlighted-line) {
          border-bottom: 1px solid rgb(238, 232, 213);
        }
        :global(.inner-poem-line) {
          display: inline-block;
          width: calc(100%-7em);
          margin-left: 7em;
          text-indent: -7em;
        }
        :global(.inner-prose-line) {
          display: inline-block;
          width: calc(100%);
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
        :global(.blockquote) {
          /*width: calc(100% - ${options.marginLeft} - ${options.marginRight});*/
          margin-left: ${options.marginLeft};
          margin-right: ${options.marginRight};
          font-size: ${options.fontSize};
        }
      `}</style>
    </div>
  );
};

export default TextContent;
