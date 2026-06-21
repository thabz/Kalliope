const {
  primaryTextVariantId,
  resolve_variants,
} = require('../tools/build-static/variants.js');

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
