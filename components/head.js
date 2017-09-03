// @flow
import React from 'react';
import NextHead from 'next/head';
import { string } from 'prop-types';

const urlPrefix = 'https://kalliope.org';
const defaultDescription =
  'Kalliope er en database indeholdende ældre dansk lyrik samt biografiske oplysninger om danske digtere. Målet er intet mindre end at samle hele den ældre danske lyrik, men indtil videre indeholder Kalliope et forhåbentligt repræsentativt, og stadigt voksende, udvalg af den danske digtning.';
const defaultOGURL = urlPrefix;
const defaultOGImage = `${urlPrefix}/static/touch-icon.png`;

export default class Head extends React.Component {
  props: {
    headTitle?: string,
    ogTitle?: string,
    description?: ?string,
    url?: string,
    ogImage?: ?string,
  };

  render() {
    const { ogTitle, headTitle, description, url, ogImage } = this.props;
    let ogImageAbsolute = ogImage || defaultOGImage;
    if (!ogImageAbsolute.startsWith('http')) {
      ogImageAbsolute = `${urlPrefix}${ogImageAbsolute}`;
    }
    return (
      <NextHead>
        <meta charset="UTF-8" />
        <title>
          {headTitle || ogTitle || ''}
        </title>
        <meta name="description" content={description || defaultDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" sizes="192x192" href="/static/touch-icon.png" />
        <link rel="apple-touch-icon" href="/static/touch-icon.png" />
        <link rel="mask-icon" href="/static/favicon-mask.svg" color="black" />
        <link rel="icon" href="/static/favicon.ico" />
        <link rel="manifest" href="/static/manifest.json" />
        <meta name="theme-color" content="rgb(139, 56, 65)" />
        <meta property="og:site_name" content="www.kalliope.org" />
        {/*<meta property="og:url" content={url || defaultOGURL} />*/}
        <meta property="og:title" content={ogTitle || headTitle || ''} />
        <meta
          property="og:description"
          content={description || defaultDescription}
        />
        <meta name="twitter:site" content="@kalliope_org" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:image" content={ogImageAbsolute} />
        <meta property="og:image" content={ogImageAbsolute} />
        <meta property="og:image:width" content="600" />
      </NextHead>
    );
  }
}
