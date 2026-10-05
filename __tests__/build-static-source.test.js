import { DOMParser } from '@xmldom/xmldom';
import {
  collectSourceDigitalUrl,
  parseSourceBibliography,
  formatSourceBibliography,
  resolveSourceReference,
  resolveSourceDigitalUrl,
  resolveSourceDigitalUrlForText,
  resolveSourceFacsimileForText,
} from '../tools/build-static/source.js';

describe('source digital URL helpers', () => {
  const parseSource = (sourceXml) => {
    const doc = new DOMParser().parseFromString(`<root>${sourceXml}</root>`, 'text/xml');
    return doc.getElementsByTagName('source')[0];
  };

  it('reads explicit href from source node', () => {
    const sourceNode = parseSource('<source href="https://example.com">Kilde</source>');

    expect(collectSourceDigitalUrl(sourceNode)).toBe('https://example.com');
    expect(resolveSourceDigitalUrl({ sourceNode, inheritedDigitalUrl: 'https://inherited.com' })).toBe(
      'https://example.com'
    );
  });

  it('builds a KB digital permalink from kb-alma when href is absent', () => {
    const sourceNode = parseSource(
      '<source><identifiers><kb-alma>99125466878705763</kb-alma></identifiers>Kilde</source>'
    );

    expect(collectSourceDigitalUrl(sourceNode)).toBe(
      'https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99125466878705763'
    );
    expect(resolveSourceDigitalUrl({ sourceNode })).toBe(
      'https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99125466878705763'
    );
  });

  it('prefers an explicit href over a kb-alma permalink', () => {
    const sourceNode = parseSource(
      '<source href="https://example.com"><identifiers><kb-alma>99125466878705763</kb-alma></identifiers>Kilde</source>'
    );

    expect(collectSourceDigitalUrl(sourceNode)).toBe('https://example.com');
    expect(resolveSourceDigitalUrl({ sourceNode })).toBe('https://example.com');
  });

  it('uses inherited source-url when source node lacks explicit href', () => {
    const sourceNode = parseSource('<source>Kilde</source>');

    expect(resolveSourceDigitalUrlForText({
      sourceNode,
      sourceForText: { digitalUrl: 'https://inherited.com' },
    })).toBe('https://inherited.com');
  });

  it('does not override explicit source-url even when inherited has a better URL', () => {
    const sourceNode = parseSource(
      '<source href="https://example.org/facsimile.pdf">Kilde</source>'
    );

    expect(
      resolveSourceDigitalUrlForText({
        sourceNode,
        sourceForText: { digitalUrl: 'https://www.rexlibris.kb.dk/ma/123' },
      })
    ).toBe('https://example.org/facsimile.pdf');
  });

  it('prefers a REX URL over a direct PDF fallback', () => {
    expect(
      resolveSourceDigitalUrl({
        sourceNode: null,
        inheritedDigitalUrl: [
          'https://example.org/facsimile.pdf',
          'https://www.rexlibris.kb.dk/ma/123',
        ],
      })
    ).toBe('https://www.rexlibris.kb.dk/ma/123');
  });

  it('returns null when no url is available', () => {
    const sourceNode = parseSource('<source>Kilde</source>');

    expect(resolveSourceDigitalUrlForText({ sourceNode })).toBeNull();
  });

  it('reads self-contained facsimile metadata from a text source', () => {
    const sourceNode = parseSource(
      '<source facsimile="scan.pdf" facsimile-pages-num="48" facsimile-pages-offset="2">Kilde</source>'
    );

    expect(resolveSourceFacsimileForText({ sourceNode })).toEqual({
      facsimile: 'scan',
      facsimilePageCount: 48,
      facsimilePagesOffset: 2,
    });
  });

  it('inherits facsimile metadata when the text source does not override it', () => {
    const sourceNode = parseSource('<source pages="7-8"/>');

    expect(
      resolveSourceFacsimileForText({
        sourceNode,
        sourceForText: {
          facsimile: 'inherited',
          facsimilePageCount: 60,
          facsimilePagesOffset: 4,
        },
      })
    ).toEqual({
      facsimile: 'inherited',
      facsimilePageCount: 60,
      facsimilePagesOffset: 4,
    });
  });
});


