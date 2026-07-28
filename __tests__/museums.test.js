import { DOMParser } from '@xmldom/xmldom';

import { museumsByCountry } from '../pages/museums.js';
import { build_museum_url } from '../tools/build-static/museums.js';
import {
  getElementsByTagName,
  loadXMLDoc,
  safeGetText,
} from '../tools/build-static/xml.js';

const picture = attributes =>
  new DOMParser().parseFromString(`<picture ${attributes}/>`, 'text/xml')
    .documentElement;

const collected = deepLink => ({
  museums: new Map([['museum', { deepLink }]]),
});

describe('museum groups', () => {
  it('sorts countries and museums predictably', () => {
    const museums = [
      { id: 'b', sortName: 'Beta', country: 'dk' },
      { id: 'a', sortName: 'Alpha', country: 'dk' },
      { id: 'c', sortName: 'Gamma', country: 'de' },
    ];

    expect(museumsByCountry(museums, 'da')).toEqual([
      {
        title: 'Danmark',
        items: [
          { id: 'a', sortName: 'Alpha', country: 'dk' },
          { id: 'b', sortName: 'Beta', country: 'dk' },
        ],
      },
      {
        title: 'Tyskland',
        items: [{ id: 'c', sortName: 'Gamma', country: 'de' }],
      },
    ]);
  });

  it('places missing metadata in an explicit group', () => {
    const museums = [{ id: 'x', sortName: 'Ukendt museum', country: null }];
    expect(museumsByCountry(museums, 'en')[0].title).toBe('Unknown country');
  });

  it('has country metadata for every registered museum', () => {
    const doc = loadXMLDoc('content/museums.xml');
    const museums = getElementsByTagName(doc, 'museum');

    museums.forEach((museum) => {
      expect(safeGetText(museum, 'country')).not.toBeNull();
    });
  });
});

describe('museum links', () => {
  it('builds links from the identifier required by the template', () => {
    expect(
      build_museum_url(
        picture('museum="museum" objid="work-slug" invnr="123"'),
        collected('https://example.com/works/${objId}'),
      ),
    ).toBe('https://example.com/works/work-slug');
  });

  it('omits links when the identifier required by the template is missing', () => {
    expect(
      build_museum_url(
        picture('museum="museum" invnr="123"'),
        collected('https://example.com/works/${objId}'),
      ),
    ).toBeNull();
  });
});
