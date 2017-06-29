// @flow
import React from 'react';

export default class SubHeading extends React.Component {
  props: {
    children: any,
  };
  render() {
    const { children } = this.props;
    return (
      <div className="subheading">
        <h2>{children}</h2>
        <style jsx>{`
          h2 {
            margin: 0;
            width: 100%;
            margin: 10px 0 30px 0;
            line-height: 1.15;
            font-size: 28px;
            font-weight: lighter;
          }
        `}</style>
      </div>
    );
  }
}
