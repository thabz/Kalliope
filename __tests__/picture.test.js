import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ResponsivePicture } from '../components/picture.js';

describe('responsive pictures', () => {
  it('forwards lazy loading to the fallback image', () => {
    const html = renderToStaticMarkup(
      <ResponsivePicture src="/images/about/poet.jpg" loading="lazy" />
    );

    expect(html).toContain('loading="lazy"');
  });
});
