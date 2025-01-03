import * as React from 'react';

const SubHeading = ({ children }) => {
  return (
    <div className="subheading">
      <h2>{children}</h2>
      <style jsx>{`
        h2 {
          width: 100%;
          margin: -4px 0 40px 0;
          line-height: 1.5;
          font-size: 26px;
          font-weight: 100;
        }
      `}</style>
    </div>
  );
};

export default SubHeading;
