import React from 'react';
import type { NoteItem, Lang } from '../pages/helpers/types.js';
import TextContent from './textcontent.js';

export default class extends React.Component {
  props: {
    note: NoteItem,
    lang: Lang,
  };
  render() {
    const { note, lang } = this.props;
    return (
      <p className="sidebar-note">
        <TextContent contentHtml={note.content_html} lang={lang} />
      </p>
    );
  }
}
