// @flow
import React from 'react';
import type { PictureItem, Lang } from '../pages/helpers/types.js';
import TextContent from './textcontent.js';
import CommonData from '../pages/helpers/commondata.js';
import * as Strings from '../pages/helpers/strings.js';

export default class Picture extends React.Component {
  props: {
    picture: PictureItem,
    srcPrefix?: string,
    showDropShadow?: boolean,
    lang: Lang,
  };
  static defaultProps = {
    showDropShadow: true,
  };
  render() {
    const { picture, lang, srcPrefix, showDropShadow } = this.props;

    const src: string = (srcPrefix || '') + '/' + picture.src;
    const fallbackSrc = src.replace(/\/(.*?).jpg$/, (m, p1) => {
      return '/t/' + p1 + CommonData.fallbackImagePostfix;
    });
    const sizes = '(max-width: 700px) 250px, 48vw';
    let srcsets = {};
    const sources = CommonData.availableImageFormats.map(ext => {
      const srcset = CommonData.availableImageWidths
        .map(width => {
          const filename = src
            .replace(/.jpg$/, `-w${width}.${ext}`)
            .replace(/\/([^\/]*?)$/, '/t/$1');
          return `${filename} ${width}w`;
        })
        .join(', ');
      srcsets[ext] = srcset;
      const type = ext !== 'jpg' ? `image/${ext}` : '';
      return <source key={ext} type={type} srcSet={srcset} sizes={sizes} />;
    });
    const alt = picture.content_html
      ? '' //Strings.trimHtml(picture.content_html)
      : 'Billede';
    let pictureClassName = '';
    if (picture.src.indexOf('-oval.jpg') > -1) {
      pictureClassName += 'oval-mask';
    }
    if (showDropShadow) {
      pictureClassName += ' with-drop-shadow';
    }
    return (
      <div className="sidebar-picture">
        <figure>
          <picture className={pictureClassName}>
            {sources}
            <img
              className={pictureClassName}
              src={fallbackSrc}
              width="100%"
              alt={alt}
            />
          </picture>
          <figcaption>
            <TextContent contentHtml={picture.content_html} lang={lang} />
          </figcaption>
        </figure>
        <style jsx>{`
          div.sidebar-picture {
            margin-bottom: 30px;
          }
          figure {
            margin: 0;
          }
          figcaption {
            margin-top: 8px;
            font-size: 0.8em;
          }
          .oval-mask {
            border-radius: 50%;
          }
          img {
            border: 0;
          }
          img.with-drop-shadow {
            box-shadow: 4px 4px 12px #888;
          }
          @media print {
            figure {
              display: none;
            }
          }
        `}</style>
      </div>
    );
  }
}
