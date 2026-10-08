import { isKnownPoetLanguage, parsePoetNationality } from '../tools/build-static/poets.js';

describe('poet language validation', () => {
  it('allows Ancient Greek text language', () => {
    expect(isKnownPoetLanguage('grc')).toBe(true);
  });

  it('allows Dutch poet language', () => {
    expect(isKnownPoetLanguage('nl')).toBe(true);
  });

  it('rejects unknown language codes', () => {
    expect(isKnownPoetLanguage('zz')).toBe(false);
  });
});

describe('poet nationality validation', () => {
  it('accepts a supported nationality and preserves a missing optional nationality', () => {
    expect(parsePoetNationality('runeberg', 'un', 'fi')).toBe('fi');
    expect(parsePoetNationality('kinck', 'no', null)).toBeNull();
  });

  it.each([null, '', ' ', 'un', 'xx', 'FI', 'constructor'])(
    'rejects unsupported or missing nationality %s for country="un"', nationality => {
      expect(() => parsePoetNationality('runeberg', 'un', nationality))
        .toThrow('runeberg');
    }
  );

  it('rejects an invalid explicit nationality even when country has a flag', () => {
    expect(() => parsePoetNationality('kinck', 'no', 'xx')).toThrow('kinck');
  });
});
