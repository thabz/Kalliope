// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';

type FootnoteProps = {
  text: *,
};
export class Footnote extends Component<FootnoteProps> {
  context: {
    footnoteContainer: FootnoteContainer,
  };
  componentWillMount() {
    this.context.footnoteContainer.registrer(this);
  }
  componentWillUnmount() {
    this.context.footnoteContainer.unregister(this);
  }
  text(): * {
    return this.props.text;
  }
  render() {
    const nummer = this.context.footnoteContainer.nummer(this);
    const anchor = `note-${nummer}`;
    return (
      <sup style={{ marginLeft: '0.3em' }} className="footnotes-print-only">
        <a name={anchor} />
        {nummer}
      </sup>
    );
  }
}

Footnote.contextTypes = {
  footnoteContainer: PropTypes.object,
};

export class FootnoteList extends Component<*> {
  context: {
    footnoteContainer: FootnoteContainer,
  };
  render() {
    const container = this.context.footnoteContainer;
    const notes = container.footnotes().map((footnote, i) => {
      const text = footnote.text();
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
  }
}

FootnoteList.contextTypes = {
  footnoteContainer: PropTypes.object,
};

type FootnoteContainerProps = {
  children?: *,
};
export class FootnoteContainer extends Component<FootnoteContainerProps> {
  _footnotes: Array<Footnote>;
  constructor() {
    super();
    this._footnotes = [];
  }
  componentDidMount() {
    // Reset when mounting. See issue #76.
    this._footnotes = [];
  }
  getChildContext() {
    return { footnoteContainer: this };
  }
  footnotes(): Array<Footnote> {
    return this._footnotes;
  }
  registrer(footnote: Footnote) {
    const findes = this.nummer(footnote) !== 0;
    if (!findes) {
      this._footnotes.push(footnote);
    }
  }
  unregister(footnote: Footnote) {
    this._footnotes = this._footnotes.filter(x => x !== footnote);
  }
  nummer(footnote: Footnote) {
    return this._footnotes.indexOf(footnote) + 1;
  }
  render() {
    return <div>{this.props.children}</div>;
  }
}

FootnoteContainer.childContextTypes = {
  footnoteContainer: PropTypes.object,
};
