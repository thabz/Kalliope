// @flow

import React from 'react';
import PropTypes from 'prop-types';
import PictureOverlay from './pictureoverlay.js';
import { Link, Router } from '../routes';

export default class Main extends React.Component {
  static childContextTypes = {
    showPictureOverlay: PropTypes.func,
    hidePictureOverlay: PropTypes.func,
  };

  constructor(props: any) {
    super(props);
    this.hidePictureOverlay = this.hidePictureOverlay.bind(this);
    this.state = {
      overlayPicture: null,
    };
  }

  getChildContext() {
    return {
      showPictureOverlay: this.showPictureOverlay.bind(this),
      hidePictureOverlay: this.hidePictureOverlay.bind(this),
    };
  }

  showPictureOverlay(picture, srcPrefix, lang) {
    this.setState({ overlayPicture: { picture, srcPrefix, lang } });
  }

  hidePictureOverlay() {
    this.setState({ overlayPicture: null });
  }

  render() {
    const { overlayPicture } = this.state;

    let overlay = null;
    if (overlayPicture != null) {
      const { picture, lang, srcPrefix } = overlayPicture;
      overlay = (
        <PictureOverlay
          picture={picture}
          srcPrefix={srcPrefix}
          lang={lang}
          clickToZoom={false}
          closeCallback={this.hidePictureOverlay}
        />
      );
    }

    return (
      <div>
        {overlay}
        {this.props.children}
        <style jsx>{`
          div {
            max-width: 880px;
            margin: 0px auto;
            padding: 0 20px;
          }
        `}</style>
      </div>
    );
  }
}
