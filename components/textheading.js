// @flow

import React, { Fragment } from 'react';
import TextName from './textname.js';
import TextContent from './textcontent.js';

import type {
  Lang,
  Poet,
  Work,
  Text,
  TextSource,
  PictureItem,
  KeywordRef,
  PrevNextText,
  Error,
} from '../pages/helpers/types.js';

type TextHeadingProps = { text: Text, lang: Lang, isProse: boolean };
export default class TextHeading extends React.Component<TextHeadingProps> {
  render() {
    const { text, lang, isProse } = this.props;

    let className = 'text-heading';
    if (isProse) {
      className += ' prose';
    } else {
      className += ' poem';
    }

    let subtitles = null;
    if (text.subtitles != null) {
      subtitles = text.subtitles.map((t, i) => {
        return (
          <h4 key={i} style={{ lineHeight: '1.6' }}>
            <TextContent contentHtml={t} lang={lang} />
          </h4>
        );
      });
    }
    return (
      <div className={className}>
        <h2>
          <TextName text={text} />
        </h2>
        {subtitles}
        <style jsx>{`
          .text-heading :global(h2) {
            font-family: 'Palatino', 'Georgia', serif;
            line-height: 1.4em;
            font-size: 1.61rem;
            font-weight: normal;
            margin: 0 0 15px 0;
            font-style: italic;
            padding: 0;
          }
          .text-heading :global(h4) {
            font-family: 'Palatino', 'Georgia', serif;
            font-size: 1.1rem;
            line-height: 1.05em;
            font-weight: normal;
            margin: 0 0 0px 0;
            padding: 0;
          }
          .text-heading {
            margin-bottom: 60px;
          }
          .text-heading.poem {
            margin-left: 1.5em;
          }
        `}</style>
      </div>
    );
  }
}
