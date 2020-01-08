// @flow
import * as React from 'react';

const Main = ({ children }: { children: React.Node }) => {
  return (
    <div>
      {children}
      <style jsx>{`
        div {
          max-width: 880px;
          margin: 0px auto;
          padding: 0 20px;
        }
      `}</style>
    </div>
  );
};

export default Main;
