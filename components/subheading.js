// @flow
import React from 'react';

export default class extends React.Component {
  props: {
    children: any,
  };
  render() {
    const { children } = this.props;
    return (
      <div className="subheading">
        <h2>{children}</h2>
      </div>
    );
  }
}
