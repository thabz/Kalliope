// @flow
import React from 'react';
import PropTypes from 'prop-types';
import type { PictureItem, Lang } from '../pages/helpers/types.js';

export default class PictureOverlay extends React.Component {
  props: {
    picture: PictureItem,
    srcPrefix?: string,
    lang: Lang,
    closeCallback: Function,
  };
  static contextTypes = {
    showPictureOverlay: PropTypes.func,
    hidePictureOverlay: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.hideOverlay = this.hideOverlay.bind(this);
  }

  componentDidMount() {
    // eslint-disable-next-line no-undef
    document.addEventListener('keyup', this.onKeyUp, false);
    // eslint-disable-next-line no-undef
    document.body.classList.add('noscroll');
  }

  componentWillUnmount() {
    // eslint-disable-next-line no-undef
    document.removeEventListener('keyup', this.onKeyUp, false);
    // eslint-disable-next-line no-undef
    document.body.classList.remove('noscroll');
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

  eatClick(e) {
    e.stopPropagation();
  }

  componentDidMount() {
    console.log('Overlay did mount');
  }
  render() {
    return (
      <div className="overlay-background" onClick={this.hideOverlay}>
        <div className="overlay-container" onClick={this.eatClick}>
          <figure />
          {this.props.children}
        </div>
        <style jsx>{`
          .overlay-background {
            position: fixed;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            overflow-y: scroll;
          }

          .overlay-background .overlay-container {
            margin: 10vh auto;
            width: 80%;
            max-width: 1024px;
            min-height: 80vh;
            z-index: 999;

            background-color: white;
            border: 1px solid black;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 5px 5px 20px rgba(0, 0, 0, 0.2);

            /* Just for the overlay-close with position: absolute below */
            position: relative;
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

          .noscroll {
            overflow: hidden;
          }
        `}</style>
      </div>
    );
  }
}
