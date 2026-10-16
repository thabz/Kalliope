import { buildTextAliasRedirects } from '../tools/build-static/textaliases.js';
import { supportedLanguages } from '../common/languages.js';

describe('tekstaliases efter antologimigrering', () => {
  it('bevarer eksplicitte aliases og opretter ingen automatiske a-redirects', () => {
    const redirects = {};
    buildTextAliasRedirects(redirects, new Map([
      ['canonical', { id: 'canonical', aliases: ['old'], sourcePoetId: 'anthology' }],
      ['historicala', { id: 'historicala', aliases: [] }],
    ]));
    expect(Object.keys(redirects)).toHaveLength(supportedLanguages.length);
    supportedLanguages.forEach(lang => {
      expect(redirects[`/${lang}/text/old`]).toBe(`/${lang}/text/canonical`);
      expect(redirects[`/${lang}/text/canonicala`]).toBeUndefined();
      expect(redirects[`/${lang}/text/historicala`]).toBeUndefined();
    });
  });

  it('afviser aliases som kolliderer med en kanonisk tekst', () => {
    expect(() => buildTextAliasRedirects({}, new Map([
      ['one', { id: 'one', aliases: ['two'] }],
      ['two', { id: 'two' }],
    ]))).toThrow('conflicts');
  });
});
