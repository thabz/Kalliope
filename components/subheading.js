// @flow
import * as React from 'react';
import type { Node } from 'react';

type Props = { children?: React.Node };
const SubHeading = ({ children }: Props) => {
  return (
    <div className="subheading">
      <h2>{children}</h2>
      <style jsx>{`
        h2 {
          width: 100%;
          margin: 0 0 50px 0;
          line-height: 1.5;
          font-size: 28px;
          font-weight: 100;
        }
      `}</style>
    </div>
  );
};

export default SubHeading;
