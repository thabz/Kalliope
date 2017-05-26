import React from 'react';
import type { NoteItem } from '../pages/helpers/types.js';

export default class extends React.Component {
  props: {
    note: NoteItem,
  };
  render() {
    const { note } = this.props;
    return <p className="sidebar-note">{note.content_html}</p>;
  }
}
