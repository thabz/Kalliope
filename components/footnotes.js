import React, { Component, PropTypes } from 'react';

export class Footnote extends Component {
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
  footnoteContainer: React.PropTypes.object,
};

Footnote.propTypes = {
  text: PropTypes.string.isRequired,
};

export class FootnoteList extends Component {
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
  footnoteContainer: React.PropTypes.object,
};

export class FootnoteContainer extends Component {
  constructor() {
    super();
    this._footnotes = [];
  }
  getChildContext() {
    return { footnoteContainer: this };
  }
  footnotes() {
    return this._footnotes;
  }
  registrer(footnote) {
    const findes = this.nummer(footnote) !== 0;
    if (!findes) {
      this._footnotes.push(footnote);
    }
  }
  unregister(footnote) {
    this._footnotes = this._footnotes.filter(x => x !== footnote);
  }
  nummer(footnote) {
    return this._footnotes.indexOf(footnote) + 1;
  }
  render() {
    return <div>{this.props.children}</div>;
    return React.Children.only(this.props.children);
  }
}

FootnoteContainer.childContextTypes = {
  footnoteContainer: React.PropTypes.object,
};

FootnoteContainer.propTypes = {
  children: PropTypes.node,
};
