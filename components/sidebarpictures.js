// @flow
import React from 'react';
import type { PictureItem, Lang } from '../pages/helpers/types.js';
import Picture from './picture.js';

export default class SidebarPictures extends React.Component {
  props: {
    pictures: Array<PictureItem>,
    srcPrefix?: string,
    showDropShadow?: boolean,
    clickToZoom?: boolean,
    lang: Lang,
  };
  static defaultProps = {
    showDropShadow: true,
  };
  render() {
    const {
      pictures,
      lang,
      srcPrefix,
      showDropShadow,
      clickToZoom,
    } = this.props;
    const renderedPictures = pictures.map((picture, i) => {
      return (
        <Picture
          key={'picture' + i}
          picture={picture}
          srcPrefix={srcPrefix}
          clickToZoom={clickToZoom}
          showDropShadow={showDropShadow}
          lang={lang}
        />
      );
    });
    return (
      <div className="sidebar-pictures">
        {renderedPictures}
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
          @media (max-width: 800px) {
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
