import NextHead from 'next/head';
import { supportedLanguages } from '../common/languages.js';

const urlPrefix = 'https://kalliope.org';
const defaultDescription =
  'Kalliope er en database indeholdende ældre dansk lyrik samt biografiske oplysninger om danske digtere. Målet er intet mindre end at samle hele den ældre danske lyrik, men indtil videre indeholder Kalliope et forhåbentligt repræsentativt, og stadigt voksende, udvalg af den danske digtning.';
const defaultOGURL = urlPrefix;
const defaultOGImage = `${urlPrefix}/touch-icon.png`;
const criticalFonts = [
  '/fonts/alegreya-sans/alegreya-sans-normal-400-latin.woff2',
  '/fonts/alegreya-sans/alegreya-sans-normal-100-latin.woff2',
];

const Head = ({
  ogTitle,
  headTitle,
  description,
  url,
  ogImage,
  requestPath,
  canonicalPath,
  noIndex = false,
}) => {
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
  const metadataPath = canonicalPath || requestPath;
  if (metadataPath != null) {
    hreflangs = supportedLanguages.map((lang) => {
      const alternatePath = metadataPath.replace(/^\/../, '/' + lang);
      const alternateURL = urlPrefix + alternatePath;
      return (
        <link rel="alternate" hrefLang={lang} href={alternateURL} key={lang} />
      );
    });
  }
  let canonical = null;
  let ogURL = null;
  if (metadataPath != null) {
    const url = urlPrefix + metadataPath;
    canonical = <link rel="canonical" href={url} />;
    ogURL = <meta property="og:url" content={url} />;
  }
  return (
    <NextHead>
      <meta charSet="UTF-8" />
      <title>{headTitle || ogTitle || ''}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {noIndex ? <meta name="robots" content="noindex,follow" /> : null}
      <link rel="icon" sizes="180x180" href="/apple-touch-icon-180x180.png" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      {appleTouchIcons}
      <link rel="mask-icon" href="/favicon-mask.svg" color="black" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="manifest" href="/manifest.json" />
      {criticalFonts.map((href) => (
        <link
          rel="preload"
          href={href}
          as="font"
          type="font/woff2"
          crossOrigin=""
          key={href}
        />
      ))}
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
};

export default Head;
