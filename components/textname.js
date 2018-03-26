// @flow
import React from 'react';
import type { Text } from '../pages/helpers/types.js';

export default class TextName extends React.Component {
  props: {
    text: Text,
  };
  render() {
    const { text } = this.props;
    const { title } = text;
    return (
      <span className="textname">
        {title}
      </span>
    );
  }
}

export function textTitleString(text: Text): string {
  return text.title;
}

export function textLinkTitleString(text: Text): string {
  return text.linktitle;
}
