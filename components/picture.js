// @flow
import * as React from 'react';
import type { PictureItem, Lang } from '../pages/helpers/types.js';
import CommonData from '../pages/helpers/commondata.js';
import TextContent from './textcontent.js';

type Props = {
  picture: PictureItem,
  lang: Lang,
};
export default class Picture extends React.Component<Props> {
  props: {
    picture: PictureItem,
    lang: Lang,
  };

  render() {
    const { picture, lang } = this.props;
    const src = picture.src;
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
          <TextContent
            contentHtml={picture.content_html}
            lang={lang}
            contentLang={picture.content_lang}
          />
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
