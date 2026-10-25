import EditorialNoteLabel from './editorial-note-label.js';

const Note = (props) => {
  const { className, type, editorial, children } = props;
  let finalClassName = (className || '') + ' sidebar-note';
  if (editorial === true) {
    finalClassName += ' sidebar-note-editorial';
  }
  if (type === 'credits') {
    finalClassName += ' sidebar-note-credits';
  }

  return (
    <div className={finalClassName}>
      {editorial === true ? <EditorialNoteLabel /> : null}
      {children}
      <style jsx>{`
        div.sidebar-note {
          margin-bottom: 10px;
          hyphens: auto;
        }
        .sidebar-note-editorial > :global(.block),
        .sidebar-note-editorial > :global(.block > .prose-paragraph:first-child),
        .sidebar-note-editorial > :global(.block > .prose-paragraph:first-child > .inner-prose-line) {
          display: inline;
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
