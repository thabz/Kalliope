jest.mock('../tools/libs/caching.js', () => ({
  isFileModified: jest.fn(() => false),
  loadCachedJSON: jest.fn(() => null),
  writeCachedJSON: jest.fn(),
}));

import {
  canonicalKeywordId,
  danishTextCountForKeyword,
} from '../tools/build-static/keywords.js';

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

  test('samler teksthenvisninger fra et kanonisk nøgleord og dets aliaser', () => {
    const keywords = new Map([
      ['blank-verse', { id: 'blank-verse', aliases: ['blankvers'] }],
      ['blankvers', { id: 'blankvers', canonicalId: 'blank-verse' }],
    ]);
    const collected = {
      keywords,
      person_or_keyword_refs: new Map([
        ['blank-verse', { mention: ['first'], translation: [] }],
        ['blankvers', { mention: ['first', 'second'], translation: [] }],
      ]),
      texts: new Map([
        ['first', { id: 'first', poetId: 'aarestrup' }],
        ['second', { id: 'second', poetId: 'aarestrup' }],
      ]),
      poets: new Map([
        ['aarestrup', { id: 'aarestrup', country: 'dk' }],
      ]),
    };

    expect(canonicalKeywordId('blankvers', keywords)).toBe('blank-verse');
    expect(danishTextCountForKeyword('blank-verse', collected)).toBe(2);
  });
});
