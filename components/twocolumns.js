import React from 'react';

export default class extends React.Component {
  render() {
    return (
      <div className="two-columns">
        {this.props.children}
        <style jsx>{`
          div.two-columns {
            width: 100%;
            columns: 2;
            column-gap: 20px;
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
