// @flow
import React from 'react';

export default class SidebarPictures extends React.Component<*> {
  static defaultProps = {
    showDropShadow: true,
  };
  render() {
    return (
      <div className="sidebar-pictures">
        {this.props.children}
        <style jsx>{`
          div.sidebar-pictures {
            display: flex;
            flex-direction: column;
          }
          @media print {
            div.sidebar-pictures {
              display: none;
            }
          }
          @media (max-width: 760px) {
            div.sidebar-pictures {
              flex-direction: row;
              flex-wrap: wrap;
              justify-content: space-between;
              align-items: start;
            }
            div.sidebar-pictures > :global(*) {
              flex-basis: 47%;
              flex-grow: 0;
            }
          }
        `}</style>
      </div>
    );
  }
}
