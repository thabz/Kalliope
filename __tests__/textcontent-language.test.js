import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TextInline } from '../components/textcontent.js';

describe('text content language markup', () => {
  it('renders a neutral language span with nested italics', () => {
    const html = renderToStaticMarkup(
      <TextInline
        contentHtml={[
          ['Hvis, <span lang="sv"><i>Svenska bror!</i></span> du kom'],
        ]}
      />
    );

    expect(html).toContain(
      'Hvis, <span lang="sv"><i>Svenska bror!</i></span> du kom'
    );
  });

  it('preserves language attributes on italic source text', () => {
    const html = renderToStaticMarkup(
      <TextInline contentHtml={[["<i lang=\"fr\">Très bien</i>"]]} />
    );

    expect(html).toContain('<i lang="fr">Très bien</i>');
  });
});
