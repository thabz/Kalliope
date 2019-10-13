// @flow

import React from 'react';

const WrapNonEmpty = props => {
  const { children, ...rest } = props;
  if (children.length > 0) {
    return <div {...rest}>{children}</div>;
  } else {
    return null;
  }
};

export default WrapNonEmpty;
