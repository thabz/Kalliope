import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Tabs from '../components/menu.js';

describe('menu', () => {
  it('renders a working search link without client-side JavaScript', () => {
    const html = renderToStaticMarkup(
      <Tabs
        items={[]}
        lang="da"
        requestPath="/da/"
        staticSearch={true}
      />
    );

    expect(html).toContain(
      '<a aria-label="Søg i Kalliope" href="/da/search/dk?query="'
    );
  });
});
