// @flow

import React from 'react';
import type { Node } from 'react';
import type { NoteType, Lang } from '../common/types.js';
import TextContent from './textcontent.js';

type NoteProps = {
  type?: NoteType,
  className?: string,
  children?: Node,
};

const Note = (props: NoteProps) => {
  const { className, type, children } = props;
  let finalClassName = (className || '') + ' sidebar-note';
  if (type === 'credits') {
    finalClassName += ' sidebar-note-credits';
  }

  return (
    <div className={finalClassName}>
      {children}
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
};

export default Note;
