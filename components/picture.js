// @flow
import React from 'react';
import type { PictureItem, Lang } from '../pages/helpers/types.js';
import TextContent from './textcontent.js';

export default class extends React.Component {
  props: {
    picture: PictureItem,
    srcPrefix?: string,
    lang: Lang,
  };
  render() {
    const { picture, lang, srcPrefix } = this.props;

    const src = (srcPrefix || '') + '/' + picture.src;
    return (
      <div className="sidebar-picture">
        <figure>
          <img src={src} width="100%" style={{ border: '1px solid black' }} />
          <figcaption>
            <TextContent contentHtml={picture.content_html} lang={lang} />
          </figcaption>
        </figure>
        <style jsx>{`
              div.sidebar-picture {
                margin-bottom: 15px;
              }
              figure {
                margin: 0;
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
