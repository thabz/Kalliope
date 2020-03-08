// @flow
import React, { useContext, useState } from 'react';
import type { PictureItem, Lang, TextLang } from '../common/types.js';
import TextContent from './textcontent.js';
import PictureOverlay from './pictureoverlay.js';
import CommonData from '../common/commondata.js';
import PoetName from './poetname.js';
import * as Links from './links.js';
import Stack from './stack.js';
import * as Strings from '../common/strings.js';
import LangContext from '../common/LangContext.js';
import { Link } from '../routes';

type FigCaptionProps = {
  picture: PictureItem,
  hideArtist?: boolean,
  hideMuseum?: boolean,
};
const FigCaption = (props: FigCaptionProps) => {
  const { picture, hideArtist = false, hideMuseum = false } = props;
  const lang = useContext(LangContext);

  let artistRendered = null;
  if (!hideArtist && picture.artist != null) {
    artistRendered = (
      <>
        <Link route={Links.poetURL(lang, picture.artist.id)}>
          <a>
            <PoetName poet={picture.artist} />
          </a>
        </Link>
        {': '}
      </>
    );
  }

  let remoteLink = null;
  if (picture.remoteUrl != null) {
    remoteLink = <a href={picture.remoteUrl}>⌘</a>;
  }

  let museumRendered = null;
  if (picture.museum != null) {
    const name = picture.museum.name;
    if (name) {
      museumRendered = (
        <>
          {' '}
          <Link route={Links.museumURL(lang, picture.museum.id)}>{name}</Link>
          {'. '}
        </>
      );
    }
  }

  let noteRendered = null;
  if (picture.note_html != null) {
    noteRendered = (
      <TextContent
        contentHtml={picture.note_html}
        contentLang={picture.content_lang || 'da'}
      />
    );
  }

  return (
    <figcaption>
      <Stack>
        <div>
          {artistRendered}
          <TextContent
            inline={true}
            contentHtml={picture.content_html}
            contentLang={picture.content_lang || 'da'}
          />
          {museumRendered}
          {remoteLink}
        </div>
        {noteRendered}
      </Stack>
      <style jsx>{`
        figcaption {
          margin-top: 8px;
          font-size: 16px;
          line-height: 1.4;
        }
      `}</style>
    </figcaption>
  );
};

type PictureProps = {
  pictures: Array<PictureItem>,
  hideArtist?: boolean,
  hideMuseum?: boolean,
  startIndex?: number,
  showDropShadow?: boolean,
  clickToZoom?: boolean,
  contentLang: TextLang,
};
const Picture = ({
  pictures,
  contentLang,
  hideArtist = false,
  hideMuseum = false,
  showDropShadow = true,
  clickToZoom = true,
  startIndex = 0,
}: PictureProps) => {
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
        <FigCaption
          picture={picture}
          hideArtist={hideArtist}
          hideMuseum={hideMuseum}
        />
      </figure>
      {pictureOverlay}
      <style jsx>{`
        div.sidebar-picture {
          margin-bottom: 30px;
        }
        figure {
          margin: 0;
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
