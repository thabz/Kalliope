// @flow
import React from 'react';
import type { Text } from '../pages/helpers/types.js';

export default class extends React.Component {
  render() {
    // TODO: We need lang too, and some context.
    const { contentHtml } = this.props;
    return <div>{contentHtml}</div>;
  }
}
