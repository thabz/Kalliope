// @flow

import React from 'react';
import type { Node } from 'react';

const WrapNonEmpty = (props: { children: Node }) => {
  const { children, ...rest } = props;
  if (React.Children.toArray(children).length > 0) {
    return <div {...rest}>{children}</div>;
  } else {
    return null;
  }
};

export default WrapNonEmpty;
