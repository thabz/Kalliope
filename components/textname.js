// @flow
import React from 'react';
import type { Text } from '../pages/helpers/types.js';

export default class extends React.Component {
  props: {
    text: Text,
  };
  render() {
    const { text } = this.props;
    const { title } = text;
    return <span className="textname">{title}</span>;
  }
}
