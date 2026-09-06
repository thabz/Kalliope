import { useEffect, useState } from 'react';
import CommonData from '../common/commondata.js';
import * as ImagePaths from '../common/imagepaths.js';
import { CloseButton, DownArrow, LeftArrow, RightArrow } from './icons.js';
import { FigCaption } from './picture.js';
import Tooltip from './tooltip.js';

const filenameFromSrc = (src) => {
  const path = src.split('?')[0];
  return path.substring(path.lastIndexOf('/') + 1);
};

const iconSize = 30;
const ovalIconStartAngle = 65;
const ovalIconAngleStep = 9;

// Convert an evenly spaced angle on the upper-right quadrant to percentages.
const ovalIconCenter = (index) => {
  const angle =
    ((ovalIconStartAngle - index * ovalIconAngleStep) * Math.PI) / 180;
  return {
    left: 50 + 50 * Math.cos(angle),
    top: 50 - 50 * Math.sin(angle),
  };
};

const isOvalPicture = (picture) => {
  return picture.src.indexOf('-oval.jpg') > -1;
};

const ovalIconStyle = (index) => {
  const center = ovalIconCenter(index);
  return {
    left: `calc(${center.left}% - ${iconSize / 2}px)`,
    top: `calc(${center.top}% - ${iconSize / 2}px)`,
  };
};

const BiggerPicture = ({ picture, controls }) => {
  const src = picture.src;
  const fallbackSrc = ImagePaths.fallbackThumbnailSrc(
    src,
    CommonData.fallbackImagePostfix
  );
  const srcSet = CommonData.availableImageFormats
    .map((ext) => {
      return CommonData.availableImageWidths
        .map((width) => {
          const filename = ImagePaths.thumbnailSrc(src, width, ext);
          return `${filename} ${width}w`;
        })
        .join(', ');
    })
    .join(', ');

  const alt = picture.content_html
    ? '' //Strings.trimHtml(picture.content_html)
    : 'Billede';

  const ovalPicture = isOvalPicture(picture);
  let imgClassName = '';
  if (ovalPicture === true) {
    imgClassName += ' oval-mask';
  }

  let clipPathStyle = {};
  let clipPathDropShadowStyle = {};
  if (picture.clipPath != null) {
    clipPathStyle = {
      clipPath: picture.clipPath,
      WebkitClipPath: picture.clipPath,
    };
    clipPathDropShadowStyle = {
      filter: 'drop-shadow(4px 4px 12px #888)',
    };
  }

  return (
    <figure
      className={`overlay-figure${
        ovalPicture === true ? ' oval-picture' : ''
      }`}>
      <div className="overlay-image-frame">
        <div className="overlay-image-shadow" style={clipPathDropShadowStyle}>
          <img
            src={fallbackSrc}
            className={imgClassName}
            alt={alt}
            style={clipPathStyle}
          />
        </div>
        {controls}
      </div>
      <FigCaption picture={picture} />
      <style jsx>{`
        figure {
          margin: 0;
        }
        figure.oval-picture :global(figcaption) {
          text-align: center;
        }
        .overlay-image-frame {
          display: inline-block;
          line-height: 0;
          position: relative;
          vertical-align: top;
        }
        .overlay-image-shadow {
          display: block;
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

const PictureOverlay = ({ pictures, startIndex, closeCallback }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const hideOverlay = (e) => {
    e.preventDefault();
    closeCallback();
  };

  const onRightClick = (e) => {
    if (currentIndex < pictures.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    e.stopPropagation();
  };

  const onLeftClick = (e) => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
    e.stopPropagation();
  };

  const onKeyUp = (e) => {
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

  const eatClick = (e) => {
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
  const ovalPicture = isOvalPicture(picture);

  buttons.push(
    <Tooltip text="Download originalbillede" key="download">
      <a
        className="download-icon"
        href={picture.src}
        download={filenameFromSrc(picture.src)}
        aria-label="Download originalbillede">
        <DownArrow />
      </a>
    </Tooltip>
  );

  const controls = (
    <div className={`overlay-icon${ovalPicture === true ? ' oval' : ''}`}>
      {buttons.map((button, index) => {
        const style = ovalPicture === true ? ovalIconStyle(index) : {};
        return (
          <div className="overlay-icon-item" style={style} key={button.key}>
            {button}
          </div>
        );
      })}
    </div>
  );
  return (
    <div className="overlay-background" onClick={hideOverlay}>
      <div className="overlay-container" onClick={eatClick}>
        <BiggerPicture picture={picture} controls={controls} />
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
          z-index: 999;
        }

        .overlay-background :global(.overlay-container) {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
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

        .overlay-container :global(.overlay-icon) {
          width: 30px;
          height: 30px;
          position: absolute;
          right: -15px;
          top: -15px;
        }

        .overlay-container :global(.overlay-icon.oval) {
          bottom: 0;
          height: 100%;
          left: 0;
          pointer-events: none;
          right: 0;
          top: 0;
          width: 100%;
        }

        .overlay-container
          :global(.overlay-icon.oval)
          :global(.overlay-icon-item) {
          pointer-events: auto;
          position: absolute;
        }

        .overlay-container :global(.overlay-icon) :global(svg),
        .overlay-container :global(.overlay-icon) :global(a.download-icon) {
          display: block;
        }

        .overlay-container
          :global(.overlay-icon:not(.oval))
          :global(.overlay-icon-item)
          + :global(.overlay-icon-item) {
          margin-top: 5px;
        }

        :global(.overlay-icon .active:hover .icon-background) {
          fill: #eee;
        }
        :global(.overlay-icon .active) {
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
export { isOvalPicture, ovalIconCenter };
