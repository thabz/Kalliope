// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';

export class Footnote extends Component {
  props: {
    text: any,
  };
  context: {
    footnoteContainer: FootnoteContainer,
  };
  componentWillMount() {
    this.context.footnoteContainer.registrer(this);
  }
  componentWillUnmount() {
    this.context.footnoteContainer.unregister(this);
  }
  text() {
    return this.props.text;
  }
  render() {
    const nummer = this.context.footnoteContainer.nummer(this);
    return (
      <sup style={{ marginLeft: '0.3em' }} className="footnotes-print-only">
        {nummer}
      </sup>
    );
  }
}

Footnote.contextTypes = {
  footnoteContainer: PropTypes.object,
};

export class FootnoteList extends Component {
  context: {
    footnoteContainer: FootnoteContainer,
  };
  render() {
    const container = this.context.footnoteContainer;
    const notes = container.footnotes().map((footnote, i) => {
      const text = footnote.text();
      return <li value={i + 1} key={i + text}>{text}</li>;
    });
    return (
      <ol className="footnotes footnotes-print-only">
        {notes}
        <style jsx>{`
          ol.footnotes {
            padding-left: 1.2em;
          }
        `}</style>
      </ol>
    );
  }
}

FootnoteList.contextTypes = {
  footnoteContainer: PropTypes.object,
};

export class FootnoteContainer extends Component {
  _footnotes: Array<Footnote>;
  props: {
    children: Array<Component<*, *, *>>,
  };
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
