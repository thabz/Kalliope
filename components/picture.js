import Link from 'next/link';
import { useContext, useState } from 'react';
import CommonData from '../common/commondata.js';
import * as ImagePaths from '../common/imagepaths.js';
import LangContext from '../common/LangContext.js';
import * as Links from './links.js';
import PictureOverlay from './pictureoverlay.js';
import PoetName from './poetname.js';
import Stack from './stack.js';
import { TextInline } from './textcontent.js';

const FigCaption = (props) => {
  const { picture, hideArtist = false, hideMuseum = false } = props;
  const lang = useContext(LangContext);

  let artistRendered = null;
  if (!hideArtist && picture.artist != null) {
    artistRendered = (
      <>
        <Link href={Links.poetURL(lang, picture.artist.id)}>
          <PoetName poet={picture.artist} />
        </Link>
        {': '}
      </>
    );
  }

  let remoteLink = null;
  if (picture.remoteUrl != null) {
    remoteLink = (
      <>
        {' '}
        <a href={picture.remoteUrl}>⌘</a>
      </>
    );
  }

  let museumRendered = null;
  if (!hideMuseum && picture.museum != null) {
    const name = picture.museum.name;
    if (name) {
      museumRendered = (
        <>
          {' '}
          <Link href={Links.museumURL(lang, picture.museum.id)}>{name}</Link>
          {'. '}
        </>
      );
    }
  }

  let noteRendered = null;
  if (picture.note_html != null) {
    noteRendered = (
      <TextInline
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
          <TextInline
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

const Picture = ({
  pictures,
  contentLang,
  hideArtist = false,
  hideMuseum = false,
  showDropShadow = true,
  clickToZoom = true,
  startIndex = 0,
  sizes = '(max-width: 767px) 47vw, 250px',
}) => {
  const [overlayShown, showOverlay] = useState(false);
  const picture = pictures[startIndex];
  const src = picture.src;
  const fallbackSrc = ImagePaths.fallbackThumbnailSrc(
    src,
    CommonData.fallbackImagePostfix
  );
  let srcsets = {};
  const sources = CommonData.availableImageFormats.map((ext) => {
    const srcset = CommonData.availableImageWidths
      .map((width) => {
        const filename = ImagePaths.thumbnailSrc(src, width, ext);
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
        <picture
          className={pictureClassName}
          onClick={onClick}
          style={clipPathDropShadowStyle}>
          {sources}
          <img
            className={pictureClassName}
            src={fallbackSrc}
            width="100%"
            style={clipPathStyle}
            alt={alt}
          />
        </picture>
        <FigCaption
          picture={{
            ...picture,
            content_html:
              picture.miniature_content_html || picture.content_html,
          }}
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
export { FigCaption };
