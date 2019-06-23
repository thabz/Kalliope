// @flow
import React from 'react';
import PropTypes from 'prop-types';
import CommonData from '../pages/helpers/commondata.js';
import TextContent from './textcontent.js';
import type { PictureItem, Lang } from '../pages/helpers/types.js';
import Picture from './picture.js';

type SVGProps = {
  onClick: MouseEvent => void,
  inactive?: boolean,
};
class LeftArrow extends React.Component<SVGProps> {
  render() {
    const { onClick, inactive } = this.props;
    const strokeColor = inactive == true ? '#888' : 'black';
    const className = inactive == true ? 'inactive' : 'active';
    return (
      <svg width="30" height="30" onClick={onClick} className={className}>
        <circle
          className="icon-background"
          cx="15"
          cy="15"
          r="14"
          fill="white"
          stroke="black"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="8"
          y1="15"
          x2="22"
          y2="15"
          strokeWidth="1"
          stroke={strokeColor}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="15"
          y1="9"
          x2="8"
          y2="15"
          strokeWidth="1"
          stroke={strokeColor}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="15"
          y1="21"
          x2="8"
          y2="15"
          strokeWidth="1"
          stroke={strokeColor}
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
class RightArrow extends React.Component<SVGProps> {
  render() {
    const { onClick, inactive } = this.props;
    const strokeColor = inactive == true ? '#888' : 'black';
    const className = inactive == true ? 'inactive' : 'active';
    return (
      <svg width="30" height="30" onClick={onClick} className={className}>
        <circle
          className="icon-background"
          cx="15"
          cy="15"
          r="14"
          fill="white"
          stroke="black"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="8"
          y1="15"
          x2="22"
          y2="15"
          strokeWidth="1"
          stroke={strokeColor}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="15"
          y1="9"
          x2="22"
          y2="15"
          strokeWidth="1"
          stroke={strokeColor}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="15"
          y1="21"
          x2="22"
          y2="15"
          strokeWidth="1"
          stroke={strokeColor}
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

class CloseButton extends React.Component<SVGProps> {
  render() {
    const { onClick } = this.props;
    return (
      <svg width="30" height="30" onClick={onClick} className="active">
        <circle
          className="icon-background"
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

type PictureOverlayPropType = {
  pictures: Array<PictureItem>,
  startIndex: number,
  srcPrefix?: string,
  lang: Lang,
  closeCallback: Function,
};

type PictureOverlayStateType = {
  currentIndex: number,
};

export default class PictureOverlay extends React.Component<
  PictureOverlayPropType,
  PictureOverlayStateType
> {
  onKeyUp: KeyboardEvent => void;
  hideOverlay: Event => void;
  onRightClick: Event => void;
  onLeftClick: Event => void;

  static contextTypes = {
    showPictureOverlay: PropTypes.func,
    hidePictureOverlay: PropTypes.func,
  };

  constructor(props: PictureOverlayPropType) {
    super(props);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.hideOverlay = this.hideOverlay.bind(this);
    this.onRightClick = this.onRightClick.bind(this);
    this.onLeftClick = this.onLeftClick.bind(this);
    this.state = { currentIndex: props.startIndex };
  }

  componentDidMount() {
    if (document != null) {
      // eslint-disable-next-line no-undef
      document.addEventListener('keyup', this.onKeyUp, true);
      if (document.body != null && document.body.classList != null) {
        // eslint-disable-next-line no-undef
        document.body.classList.add('noscroll');
      }
    }
  }

  componentWillUnmount() {
    // eslint-disable-next-line no-undef
    document.removeEventListener('keyup', this.onKeyUp, true);
    // eslint-disable-next-line no-undef
    if (document.body != null) {
      document.body.classList.remove('noscroll');
    }
  }

  onKeyUp(e: KeyboardEvent) {
    if (e.keyCode === 27) {
      this.hideOverlay(e);
    } else if (e.keyCode === 37) {
      // Left cursor key
      this.onLeftClick(e);
    } else if (e.keyCode === 39) {
      // Right cursor key
      this.onRightClick(e);
    }
  }

  hideOverlay(e: Event) {
    e.preventDefault();
    this.props.closeCallback();
  }

  eatClick(e: MouseEvent) {
    e.stopPropagation();
  }

  onRightClick(e: Event) {
    if (this.state.currentIndex < this.props.pictures.length - 1) {
      this.setState({ currentIndex: this.state.currentIndex + 1 });
    }
    e.stopPropagation();
  }

  onLeftClick(e: Event) {
    if (this.state.currentIndex > 0) {
      this.setState({ currentIndex: this.state.currentIndex - 1 });
    }
    e.stopPropagation();
  }

  render() {
    const { pictures, lang } = this.props;
    let arrows = null;
    if (pictures.length > 1) {
      arrows = [
        <RightArrow
          key={'right'}
          onClick={this.onRightClick}
          inactive={this.state.currentIndex === this.props.pictures.length - 1}
        />,
        <LeftArrow
          key={'left'}
          onClick={this.onLeftClick}
          inactive={this.state.currentIndex === 0}
        />,
      ];
    }
    const picture = pictures[this.state.currentIndex];
    return (
      <div className="overlay-background" onClick={this.hideOverlay}>
        <div className="overlay-container" onClick={this.eatClick}>
          <div className="overlay-icon">
            <CloseButton onClick={this.hideOverlay} />
            {arrows}
          </div>
          <Picture picture={picture} lang={lang} />
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
  }
}
