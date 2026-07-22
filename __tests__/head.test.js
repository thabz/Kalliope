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
});
