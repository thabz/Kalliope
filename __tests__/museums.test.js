import { DOMParser } from '@xmldom/xmldom';

import { build_museum_url } from '../tools/build-static/museums.js';

const picture = attributes =>
  new DOMParser().parseFromString(`<picture ${attributes}/>`, 'text/xml')
    .documentElement;

const collected = deepLink => ({
  museums: new Map([['museum', { deepLink }]]),
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
