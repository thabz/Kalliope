// @flow

import React from 'react';

const TwoColumns = (props) => {
  return (
    <div className="two-columns">
      {props.children}
      <style jsx>{`
        div.two-columns {
          width: 100%;
          columns: 2;
          column-gap: 30px;
        }

        @media (max-width: 480px) {
          div.two-columns {
            columns: 1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TwoColumns;
