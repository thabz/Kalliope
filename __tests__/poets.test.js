import {
  isKnownPoetLanguage,
  isVisiblePoet,
} from '../tools/build-static/poets.js';

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

describe('hidden poet metadata', () => {
  it('hides only poets explicitly marked hidden', () => {
    expect(isVisiblePoet({ hidden: true })).toBe(false);
    expect(isVisiblePoet({ hidden: false })).toBe(true);
    expect(isVisiblePoet({})).toBe(true);
  });
});
