// @flow
import React from 'react';
import PropTypes from 'prop-types';
import CommonData from '../pages/helpers/commondata.js';
import TextContent from './textcontent.js';
import type { PictureItem, Lang } from '../pages/helpers/types.js';

class CloseButton extends React.Component {
  render() {
    return (
      <svg width="30" height="30">
        <circle
          cx="15"
          cy="15"
          r="14"
          fill="white"
          stroke="black"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="9"
          y1="9"
          x2="21"
          y2="21"
          strokeWidth="1"
          stroke="black"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="21"
          y1="9"
          x2="9"
          y2="21"
          strokeWidth="1"
          stroke="black"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          className="button-overlay"
          cx="15"
          cy="15"
          r="14"
          fill="transparent"
        />
      </svg>
    );
  }
}

class BiggerPicture extends React.Component {
  props: {
    picture: PictureItem,
    srcPrefix: ?string,
    lang: Lang,
  };

  render() {
    const { srcPrefix, picture, lang } = this.props;
    const src: string = (srcPrefix || '') + '/' + picture.src;
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
        <figcaption>
          <TextContent contentHtml={picture.content_html} lang={lang} />
        </figcaption>
        <style jsx>{`
          figure {
            margin: 0;
          }
          figcaption {
            margin-top: 16px;
            line-height: 1.5;
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
  }
}

type PictureOverlayPropType = {
  picture: PictureItem,
  srcPrefix?: string,
  lang: Lang,
  closeCallback: Function,
};

export default class PictureOverlay extends React.Component {
  props: PictureOverlayPropType;
  onKeyUp: Function;
  hideOverlay: Function;

  static contextTypes = {
    showPictureOverlay: PropTypes.func,
    hidePictureOverlay: PropTypes.func,
  };

  constructor(props: PictureOverlayPropType) {
    super(props);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.hideOverlay = this.hideOverlay.bind(this);
  }

  componentDidMount() {
    if (
      document != null &&
      document.body != null &&
      document.body.classList != null
    ) {
      // eslint-disable-next-line no-undef
      document.addEventListener('keyup', this.onKeyUp, false);
      // eslint-disable-next-line no-undef
      document.body.classList.add('noscroll');
    }
  }

  componentWillUnmount() {
    // eslint-disable-next-line no-undef
    document.removeEventListener('keyup', this.onKeyUp, false);
    // eslint-disable-next-line no-undef
    if (document.body != null) {
      document.body.classList.remove('noscroll');
    }
  }

  onKeyUp(e: KeyboardEvent) {
    if (e.keyCode === 27) {
      this.hideOverlay(e);
    }
  }

  hideOverlay(e: Event) {
    e.preventDefault();
    this.props.closeCallback();
  }

  eatClick(e: MouseEvent) {
    e.stopPropagation();
  }

  render() {
    const { picture, srcPrefix, lang } = this.props;

    return (
      <div className="overlay-background" onClick={this.hideOverlay}>
        <div className="overlay-container" onClick={this.eatClick}>
          <div className="overlay-close" onClick={this.hideOverlay}>
            <CloseButton />
          </div>
          <BiggerPicture picture={picture} srcPrefix={srcPrefix} lang={lang} />
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

          .overlay-background .overlay-container :global(.overlay-figure) :global(img) {
            max-width: 80vw;
            max-height: 80vh;
          }

          .overlay-background .overlay-container :global(.overlay-figure) :global(figcaption) {
            min-width: 100%;
            width: 100px;
          }

          .overlay-container .overlay-close {
            width: 30px;
            height: 30px;
            cursor: pointer;
            position: absolute;
            right: -15px;
            top: -15px;
          }

          .overlay-container .overlay-close svg {
            display: block;
          }

          .overlay-container .overlay-close svg .button-overlay:hover {
            fill: rgba(0, 0, 0, 0.05);
          }

          :global(.noscroll) {
            overflow: hidden;
          }
        `}</style>
      </div>
    );
  }
}
