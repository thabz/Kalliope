import {
  primaryTextVariantId,
  resolve_variants,
} from '../tools/build-static/variants.js';

describe('variant resolution helpers', () => {
  const collected = {
    variants: new Map([
      ['a', ['b']],
      ['b', ['a', 'c']],
      ['c', ['b']],
    ]),
    texts: new Map([
      ['a', { poetId: 'p1', workId: 'w1' }],
      ['b', { poetId: 'p2', workId: 'w2' }],
      ['c', { poetId: 'p3', workId: 'w3' }],
    ]),
    works: new Map([
      ['p1/w1', { year: '1818' }],
      ['p2/w2', { year: '1820' }],
      ['p3/w3', { year: '1822' }],
    ]),
  };

  it('resolves a variant chain and sorts by work year', () => {
    expect(resolve_variants('a', collected)).toEqual(['a', 'b', 'c']);
  });

  it('prioritizes text composition and publication dates over work dates', () => {
    const dated = {
      variants: new Map([
        ['dated-a', ['dated-b', 'dated-c']],
        ['dated-b', ['dated-a']],
        ['dated-c', ['dated-a']],
      ]),
      texts: new Map([
        [
          'dated-a',
          { poetId: 'p1', workId: 'late', dates: { written: '1810-01-01' } },
        ],
        [
          'dated-b',
          {
            poetId: 'p1',
            workId: 'early',
            dates: { published: '1812-01-01' },
          },
        ],
        ['dated-c', { poetId: 'p1', workId: 'middle', dates: {} }],
      ]),
      works: new Map([
        ['p1/late', { year: '1900', published: '1900' }],
        ['p1/early', { year: '1800', published: '1800' }],
        ['p1/middle', { year: '1815', published: '1815' }],
      ]),
    };

    expect(resolve_variants('dated-a', dated)).toEqual([
      'dated-a',
      'dated-b',
      'dated-c',
    ]);
  });

  it('places undated variants after dated variants', () => {
    const partlyDated = {
      variants: new Map([
        ['undated-a', ['undated-b']],
        ['undated-b', ['undated-a']],
      ]),
      texts: new Map([
        ['undated-a', { poetId: 'p1', workId: 'unknown' }],
        ['undated-b', { poetId: 'p1', workId: 'known' }],
      ]),
      works: new Map([
        ['p1/unknown', { year: null }],
        ['p1/known', { year: '1815' }],
      ]),
    };

    expect(resolve_variants('undated-a', partlyDated)).toEqual([
      'undated-b',
      'undated-a',
    ]);
  });

  it('returns the primary variant id', () => {
    expect(primaryTextVariantId('a', collected)).toBe('a');
    expect(primaryTextVariantId('b', collected)).toBe('a');
    expect(primaryTextVariantId('c', collected)).toBe('a');
  });

  it('returns null for texts without variants', () => {
    expect(resolve_variants('z', collected)).toBeNull();
    expect(primaryTextVariantId('z', {
      ...collected,
      variants: new Map(),
    })).toBe('z');
  });

  it('rejects null ids', () => {
    expect(() => resolve_variants(null, collected)).toThrow(
      'function resolve_variants called with null poemId.'
    );
    expect(() => primaryTextVariantId(null, collected)).toThrow(
      'function primaryTextVariantId called with textId "null".'
    );
  });
});
