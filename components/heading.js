// @flow
import React from 'react';

export default class extends React.Component {
  props: {
    title: any,
  };
  render() {
    const { title } = this.props;
    return (
      <div className="heading">
        <h1>{title}</h1>
        <style jsx>{`
          .heading {
            margin-bottom: 20px;
          }

          .heading :global(h1) {
            margin: 0;
            width: 100%;
            padding-top: 20px;
            line-height: 48px;
            font-size: 48px;
            font-weight: lighter;
          }

          @media (max-width: 480px) {
            .heading :global(h1) {
              margin: 0;
              width: 100%;
              padding-top: 10px;
              line-height: 24px;
              font-size: 24px;
              font-weight: lighter;
            }
          }
        `}</style>
      </div>
    );
  }
}
