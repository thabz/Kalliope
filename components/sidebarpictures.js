// @flow
import React from 'react';
import type { PictureItem, Lang } from '../pages/helpers/types.js';
import Picture from './picture.js';

type SidebarPicturesProps = {
  pictures: Array<PictureItem>,
  showDropShadow?: boolean,
  clickToZoom?: boolean,
  lang: Lang,
};
export default class SidebarPictures extends React.Component<
  SidebarPicturesProps
> {
  static defaultProps = {
    showDropShadow: true,
  };
  render() {
    const { pictures, lang, showDropShadow, clickToZoom } = this.props;
    const renderedPictures = pictures.map((picture, i) => {
      return (
        <Picture
          key={'picture' + i}
          pictures={[picture]}
          clickToZoom={clickToZoom}
          showDropShadow={showDropShadow}
          contentLang={picture.content_lang || 'da'}
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
