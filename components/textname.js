// @flow
import React from 'react';
import type { Text } from '../pages/helpers/types.js';

type TextNameProps = {
  text: Text,
};
export default class TextName extends React.Component<TextNameProps> {
  render() {
    const { text } = this.props;
    const { title, title_prefix } = text;
    let renderedPrefix = null;
    if (title_prefix != null) {
      renderedPrefix = <span style={{ color: '#767676' }}>{title_prefix} </span>;
    }
    return (
      <span className="textname">
        {renderedPrefix}
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
