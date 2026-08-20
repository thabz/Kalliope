import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { sourceLinkLabel } from '../common/source-link.js';
import Source from '../components/source.js';

describe('source link labels', () => {
  it('names Det kongelige Bibliotek for all kb.dk subdomains', () => {
    expect(
      sourceLinkLabel(
        'https://soeg.kb.dk/permalink/45KBDK_KGL/example',
        'da'
      )
    ).toBe('Digital kilde hos Det kongelige Bibliotek');
    expect(sourceLinkLabel('https://tekster.kb.dk/example', 'da')).toBe(
      'Digital kilde hos Det kongelige Bibliotek'
    );
  });

  it('uses curated names for other known collections', () => {
    expect(sourceLinkLabel('https://runeberg.org/dbl/', 'da')).toBe(
      'Digital kilde hos Projekt Runeberg'
    );
    expect(sourceLinkLabel('https://archive.org/details/example', 'da')).toBe(
      'Digital kilde hos Internet Archive'
    );
    expect(sourceLinkLabel('https://grundtvigsværker.dk/example', 'da')).toBe(
      'Digital kilde hos Grundtvigs Værker'
    );
  });

  it('uses a clean hostname for an unknown provider', () => {
    expect(sourceLinkLabel('https://www.example.org/source', 'da')).toBe(
      'Digital kilde hos example.org'
    );
  });

  it('retains the generic label for an invalid URL', () => {
    expect(sourceLinkLabel('not a URL', 'da')).toBe('Digital kilde');
  });

  it('translates the label and the library name', () => {
    expect(sourceLinkLabel('https://www.kb.dk/', 'en')).toBe(
      'Digital source at The Royal Danish Library'
    );
  });

  it('uses the provider label in the tooltip and accessible link name', () => {
    const html = renderToStaticMarkup(
      <Source href="https://soeg.kb.dk/permalink/example" lang="da" />
    );

    expect(html).toContain(
      'data-tooltip="Digital kilde hos Det kongelige Bibliotek"'
    );
    expect(html).toContain(
      'aria-label="Digital kilde hos Det kongelige Bibliotek"'
    );
  });
});
