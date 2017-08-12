// @flow

import React from 'react';
import type { NoteItem, Lang } from '../pages/helpers/types.js';
import TextContent from './textcontent.js';

export default class Note extends React.Component {
  props: {
    note: NoteItem,
    lang: Lang,
  };
  render() {
    const { note, lang } = this.props;
    const { type } = note;
    let className = 'sidebar-note';
    if (type === 'credits') {
      className += ' sidebar-note-credits';
    }

    return (
      <div className={className}>
        <TextContent contentHtml={note.content_html} lang={lang} />
        <style jsx>{`
          div.sidebar-note {
            margin-bottom: 10px;
          }
          @media print {
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
