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
    return (
      <div className="sidebar-note">
        <TextContent contentHtml={note.content_html} lang={lang} />
        <style jsx>{`
              div.sidebar-note {
                margin-bottom: 30px;
              }
              @media print {
                div.sidebar-note {
                  margin-bottom: 10px;
                }
              }
          `}</style>
      </div>
    );
  }
}
