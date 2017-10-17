// @flow

import React from 'react';

export default class SidebarSplit extends React.Component {
  props: {
    sidebar: React$Element<*> | string | Array<React$Element<*>> | null,
    children?: *,
    sidebarOnTopWhenSplit?: boolean,
  };
  render() {
    const { sidebar, sidebarOnTopWhenSplit } = this.props;
    let className =
      sidebar == null || sidebar.length == 0
        ? 'sidebar-spl empty'
        : 'sidebar-spl';
    className += sidebarOnTopWhenSplit ? ' reverse-split' : '';
    const renderedSidebar = <aside>{sidebar}</aside>;
    return (
      <div className={className}>
        {this.props.children}
        {renderedSidebar}
        <style jsx>{`
          div.sidebar-spl {
            width: 100%;
            display: flex;
          }
          div.sidebar-spl > :global(div:first-child) {
            flex-grow: 1;
            padding: 0 40px 0 0;
          }
          div.sidebar-spl > :global(aside:last-child) {
            flex-shrink: 0;
            width: 250px;
            padding: 0 0 0 40px;
            font-weight: lighter;
            line-height: 1.5;
            border-left: 1px solid #666;
            color: #666;
          }
          div.sidebar-spl.empty > :global(div:first-child) {
            padding-right: 0;
          }
          div.sidebar-spl.empty > :global(aside:last-child) {
            border-left: none;
          }

          @media (max-width: 800px) {
            div.sidebar-spl > :global(aside:last-child) {
              width: 200px;
            }
          }
          @media (max-width: 760px), print {
            div.sidebar-spl {
              flex-direction: column;
            }
            div.sidebar-spl > :global(div:first-child) {
              padding: 0;
            }
            div.sidebar-spl > :global(aside:last-child) {
              margin-top: 30px;
              border-top: 1px solid #666;
              border-left: 0;
              width: 100%;
              padding: 20px 0 0 0;
            }

            div.sidebar-spl.reverse-split > :global(div:first-child) {
              padding-top: 40px;
              order: 2;
            }
            div.sidebar-spl.reverse-split > :global(aside:last-child) {
              order: 1;
              border-top: none;
              border-bottom: 1px solid #666;
              border-left: 0;
              width: 100%;
              padding: 0 0 10px 0;
            }
          }
        `}</style>
      </div>
    );
  }
}
