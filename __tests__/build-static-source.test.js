import { DOMParser } from '@xmldom/xmldom';
import {
  collectSourceDigitalUrl,
  resolveSourceDigitalUrl,
  resolveSourceDigitalUrlForText,
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
});