describe('structured bibliographic sources', () => {
  const parse = xml => new DOMParser().parseFromString(xml, 'text/xml').documentElement;
  const reference = (xml, inheritedSource, poets) => resolveSourceReference({
    sourceNode: parse(xml), inheritedSource, poets,
  });

  it('formats the issue example centrally and preserves bibliographic names in person links', () => {
    const xml = `<source>
      <author id="heiberg">Peter Andreas Heiberg</author><title>Udvalgte Skrifter</title>
      <editor id="borchsenius">Otto Borchsenius</editor><editor id="winkel-horn">Fr. Winkel Horn</editor>
      <place>København</place><publisher>Otto B. Wroblewskys Forlag</publisher><year>1884</year>
    </source>`;
    const parsed = parseSourceBibliography(parse(xml));
    expect(formatSourceBibliography(parsed)).toBe(
      'Peter Andreas Heiberg: <i>Udvalgte Skrifter</i>, udg. af Otto Borchsenius og Fr. Winkel Horn, København: Otto B. Wroblewskys Forlag, 1884.'
    );
    const result = reference(xml, null, new Map([['heiberg', {}], ['borchsenius', {}]]));
    expect(result.source).toContain('<a poet="heiberg">Peter Andreas Heiberg</a>');
    expect(result.source).toContain('<a poet="borchsenius">Otto Borchsenius</a> og Fr. Winkel Horn');
    expect(result.bibliography.editors).toHaveLength(2);
  });

  it('supports anonymous, undated sources, translators, edition, volume and uncertain years', () => {
    expect(reference('<source><title>Antologi</title></source>')).toEqual({
      source: '<i>Antologi</i>.', bibliography: { title: 'Antologi' },
    });
    expect(reference('<source><title>Digte</title><translator>En oversætter</translator><edition>Anden Udgave</edition><volume>2</volume><year>[1804]</year></source>').source)
      .toBe('<i>Digte</i>, overs. af En oversætter, Anden Udgave, bind 2, [1804].');
  });

  it('keeps printers in data but displays them only when there is no publisher', () => {
    const result = reference('<source><title>Digte</title><place>København</place><publisher>Forlaget</publisher><printer>Trykkeriet</printer></source>');
    expect(result.source).toBe('<i>Digte</i>, København: Forlaget.');
    expect(result.bibliography.printer).toBe('Trykkeriet');
    expect(reference('<source><title>Digte</title><place>København</place><printer>Trykkeriet</printer><year>1798</year></source>').source)
      .toBe('<i>Digte</i>, København: trykt hos Trykkeriet, 1798.');
    expect(reference('<source><title>Digte</title><printer>Trykkeriet</printer></source>').source)
      .toBe('<i>Digte</i>, trykt hos Trykkeriet.');
  });

  it('inherits the selected bibliography and replaces it as a whole for text overrides', () => {
    const inherited = reference('<source><title>Bogen</title><publisher>Forlaget</publisher></source>');
    expect(reference('<source in="bd2" pages="7-8"/>', inherited)).toEqual(inherited);
    expect(reference('<source pages="7"><title>Anden bog</title></source>', inherited))
      .toEqual({ source: '<i>Anden bog</i>.', bibliography: { title: 'Anden bog' } });
    expect(reference('<source pages="7">Gammel <i>fritekst</i></source>', inherited))
      .toEqual({ source: 'Gammel <i>fritekst</i>' });
    expect(reference('<source><identifiers><kb-alma>123</kb-alma></identifiers></source>', inherited))
      .toEqual(inherited);
  });

  it('escapes bibliographic text and IDs without creating markup from input', () => {
    const result = reference('<source><author id="a&amp;b">A &amp; B</author><title>&lt;i&gt; &amp; C</title></source>', null, new Map([['a&b', {}]]));
    expect(result.source).toBe('<a poet="a&amp;b">A &amp; B</a>: <i>&lt;i&gt; &amp; C</i>.');
  });

  it.each([
    '<source><title/></source>', '<source><title>  </title></source>',
    '<source><editor>Redaktør</editor></source>',
    '<source>Fritekst<title>Titel</title></source>',
    '<source><title>Titel</title><title>Anden titel</title></source>',
    '<source><title>Titel</title><publisher/></source>',
    '<source><title>Titel</title><note>Forklaring</note></source>',
    '<source><title><i>Titel</i></title></source>',
  ])('rejects invalid structured bibliography: %s', xml => {
    expect(() => reference(xml)).toThrow();
  });
});
