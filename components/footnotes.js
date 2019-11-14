// @flow
import React, { useContext, useEffect } from 'react';
import type { Node } from 'react';

class Footnotes {
  _footnotes = [];

  number = (footnote: Footnote) => {
    return this._footnotes.length;
  };
  registrer = (footnote: Footnote, text: Node) => {
    console.log('Registering');
    this._footnotes.push({ footnote, text });
    /*
    const findes = this.number(footnote) >= 0;
    if (!findes) {
      this._footnotes.push({ footnote, text });
    }
    */
  };
  unregister = (footnote: Footnote) => {
    console.log('Unregistering');
    this._footnotes = this._footnotes.filter(x => x.footnote !== footnote);
  };
  footnotes = () => {
    return this._footnotes;
  };
}

const FootnoteContext = React.createContext();

type FootnoteProps = {
  text: Node,
};
const Footnote = ({ text }: FootnoteProps) => {
  const footnotes = useContext(FootnoteContext);

  useEffect(() => {
    footnotes.registrer(this, text);
    console.log('Registered');
    return () => {
      footnotes.unregister(this, text);
    };
  });

  const number = footnotes.number(this);
  console.log('Number', number);
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
      Antal noter:
      {notes.length}
      {notes}
      <style jsx>{`
        div.footnotes {
          margin-top: 0;
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

const __globalFootnotes = new Footnotes();

type FootnoteContainerProps = {
  children: Node,
};
const FootnoteContainer = (props: FootnoteContainerProps) => {
  return (
    <FootnoteContext.Provider value={__globalFootnotes}>
      {props.children}
    </FootnoteContext.Provider>
  );
};

export { Footnote, FootnoteContainer, FootnoteList };
