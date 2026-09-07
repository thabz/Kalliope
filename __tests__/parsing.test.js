import { DOMParser } from '@xmldom/xmldom';
import {
  effectiveTextTitles,
  extractTitle,
} from '../tools/build-static/parsing.js';

describe('titeludtrækning', () => {
  it('fjerner et tomt nummerfelt fra en indholdsfortegnelsestitel', () => {
    const doc = new DOMParser().parseFromString(
      '<head><toctitle><num></num>Korset og Kronen</toctitle></head>',
      'text/xml'
    );

    expect(extractTitle(doc.documentElement, 'toctitle')).toEqual({
      title: 'Korset og Kronen',
    });
  });

  it('bruger indextitle som fallback for linktitle', () => {
    const firstline = { title: 'Førstelinje' };
    const title = { title: 'Titel' };
    const indextitle = { title: 'Indekstitel' };

    expect(
      effectiveTextTitles({ firstline, title, indextitle, linktitle: null })
    ).toEqual({
      indexTitle: indextitle,
      linkTitle: indextitle,
    });
  });

  it('foretrækker en eksplicit linktitle frem for de øvrige titler', () => {
    const linktitle = { title: 'Linktitel?' };

    expect(
      effectiveTextTitles({
        firstline: { title: 'Førstelinje' },
        title: { title: 'Titel' },
        indextitle: { title: 'Indekstitel' },
        linktitle,
      }).linkTitle
    ).toBe(linktitle);
  });
});
