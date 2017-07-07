// @flow
import React from 'react';
import NextHead from 'next/head';
import { string } from 'prop-types';

const defaultDescription = '';
const defaultOGURL = '';
const defaultOGImage = '/static/poet-512.png';

export default class Head extends React.Component {
  props: {
    headTitle?: string,
    ogTitle?: string,
    description?: string,
    url?: string,
    ogImage?: string,
  };
  render() {
    const { ogTitle, headTitle, description, url, ogImage } = this.props;
    return (
      <NextHead>
        <meta charset="UTF-8" />
        <title>{headTitle || ogTitle || ''}</title>
        <meta name="description" content={description || defaultDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" sizes="192x192" href="/static/touch-icon.png" />
        <link rel="apple-touch-icon" href="/static/touch-icon.png" />
        <link rel="mask-icon" href="/static/favicon-mask.svg" color="#49B882" />
        <link rel="icon" href="/static/favicon.ico" />
        <link rel="manifest" href="/static/manifest.json" />
        <meta name="theme-color" content="rgb(139, 56, 65)" />
        <meta property="og:site_name" content="www.kalliope.org" />
        <meta property="og:url" content={url || defaultOGURL} />
        <meta property="og:title" content={ogTitle || headTitle || ''} />
        <meta
          property="og:description"
          content={description || defaultDescription}
        />
        <meta name="twitter:site" content={url || defaultOGURL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={ogImage || defaultOGImage} />
        <meta property="og:image" content={ogImage || defaultOGImage} />
        <meta property="og:image:width" content="600" />
      </NextHead>
    );
  }
}
