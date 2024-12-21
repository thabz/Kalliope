import React from 'react';

const WrapNonEmpty = (props) => {
  const { children, ...rest } = props;
  if (React.Children.toArray(children).length > 0) {
    return <div {...rest}>{children}</div>;
  } else {
    return null;
  }
};

export default WrapNonEmpty;
