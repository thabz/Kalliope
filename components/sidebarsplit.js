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
            flex-grow: 0;
            width: 300px;
            padding: 0 10px;
            font-weight: lighter;
            line-height: 1.5;
          }
      `}</style>
      </div>
    );
  }
}
