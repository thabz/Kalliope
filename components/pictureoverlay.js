// @flow
import React, { useState, useEffect, useContext } from 'react';
import CommonData from '../common/commondata.js';
import TextContent from './textcontent.js';
import { CloseButton, LeftArrow, RightArrow } from './icons.js';
import type { PictureItem } from '../common/types.js';
import { FigCaption } from './picture.js';

const BiggerPicture = ({ picture }: { picture: PictureItem }) => {
  const src = picture.src;
  const fallbackSrc = src.replace(/\/([^\/]+).jpg$/, (m, p1) => {
    return '/t/' + p1 + CommonData.fallbackImagePostfix;
  });
  const srcSet = CommonData.availableImageFormats
    .map(ext => {
      return CommonData.availableImageWidths
        .map(width => {
          const filename = src
            .replace(/.jpg$/, `-w${width}.${ext}`)
            .replace(/\/([^\/]+)$/, '/t/$1');
          return `${filename} ${width}w`;
        })
        .join(', ');
    })
    .join(', ');

  const alt = picture.content_html
    ? '' //Strings.trimHtml(picture.content_html)
    : 'Billede';

  let pictureClassName = 'overlay-picture';
  let imgClassName = '';
  if (picture.src.indexOf('-oval.jpg') > -1) {
    pictureClassName += ' oval-mask';
    imgClassName += ' oval-mask';
  }
  return (
    <figure className="overlay-figure">
      <img src={fallbackSrc} className={imgClassName} alt={alt} />
      <FigCaption picture={picture} />
      <style jsx>{`
        figure {
          margin: 0;
        }
        .oval-mask {
          border-radius: 50%;
        }
        img {
          border: 0;
        }
        img {
          box-shadow: 4px 4px 12px #888;
        }
      `}</style>{' '}
    </figure>
  );
};

type Props = {
  pictures: Array<PictureItem>,
  startIndex: number,
  closeCallback: () => void,
};
const PictureOverlay = ({ pictures, startIndex, closeCallback }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const hideOverlay = (e: Event) => {
    e.preventDefault();
    closeCallback();
  };

  const onRightClick = (e: Event) => {
    if (currentIndex < pictures.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    e.stopPropagation();
  };

  const onLeftClick = (e: Event) => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
    e.stopPropagation();
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.keyCode === 27) {
      hideOverlay(e);
    } else if (e.keyCode === 37) {
      // Left cursor key
      onLeftClick(e);
    } else if (e.keyCode === 39) {
      // Right cursor key
      onRightClick(e);
    }
  };

  const eatClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  useEffect(() => {
    document.addEventListener('keyup', onKeyUp, true);
    return () => {
      document.removeEventListener('keyup', onKeyUp, true);
    };
  });

  useEffect(() => {
    if (document.body != null && document.body.classList != null) {
      document.body.classList.add('noscroll');
    }
    return () => {
      if (document.body != null && document.body.classList != null) {
        document.body.classList.remove('noscroll');
      }
    };
  });

  let buttons = [<CloseButton onClick={hideOverlay} key="close" />];
  if (pictures.length > 1) {
    buttons.push(
      <RightArrow
        key={'right'}
        onClick={onRightClick}
        inactive={currentIndex === pictures.length - 1}
      />
    );
    buttons.push(
      <LeftArrow
        key={'left'}
        onClick={onLeftClick}
        inactive={currentIndex === 0}
      />
    );
  }
  const picture = pictures[currentIndex];
  return (
    <div className="overlay-background" onClick={hideOverlay}>
      <div className="overlay-container" onClick={eatClick}>
        <div className="overlay-icon">{buttons}</div>
        <BiggerPicture picture={picture} />
      </div>
      <style jsx>{`
        .overlay-background {
          position: fixed;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.9);
          overflow-y: scroll;
        }

        .overlay-background :global(.overlay-container) {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 999;
        }

        .overlay-background .overlay-container :global(.overlay-figure) {
        }

        .overlay-background
          .overlay-container
          :global(.overlay-figure)
          :global(img) {
          max-width: 80vw;
          max-height: 80vh;
        }

        .overlay-background
          .overlay-container
          :global(.overlay-figure)
          :global(figcaption) {
          min-width: 100%;
          width: 100px;
        }

        .overlay-container .overlay-icon {
          width: 30px;
          height: 30px;
          position: absolute;
          right: -15px;
          top: -15px;
        }

        .overlay-container .overlay-icon svg {
          display: block;
        }

        :global(.overlay-icon svg.active:hover .icon-background) {
          fill: #eee;
        }
        :global(.overlay-icon svg.active) {
          cursor: pointer;
        }

        :global(.noscroll) {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default PictureOverlay;
