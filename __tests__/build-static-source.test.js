import { buildWorkSourceMetadata } from '../tools/build-static/work-metadata.js';
import { DOMParser } from '@xmldom/xmldom';
import fs from 'fs';
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

  it('defaults to udg. af and uses red. af only for type="editor"', () => {
    const source = reference('<source><title>Antologi</title><editor type="editor" id="a">A</editor><editor type="editor">B</editor></source>', null, new Map([['a', {}]]));
    expect(source.source).toBe('<i>Antologi</i>, red. af <a poet="a">A</a> og B.');
    expect(source.bibliography.editors).toEqual([
      { name: 'A', id: 'a', type: 'editor' }, { name: 'B', type: 'editor' },
    ]);
    expect(reference('<source><title>Digte</title><editor>A</editor></source>').source)
      .toBe('<i>Digte</i>, udg. af A.');
    expect(reference('<source><title>Digte</title><editor>A</editor><editor type="editor">B</editor><editor>C</editor><translator>D</translator></source>').source)
      .toBe('<i>Digte</i>, udg. af A og C, red. af B, overs. af D.');
    expect(reference('<source><title>Digte</title><editor type="editor">B</editor><editor>A</editor></source>').source)
      .toBe('<i>Digte</i>, red. af B, udg. af A.');
    expect(reference('<source pages="7"/>', source)).toEqual(source);
  });

  it('supports anonymous, undated sources, translators, edition, volume and uncertain years', () => {
    expect(reference('<source><title>Antologi</title></source>')).toEqual({
      source: '<i>Antologi</i>.', bibliography: { title: 'Antologi' },
    });
    expect(reference('<source><title>Digte</title><translator>En oversætter</translator><edition>Anden Udgave</edition><volume>2</volume><year>[1804]</year></source>').source)
      .toBe('<i>Digte</i>, overs. af En oversætter, Anden Udgave, bind 2, [1804].');
  });

  it('shows the title year in italics and the bracketed publication year at the end', () => {
    const result = reference(`<source>
      <title>Nytaarsgave</title><editor>Simon Poulsen</editor>
      <place>Kiøbenhavn</place><publisher>Simon Poulsen</publisher><printer>P. Poulsen</printer>
      <year>1802</year><publication-year>1801</publication-year>
    </source>`, null, new Map());
    expect(result.source).toBe(
      '<i>Nytaarsgave. 1802</i>, udg. af Simon Poulsen, Kiøbenhavn: Simon Poulsen, [1801].'
    );
    expect(result.bibliography).toMatchObject({ year: '1802', 'publication-year': '1801' });
  });

  it('leaves the existing display unchanged without publication-year', () => {
    expect(reference('<source><title>Digte</title><editor>A</editor><place>København</place><publisher>Forlaget</publisher><year>[1801]</year></source>').source)
      .toBe('<i>Digte</i>, udg. af A, København: Forlaget, [1801].');
    expect(reference('<source><title>Digte</title><year>1802</year></source>').source)
      .toBe('<i>Digte</i>, 1802.');
  });

  it('does not repeat a year that is already part of the title', () => {
    expect(reference('<source><title>Nytaarsgave 1802</title><year>1802</year><publication-year>1801</publication-year></source>').source)
      .toBe('<i>Nytaarsgave 1802</i>, [1801].');
    expect(reference('<source><title>1802: Nytaarsgave</title><year>1802</year><publication-year>1801</publication-year></source>').source)
      .toBe('<i>1802: Nytaarsgave</i>, [1801].');
    expect(reference('<source><title>18020</title><year>1802</year><publication-year>1801</publication-year></source>').source)
      .toBe('<i>18020. 1802</i>, [1801].');
    expect(reference('<source><title>Nytaarsgave.</title><year>1802</year><publication-year>1801</publication-year></source>').source)
      .toBe('<i>Nytaarsgave. 1802</i>, [1801].');
  });

  it('inherits publication-year together with the selected bibliography', () => {
    const inherited = reference('<source><title>Bogen</title><year>1802</year><publication-year>1801</publication-year></source>');
    expect(reference('<source pages="7"/>', inherited)).toEqual(inherited);
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
    '<source><title>Titel</title><editor type="edition">A</editor></source>',
    '<source><title>Titel</title><editor type="">A</editor></source>',
    '<source><title>Titel</title><translator type="editor">A</translator></source>',
    '<source><title>Titel</title><publication-year/></source>',
    '<source><title>Titel</title><publication-year>[1801]</publication-year></source>',
    '<source><title>Titel</title><year>[1802]</year><publication-year>1801</publication-year></source>',
    '<source><title>Titel</title><publication-year>1801</publication-year><publication-year>1802</publication-year></source>',
  ])('rejects invalid structured bibliography: %s', xml => {
    expect(() => reference(xml)).toThrow();
  });
});


