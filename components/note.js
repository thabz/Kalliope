// @flow

import React from 'react';
import type { NoteItem, Lang } from '../pages/helpers/types.js';
import TextContent from './textcontent.js';

type NoteProps = {
  note: NoteItem,
  lang: Lang,
  className?: string,
};
export default class Note extends React.Component<NoteProps> {
  render() {
    const { note, lang, className } = this.props;
    const { type } = note;
    let finalClassName = (className || '') + ' sidebar-note';
    if (type === 'credits') {
      finalClassName += ' sidebar-note-credits';
    }

    return (
      <div className={finalClassName}>
        <TextContent
          contentHtml={note.content_html}
          contentLang={note.content_lang}
          lang={lang}
        />
        <style jsx>{`
          div.sidebar-note {
            margin-bottom: 10px;
          }
          div.sidebar-note.print-only {
            display: none;
          }
          @media print {
            div.sidebar-note.print-only {
              display: block;
            }
            div.sidebar-note {
              margin-bottom: 10px;
            }
            div.sidebar-note.sidebar-note-credits {
              display: none;
            }
          }
        `}</style>
      </div>
    );
  }
}
