// @flow

import React from 'react';
import NextHead from 'next/head';

const urlPrefix: string = 'https://kalliope.org';
const defaultDescription =
  'Kalliope er en database indeholdende ældre dansk lyrik samt biografiske oplysninger om danske digtere. Målet er intet mindre end at samle hele den ældre danske lyrik, men indtil videre indeholder Kalliope et forhåbentligt repræsentativt, og stadigt voksende, udvalg af den danske digtning.';
const defaultOGURL = urlPrefix;
const defaultOGImage = `${urlPrefix}/static/touch-icon.png`;

type HeadProps = {
  headTitle?: string,
  ogTitle?: string,
  description?: ?string,
  url?: string,
  ogImage?: ?string,
  requestPath?: string,
};
export default class Head extends React.Component<HeadProps> {
  render() {
    const {
      ogTitle,
      headTitle,
      description,
      url,
      ogImage,
      requestPath,
    } = this.props;

    const appleTouchIcons = [180, 152, 120, 76, 60].map(s => {
      const x = `${s}x${s}`;
      return (
        <link
          key={x}
          rel="apple-touch-icon"
          sizes={x}
          href={`/apple-touch-icon-${x}.png`}
        />
      );
    });
    let ogImageAbsolute = ogImage || defaultOGImage;
    if (!ogImageAbsolute.startsWith('http')) {
      ogImageAbsolute = `${urlPrefix}${ogImageAbsolute}`;
    }
    let hreflangs = [];
    if (requestPath != null) {
      hreflangs = ['da', 'en'].map(lang => {
        const alternatePath = requestPath.replace(/^\/../, '/' + lang);
        const alternateURL = urlPrefix + alternatePath;
        return (
          <link
            rel="alternate"
            hreflang={lang}
            href={alternateURL}
            key={lang}
          />
        );
      });
    }
    return (
      <NextHead>
        <meta charSet="UTF-8" />
        <title>{headTitle || ogTitle || ''}</title>
        <meta name="description" content={description || defaultDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" sizes="180x180" href="/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {appleTouchIcons}
        <link rel="mask-icon" href="/static/favicon-mask.svg" color="black" />
        <link rel="icon" href="/static/favicon.ico" />
        <link rel="manifest" href="/static/manifest.json" />
        {hreflangs}
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
