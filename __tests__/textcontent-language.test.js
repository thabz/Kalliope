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

  it('renders note citation lines and non-verse labels without raw XML', () => {
    const html = renderToStaticMarkup(
      <TextInline contentHtml={[[
        '<column>    Første vers<br/>Andet vers<br/><nonum><right>Kilden.</right></nonum></column>',
      ]]} />
    );

    expect(html).toContain('white-space:pre-wrap');
    expect(html).toContain('    Første vers<br/>Andet vers<br/>');
    expect(html).toContain('Kilden.');
    expect(html).not.toContain('<code>');
    expect(html).not.toContain('&lt;nonum');
  });

  it('preserves language attributes on italic source text', () => {
    const html = renderToStaticMarkup(
      <TextInline contentHtml={[["<i lang=\"fr\">Très bien</i>"]]} />
    );

    expect(html).toContain('<i lang="fr">Très bien</i>');
  });
});
