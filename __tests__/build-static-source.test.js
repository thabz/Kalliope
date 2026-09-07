import { DOMParser } from '@xmldom/xmldom';
import {
  collectSourceDigitalUrl,
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
