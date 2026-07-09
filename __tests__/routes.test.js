import { matchRoute } from '../routes.js';

describe('routes', () => {
  it('matches the localized front page', () => {
    expect(matchRoute('/da/')).toEqual({
      page: '/',
      query: { lang: 'da' },
    });
    expect(matchRoute('/en')).toEqual({
      page: '/',
      query: { lang: 'en' },
    });
    expect(matchRoute('/fr/')).toEqual({
      page: '/',
      query: { lang: 'fr' },
    });
    expect(matchRoute('/de')).toEqual({
      page: '/',
      query: { lang: 'de' },
    });
  });

  it('matches poet listing routes', () => {
    expect(matchRoute('/da/poets/dk/name')).toEqual({
      page: '/poets',
      query: { lang: 'da', country: 'dk', groupBy: 'name' },
    });
    expect(matchRoute('/da/poets/se/looks')).toEqual({
      page: '/poets-looks',
      query: { lang: 'da', country: 'se', groupBy: 'looks' },
    });
  });

  it('matches text listing routes', () => {
    expect(matchRoute('/da/texts/krossing/titles')).toEqual({
      page: '/texts',
      query: { lang: 'da', poetId: 'krossing', type: 'titles' },
    });
    expect(matchRoute('/en/texts/dk/titles/A')).toEqual({
      page: '/alltexts',
      query: { lang: 'en', country: 'dk', type: 'titles', letter: 'A' },
    });
  });

  it('matches detail routes', () => {
    expect(matchRoute('/da/work/aarestrup/1838')).toEqual({
      page: '/work',
      query: { lang: 'da', poetId: 'aarestrup', workId: '1838' },
    });
    expect(matchRoute('/da/text/aarestrup1838010201')).toEqual({
      page: '/text',
      query: { lang: 'da', textId: 'aarestrup1838010201' },
    });
    expect(matchRoute('/da/museum/smk')).toEqual({
      page: '/museum',
      query: { lang: 'da', museumId: 'smk' },
    });
  });

  it('matches search routes', () => {
    expect(matchRoute('/da/search/dk')).toEqual({
      page: '/search',
      query: { lang: 'da', country: 'dk' },
    });
    expect(matchRoute('/da/search/dk/aarestrup')).toEqual({
      page: '/search',
      query: { lang: 'da', country: 'dk', poetId: 'aarestrup' },
    });
  });

  it('decodes path parameters and rejects unknown routes', () => {
    expect(matchRoute('/da/keyword/%C3%A6re')).toEqual({
      page: '/keyword',
      query: { lang: 'da', keywordId: 'ære' },
    });
    expect(matchRoute('/es/text/aarestrup1838010201')).toBe(null);
  });
});
