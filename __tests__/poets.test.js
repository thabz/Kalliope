import { isKnownPoetLanguage } from '../tools/build-static/poets.js';

describe('poet language validation', () => {
  it('allows Ancient Greek text language', () => {
    expect(isKnownPoetLanguage('grc')).toBe(true);
  });

  it('rejects unknown language codes', () => {
    expect(isKnownPoetLanguage('zz')).toBe(false);
  });
});
