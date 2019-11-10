// @flow
import React, { useContext, useState } from 'react';
import type { PictureItem, Lang, TextLang } from '../pages/helpers/types.js';
import TextContent from './textcontent.js';
import PictureOverlay from './pictureoverlay.js';
import CommonData from '../pages/helpers/commondata.js';
import * as Strings from '../pages/helpers/strings.js';
import LangContext from '../pages/helpers/LangContext.js';

type PictureProps = {
  pictures: Array<PictureItem>,
  startIndex?: number,
  lang: Lang,
  showDropShadow?: boolean,
  clickToZoom?: boolean,
  contentLang: TextLang,
};
const Picture = ({
  pictures,
  contentLang,
  showDropShadow = true,
  clickToZoom = true,
  startIndex = 0,
}: PictureProps) => {
  const lang = useContext(LangContext);
  const [overlayShown, showOverlay] = useState(false);

  const picture = pictures[startIndex];
  const src = picture.src;
  const fallbackSrc = src.replace(/\/([^\/]+).jpg$/, (m, p1) => {
    return '/t/' + p1 + CommonData.fallbackImagePostfix;
  });
  const sizes = '(max-width: 700px) 250px, 48vw';
  let srcsets = {};
  const sources = CommonData.availableImageFormats.map(ext => {
    const srcset = CommonData.availableImageWidths
      .map(width => {
        const filename = src
          .replace(/.jpg$/, `-w${width}.${ext}`)
          .replace(/\/([^\/]+)$/, '/t/$1');
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
  if (showDropShadow == true) {
    pictureClassName += ' with-drop-shadow';
  }
  if (clickToZoom == true) {
    pictureClassName += ' clickable';
  }

  const onClick = () => {
    if (clickToZoom == true) {
      showOverlay(true);
    }
  };

  let pictureOverlay = null;
  if (overlayShown) {
    const onOverlayClose = () => {
      showOverlay(false);
    };
    pictureOverlay = (
      <PictureOverlay
        pictures={pictures}
        closeCallback={onOverlayClose}
        lang={lang}
        startIndex={startIndex}
      />
    );
  }
  return (
    <div className="sidebar-picture">
      <figure>
        <picture className={pictureClassName} onClick={onClick}>
          {sources}
          <img
            className={pictureClassName}
            src={fallbackSrc}
            width="100%"
            alt={alt}
          />
        </picture>
        <figcaption>
          <TextContent
            contentHtml={picture.content_html}
            contentLang={picture.content_lang || 'da'}
            lang={lang}
          />
        </figcaption>
      </figure>
      {pictureOverlay}
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
          line-height: 1.6;
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
        img.clickable {
          cursor: pointer;
        }
        @media print {
          figure {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Picture;
