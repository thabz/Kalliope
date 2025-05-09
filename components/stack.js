import * as React from 'react';

const Stack = (props) => {
  let { children, spacing } = { spacing: '15px', ...props };

  const childrenArray = React.Children.toArray(children);
  const padded = childrenArray.map((c, i) => {
    const style = i < childrenArray.length - 1 ? { marginBottom: spacing } : {};
    return (
      <div style={style} key={i}>
        {c}
      </div>
    );
  });
  return <div>{padded}</div>;
};

export default Stack;
