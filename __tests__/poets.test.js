import { isKnownPoetLanguage } from '../tools/build-static/poets.js';

describe('poet language validation', () => {
  it('allows Ancient Greek text language', () => {
    expect(isKnownPoetLanguage('grc')).toBe(true);
  });

  it('allows Dutch poet language', () => {
    expect(isKnownPoetLanguage('nl')).toBe(true);
  });

  it.each(['is', 'cs'])('allows imported poet language %s', language => {
    expect(isKnownPoetLanguage(language)).toBe(true);
  });

  it('rejects unknown language codes', () => {
    expect(isKnownPoetLanguage('zz')).toBe(false);
  });
});
