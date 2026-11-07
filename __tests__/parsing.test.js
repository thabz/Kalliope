import { DOMParser } from '@xmldom/xmldom';
jest.mock('../tools/build-static/image.js', () => ({
  imageSizeSync: jest.fn(async () => ({ width: 100, height: 80 })),
}));
import {
  countHeadingFootnotes,
  effectiveTextTitles,
  extractSubtitles,
  extractTitle,
  get_picture,
  stripTitleNotes,
  titleText,
} from '../tools/build-static/parsing.js';

describe('artwork references', () => {
  const artist = { id: 'roed', name: { firstname: 'Jørgen', lastname: 'Roed' } };
  const collected = {
    poets: new Map([[artist.id, artist]]),
    museums: new Map(),
    artwork: new Map([['roed/kingo', {
      artistId: artist.id,
      src: '/images/roed/kingo.jpg',
      year: '1869',
      clipPath: 'ellipse(31% 33% at 49.5% 51%)',
      content_html: [['Thomas Kingo']],
    }]]),
  };

  it.each([
    ['<picture artwork="roed/kingo" primary="true"/>', '1869'],
    ['<picture artwork="roed/kingo" primary="true" year="1870"/>', '1870'],
  ])('preserves the artist and inherits the year unless overridden (%s)', async (xml, year) => {
    const node = new DOMParser().parseFromString(xml, 'text/xml').documentElement;
    const picture = await get_picture(node, '/images/kingo', collected, message => {
      throw new Error(message);
    });
    expect(picture).toMatchObject({
      artist, year, primary: true, src: '/images/roed/kingo.jpg',
      clipPath: 'ellipse(31% 33% at 49.5% 51%)',
    });
  });

  it('allows a reference to override the artwork mask', async () => {
    const node = new DOMParser().parseFromString(
      '<picture artwork="roed/kingo" clip-path="circle(40%)"/>', 'text/xml',
    ).documentElement;
    const picture = await get_picture(node, '/images/kingo', collected, message => {
      throw new Error(message);
    });
    expect(picture.clipPath).toBe('circle(40%)');
  });
});

describe('picture captions', () => {
  it('keeps XML indentation out of rendered captions and picture notes', async () => {
    const document = new DOMParser().parseFromString(`
      <picture src="krager.jpg">
        <description>
          O. A. Hermansen: <i>Krageflokke</i>, 1882.
        </description>
        <picture-note>
          Trykt i <i>Ude og Hjemme</i>.
        </picture-note>
      </picture>
    `, 'text/xml');
    const picture = await get_picture(
      document.documentElement,
      '/images/kunst',
      { museums: new Map() },
      message => { throw new Error(message); },
    );

    expect(picture.content_html.map(([line]) => line)).toEqual([
      'O. A. Hermansen: <i>Krageflokke</i>, 1882.',
    ]);
    expect(picture.note_html.map(([line]) => line)).toEqual([
      'Trykt i <i>Ude og Hjemme</i>.',
    ]);
  });
});

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
      '<head><title>Gravsang<footnote>Kildens note.</footnote></title></head>',
      'text/xml'
    );
    const title = extractTitle(doc.documentElement, 'title');

    expect(title.title).toBe(
      'Gravsang<footnote>Kildens note.</footnote>'
    );
    expect(stripTitleNotes(title).title).toBe('Gravsang');
    expect(titleText(title)).toBe('Gravsang');
  });

  it('bevarer forkortelsesstreger i titlers rene tekst', () => {
    const title = { title: 'Dan k<o>o</o>ning <o>ſ</o>øn' };

    expect(titleText(title)).toBe('Dan kōning ſ\u0304øn');
    expect(title.title).toBe('Dan k<o>o</o>ning <o>ſ</o>øn');
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
