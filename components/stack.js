// @flow

import React from 'react';

type StackProps = {
  spacing: string,
  children: Array<Node>,
};
const Stack = (props: StackProps) => {
  let { children, spacing } = { spacing: '15px', ...props };
  const padded = children.map((c, i) => {
    const style = i < children.length - 1 ? { marginBottom: spacing } : {};
    return <div style={style}>{c}</div>;
  });
  return <div>{padded}</div>;
};

export default Stack;
