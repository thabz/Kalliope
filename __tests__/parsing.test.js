import { DOMParser } from '@xmldom/xmldom';
import {
  countHeadingFootnotes,
  effectiveTextTitles,
  extractSubtitles,
  extractTitle,
  stripTitleNotes,
  titleText,
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

  it('bevarer titlens fodnote til digtvisningen, men kan strippe den', () => {
    const doc = new DOMParser().parseFromString(
      '<head><title><w>Gravsang</w><footnote>Kildens note.</footnote></title></head>',
      'text/xml'
    );
    const title = extractTitle(doc.documentElement, 'title');

    expect(title.title).toBe(
      '<w>Gravsang</w><footnote>Kildens note.</footnote>'
    );
    expect(stripTitleNotes(title).title).toBe('<w>Gravsang</w>');
    expect(titleText(title)).toBe('Gravsang');
  });

  it('bevarer fodnoter i undertitler og deres linjer', () => {
    const doc = new DOMParser().parseFromString(
      '<head><title>Titel<footnote>Titelnote.</footnote></title>' +
        '<subtitle><line>Første<footnote>Linjenote.</footnote></line>' +
        '<line>Anden</line></subtitle></head>',
      'text/xml'
    );

    const subtitles = extractSubtitles(doc.documentElement, 'subtitle', {});
    expect(subtitles).toHaveLength(2);
    expect(subtitles[0][0][0]).toContain(
      'Første<footnote>Linjenote.</footnote>'
    );
    expect(countHeadingFootnotes(doc.documentElement)).toBe(2);
  });
});
