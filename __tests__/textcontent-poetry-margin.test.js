import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TextContent from '../components/textcontent.js';

describe('poetry margin labels', () => {
  it('renders speaker emphasis and the verse as separate text', () => {
    const html = renderToStaticMarkup(
      <TextContent type="poetry" contentHtml={[
        ['Hvad giør du liden Turteldue der?', { num: 1, margin: '<w>Vand.</w>' }],
        ['Jeg sukker.', { num: 2, margin: '<w>Duen.</w>' }],
      ]} />
    );

    expect(html).toContain('<span class="poem-margin-text"><i>Vand.</i></span>');
    expect(html).toContain('<span class="poem-margin-text"><i>Duen.</i></span>');
    expect(html).toContain('Hvad giør du liden Turteldue der?');
    expect(html).not.toContain('&lt;w&gt;');
  });

  it('keeps verse numbers in their existing display field', () => {
    const html = renderToStaticMarkup(
      <TextContent type="poetry" contentHtml={[
        ['Femte vers', { num: 5, displayNum: 5 }],
      ]} />
    );

    expect(html).toContain('data-num="5"');
    expect(html).not.toContain('<span class="poem-margin-text">');
  });
});
