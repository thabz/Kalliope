// @flow

import React from 'react';
import PropTypes from 'prop-types';
import PictureOverlay from './pictureoverlay.js';
import { Link, Router } from '../routes';
import type { PictureItem, Lang } from '../pages/helpers/types.js';

type MainStateTypes = {
  overlayPictures: {
    pictures: Array<PictureItem>,
    startIndex: number,
    srcPrefix: string,
    lang: Lang,
  } | null,
};
export default class Main extends React.Component<*, MainStateTypes> {
  static childContextTypes = {
    showPictureOverlay: PropTypes.func,
    hidePictureOverlay: PropTypes.func,
  };

  hidePictureOverlay() {
    this.setState({ overlayPictures: null });
  }

  constructor(props: any) {
    super(props);
    this.hidePictureOverlay = this.hidePictureOverlay.bind(this);
    this.state = {
      overlayPictures: null,
    };
  }

  getChildContext() {
    return {
      showPictureOverlay: this.showPictureOverlay.bind(this),
      hidePictureOverlay: this.hidePictureOverlay.bind(this),
    };
  }

  showPictureOverlay(
    pictures: Array<PictureItem>,
    srcPrefix: string,
    lang: Lang,
    startIndex: number = 0
  ) {
    this.setState({
      overlayPictures: { pictures, srcPrefix, lang, startIndex },
    });
  }

  render() {
    const { overlayPictures } = this.state;

    let overlay = null;
    if (overlayPictures != null) {
      const { pictures, startIndex, lang, srcPrefix } = overlayPictures;
      overlay = (
        <PictureOverlay
          pictures={pictures}
          startIndex={startIndex}
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
