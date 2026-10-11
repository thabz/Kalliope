jest.mock('../tools/libs/caching.js', () => ({
  isFileModified: jest.fn(() => false),
  loadCachedJSON: jest.fn(() => null),
  writeCachedJSON: jest.fn(),
}));

import { danishTextCountForKeyword } from '../tools/build-static/keywords.js';

describe('keyword data', () => {
  test('counts unique indexable references in the Danish collection', () => {
    const collected = {
      person_or_keyword_refs: new Map([
        [
          'sonnet',
          {
            mention: ['danish', 'danish', 'foreign', 'hidden', 'unknown'],
            translation: [],
          },
        ],
      ]),
      texts: new Map([
        ['danish', { id: 'danish', poetId: 'aarestrup' }],
        ['foreign', { id: 'foreign', poetId: 'goethe' }],
        [
          'hidden',
          { id: 'hidden', poetId: 'aarestrup', indexable: false },
        ],
      ]),
      poets: new Map([
        ['aarestrup', { id: 'aarestrup', country: 'dk' }],
        ['goethe', { id: 'goethe', country: 'de' }],
      ]),
    };

    expect(danishTextCountForKeyword('sonnet', collected)).toBe(1);
    expect(danishTextCountForKeyword('missing', collected)).toBe(0);
  });
});
