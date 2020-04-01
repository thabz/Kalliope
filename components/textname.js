// @flow
import React from 'react';
import type { Text } from '../common/types.js';
import CommonData from '../common/commondata.js';

const TextName = ({ text }: { text: Text }) => {
  const { title, title_prefix } = text;
  let renderedPrefix = null;
  if (title_prefix != null) {
    renderedPrefix = (
      <span style={{ color: CommonData.lightTextColor }}>{title_prefix} </span>
    );
  }
  return (
    <span className="textname">
      {renderedPrefix}
      {title}
    </span>
  );
};
export default TextName;

export function textTitleString(text: Text): string {
  return text.title;
}

export function textLinkTitleString(text: Text): string {
  return text.linktitle;
}
