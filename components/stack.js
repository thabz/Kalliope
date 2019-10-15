// @flow

import React from 'react';

const Stack = props => {
  let { children, spacing } = { spacing: '15px', ...props };
  const padded = children.map((c, i) => {
    const style = i < children.length - 1 ? { marginBottom: spacing } : {};
    return <div style={style}>{c}</div>;
  });
  return <div>{padded}</div>;
};

export default Stack;
