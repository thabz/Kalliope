// @flow
import React from 'react';

export default class SubHeading extends React.Component {
  props: {
    children?: *,
  };
  render() {
    const { children } = this.props;
    return (
      <div className="subheading">
        <h2>
          {children}
        </h2>
        <style jsx>{`
          h2 {
            width: 100%;
            margin: 0 0 50px 0;
            line-height: 28px;
            font-size: 28px;
            font-weight: lighter;
          }
        `}</style>
      </div>
    );
  }
}
