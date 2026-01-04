import React from 'react';

const Note = (props) => {
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
          hyphens: auto;
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
