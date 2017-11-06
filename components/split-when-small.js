// @flow

import React from 'react';

export default class SplitWhenSmall extends React.Component {
  props: {
    children?: *,
  };
  render() {
    return (
      <div className="horizontal-on-small">
        {this.props.children}
        <style jsx>{`
          .horizontal-on-small {
            display: flex;
            flex-direction: column;
          }
          @media (max-width: 760px) {
            .horizontal-on-small {
              flex-direction: row;
              justify-content: space-between;
              width: 100%;
            }
            .horizontal-on-small > :global(*) {
              flex-basis: 47%; /* Add 6% spacing between */
              margin: 0 !important;
            }
          }
        `}</style>
      </div>
    );
  }
}
