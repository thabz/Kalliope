import React from 'react';

export default class extends React.Component {
  render() {
    return (
      <div className="sidebar-spl">
        {this.props.children}
        <style jsx>{`
          div.sidebar-spl {
            width: 100%;
            display: flex;
          }
          div.sidebar-spl > :global(div:first-child) {
            flex-grow: 1;
          }
          div.sidebar-spl > :global(div:last-child) {
            flex-shrink: 0;
            width: 250px;
            padding: 0 0 0 40px;;
            font-weight: lighter;
            line-height: 1.5;
          }
          @media (max-width: 700px), print {
            div.sidebar-spl {
              flex-direction: column;
            }
            div.sidebar-spl > :global(div:last-child) {
              margin-top: 30px;
              border-top: 1px solid black;
              width: 100%;
              padding: 0;
            }
          }
      `}</style>
      </div>
    );
  }
}
