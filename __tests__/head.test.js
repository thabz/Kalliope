import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Head from '../components/head.js';

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }) => children,
}));

describe('side metadata', () => {
  it('uses the canonical text path and noindex for a publication placement', () => {
    const html = renderToStaticMarkup(
      <Head
        headTitle="Antologitekst"
        requestPath="/da/text/antologierdk2026071901a"
        canonicalPath="/da/text/antologierdk2026071901"
        noIndex
      />
    );

    expect(html).toContain('<meta name="robots" content="noindex,follow"/>');
    expect(html).toContain(
      '<link rel="canonical" href="https://kalliope.org/da/text/antologierdk2026071901"/>'
    );
    expect(html).toContain(
      '<link rel="alternate" hrefLang="en" href="https://kalliope.org/en/text/antologierdk2026071901"/>'
    );
    expect(html).not.toContain('antologierdk2026071901a');
  });

  it('prefixes relative Open Graph images', () => {
    const html = renderToStaticMarkup(<Head ogImage="/images/poet.jpg" />);

    expect(html).toContain(
      '<meta property="og:image" content="https://kalliope.org/images/poet.jpg"/>'
    );
    expect(html).toContain(
      '<meta name="twitter:image" content="https://kalliope.org/images/poet.jpg"/>'
    );
  });

  it('keeps absolute HTTP(S) Open Graph images unchanged', () => {
    const httpsHTML = renderToStaticMarkup(
      <Head ogImage="https://example.com/poet.jpg" />
    );
    const httpHTML = renderToStaticMarkup(
      <Head ogImage="http://example.com/poet.jpg" />
    );

    expect(httpsHTML).toContain(
      '<meta property="og:image" content="https://example.com/poet.jpg"/>'
    );
    expect(httpHTML).toContain(
      '<meta property="og:image" content="http://example.com/poet.jpg"/>'
    );
  });

  it('emits a single site name', () => {
    const html = renderToStaticMarkup(<Head />);

    expect(html.match(/property="og:site_name"/g)).toHaveLength(1);
    expect(html).toContain(
      '<meta property="og:site_name" content="Kalliope"/>'
    );
  });
});