describe('work source metadata before output and caching', () => {
  it.each([
    [
      'fdirs/antologierdk/1802-nytaarsgave.xml',
      '<i>Nytaarsgave. 1802</i>, udg. af Simon Poulsen, Kiøbenhavn: Simon Poulsen, [1801].',
      '1802', '1801',
    ],
    [
      'fdirs/oehlenschlaeger/1803.xml',
      'Adam Oehlenschläger: <i>Digte. 1803</i>, Kbh.: Fr. Brummers Forlag, [1802].',
      '1803', '1802',
    ],
    [
      'fdirs/winther/1856.xml',
      'Christian Winther: <i>Hjortens Flugt. 1856</i>, Kbh.: C. A. Reitzel, [1855].',
      '1856', '1855',
    ],
    [
      'fdirs/antologierdk/1802-charis.xml',
      '<i>Charis for 1802</i>, red. af Knud Lyne Rahbek, Kiöbenhavn: J. F. Schultz, [1801].',
      '1802', '1801',
    ],
    [
      'fdirs/antologierdk/1804-charis.xml',
      '<i>Charis for 1804</i>, red. af Knud Lyne Rahbek, Kiöbenhavn: J. F. Schultz, [1803].',
      '1804', '1803',
    ],
    [
      'fdirs/antologierdk/1805-nytaarsgave.xml',
      '<i>Nytaarsgave. 1805</i>, udg. af Simon Poulsen, Kiøbenhavn: S. Poulsen, [1804].',
      '1805', '1804',
    ],
    [
      'fdirs/antologierdk/1807-nytaarsgave.xml',
      '<i>Nytaarsgave. 1807</i>, udg. af Simon Poulsen, Udgiveren, [1806].',
      '1807', '1806',
    ],
    [
      'fdirs/antologierdk/1846-gaea.xml',
      '<i>Gæa. 1846</i>, red. af P. L. Møller, Kjøbenhavn: Udgiverens Forlag, [1845].',
      '1846', '1845',
    ],
  ])('renders the documented citation from %s', (filename, source, year, publicationYear) => {
    const work = new DOMParser().parseFromString(fs.readFileSync(filename, 'utf8'), 'text/xml').documentElement;
    const { sources } = buildWorkSourceMetadata(work, new Map(), filename);
    expect(sources.default.source).toBe(source);
    expect(sources.default.bibliography).toMatchObject({ year, 'publication-year': publicationYear });
  });

  it.each([false, true])('keeps errata sources separate unless also used by a text (%s)', usedByText => {
    const work = new DOMParser().parseFromString(`
      <kalliopework><workhead>
        <source><title>Bind I</title></source>
        <source id="corrections"><title>Bind III</title></source>
        <errata status="reviewed" in="corrections"/>
      </workhead><workbody>
        ${usedByText === true ? '<text><head><source in="corrections"/></head></text>' : ''}
      </workbody></kalliopework>`, 'text/xml').documentElement;
    const { sources } = buildWorkSourceMetadata(work, new Map(), 'test.xml');
    expect(sources.default.errataOnly).toBeUndefined();
    expect(sources.corrections.errataOnly === true).toBe(usedByText === false);
  });

  it('preserves identifiers and facsimile metadata through JSON cache serialization', () => {
    const work = new DOMParser().parseFromString(`
      <kalliopework><workhead>
        <title>Digte</title><identifiers><wikidata>Q123</wikidata></identifiers>
        <source id="edition" facsimile="scan.pdf" facsimile-pages-num="20" facsimile-pages-offset="2">
          <title>Samlede Digte</title><year>1900</year>
          <identifiers><kb-alma>123456</kb-alma></identifiers>
        </source>
      </workhead></kalliopework>`, 'text/xml').documentElement;
    const metadata = buildWorkSourceMetadata(work, new Map(), 'fdirs/poet/1900.xml');
    const cached = JSON.parse(JSON.stringify(metadata));
    expect(cached).toMatchObject({
      identifiers: { wikidata: 'Q123' },
      sources: { edition: {
        identifiers: { 'kb-alma': '123456' },
        facsimile: 'scan', facsimilePageCount: 20, facsimilePagesOffset: 2,
      } },
    });
    expect(cached.sources.edition.source).toContain('Samlede Digte');
  });
});
