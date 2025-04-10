import NextHead from 'next/head';
import React from 'react';

const urlPrefix = 'https://kalliope.org';
const defaultDescription =
  'Kalliope er en database indeholdende ældre dansk lyrik samt biografiske oplysninger om danske digtere. Målet er intet mindre end at samle hele den ældre danske lyrik, men indtil videre indeholder Kalliope et forhåbentligt repræsentativt, og stadigt voksende, udvalg af den danske digtning.';
const defaultOGURL = urlPrefix;
const defaultOGImage = `${urlPrefix}/static/touch-icon.png`;

export default class Head extends React.Component {
  render() {
    const { ogTitle, headTitle, description, url, ogImage, requestPath } =
      this.props;

    const appleTouchIcons = [180, 152, 120, 76, 60].map((s) => {
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
    let ogImageAbsolute = ogImage != null ? ogImage : defaultOGImage;
    if (!ogImageAbsolute.indexOf('http') === 0) {
      ogImageAbsolute = `${urlPrefix}${ogImageAbsolute}`;
    }
    let hreflangs = [];
    if (requestPath != null) {
      hreflangs = ['da', 'en'].map((lang) => {
        const alternatePath = requestPath.replace(/^\/../, '/' + lang);
        const alternateURL = urlPrefix + alternatePath;
        return (
          <link
            rel="alternate"
            hrefLang={lang}
            href={alternateURL}
            key={lang}
          />
        );
      });
    }
    let canonical = null;
    let ogURL = null;
    if (requestPath != null) {
      const url = urlPrefix + requestPath;
      canonical = <link rel="canonical" href={url} />;
      ogURL = <meta property="og:url" content={url} />;
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        {canonical}
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
        <meta property="og:site_name" content="Kalliope" />
        <meta property="og:type" content="website" />
        {ogURL}
      </NextHead>
    );
  }
}
