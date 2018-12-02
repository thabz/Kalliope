// @flow

import React from 'react';
import type { Node } from 'react';

type TwoColumnsProps = {
  children: Node,
};
export default class TwoColumns extends React.Component<TwoColumnsProps> {
  render() {
    return (
      <div className="two-columns">
        {this.props.children}
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
  }
}
