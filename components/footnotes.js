// @flow
import React, { useContext, useEffect, useState } from 'react';

class Footnotes {
  constructor() {
    this._footnotes = [];
  }
  number(footnote) {
    return this._footnotes.length;
  }
  registrer(footnote, text) {
    this._footnotes.push({ footnote, text });
    return this._footnotes.length;
  }
  unregister(footnote) {
    this._footnotes = this._footnotes.filter((x) => x.footnote !== footnote);
  }
  footnotes() {
    return this._footnotes;
  }
}

const FootnoteContext = React.createContext();

const Footnote = ({ text }) => {
  const footnotes = useContext(FootnoteContext);

  useEffect(() => {
    return () => {
      footnotes.unregister(this, text);
    };
  });

  const number = footnotes.registrer(this, text);
  const anchor = `note-${number}`;
  return (
    <sup style={{ marginLeft: '0.3em' }} className="footnotes-print-only">
      <a name={anchor} />
      {number}
    </sup>
  );
};

const FootnoteList = () => {
  const footnotes = useContext(FootnoteContext);
  const notes = footnotes.footnotes().map((footnote, i) => {
    const text = footnote.text;
    const anchor = `#note-${i + 1}`;
    return (
      <div className="footnote" key={i + text}>
        <div className="footnote-num">
          <a href={anchor}>{i + 1}.</a>
        </div>
        <div className="footnote-text">{text}</div>
      </div>
    );
  });
  return (
    <div className="footnotes footnotes-print-only">
      {notes}
      <style jsx>{`
        div.footnotes {
          margin-top: 0;
          hyphens: auto;
        }
        :global(.footnote) {
          display: flex;
          align-items: flex-start;
          width: 100%;
          margin-left: -5px;
        }
        :global(.footnote .footnote-num) {
          flex-basis: 20px;
          flex-grow: 0;
          flex-shrink: 0;
          text-align: right;
          padding-right: 7px;
        }
        :global(.footnote .footnote-num a) {
          color: #666;
        }
        :global(.footnote .footnote-text) {
          flex-grow: 1;
        }
      `}</style>
    </div>
  );
};

const FootnoteContainer = (props) => {
  const [footnotes] = useState(new Footnotes());
  return (
    <FootnoteContext.Provider value={footnotes}>
      {props.children}
    </FootnoteContext.Provider>
  );
};

export { Footnote, FootnoteContainer, FootnoteList };
