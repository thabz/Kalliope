// @flow
import React from 'react';
import type { PictureItem, Lang } from '../pages/helpers/types.js';
import Picture from './picture.js';

export default class SidebarPictures extends React.Component {
  props: {
    pictures: Array<PictureItem>,
    srcPrefix?: string,
    lang: Lang,
  };
  render() {
    const { pictures, lang, srcPrefix } = this.props;
    const renderedPictures = pictures.map((picture, i) => {
      return (
        <Picture
          key={'picture' + i}
          picture={picture}
          srcPrefix={srcPrefix}
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
          @media (max-width: 700px) {
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
