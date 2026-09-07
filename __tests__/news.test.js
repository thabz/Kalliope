import { DOMParser } from '@xmldom/xmldom';
import {
  buildLatestNews,
  latestNewsLimit,
} from '../tools/build-static/news.js';
import { latestNewsForDate } from '../common/news.js';

describe('latest news build', () => {
  it('only builds the items needed by the front page', () => {
    const xml = Array.from(
      { length: latestNewsLimit + 2 },
      (_, i) =>
        `<item><date>0${i + 1}-01-2026</date><body>Nyhed ${i + 1}</body></item>`
    ).join('');
    const items = new DOMParser().parseFromString(
      `<items>${xml}</items>`,
      'text/xml'
    ).documentElement;

    const news = buildLatestNews(
      items,
      'da',
      {},
      new Date('2026-09-06T12:00:00Z')
    );

    expect(news).toHaveLength(latestNewsLimit);
    expect(news[0].date).toBe('01-01-2026');
    expect(news[latestNewsLimit - 1].date).toBe('05-01-2026');
  });

  it('includes scheduled items before the five currently published items', () => {
    const published = Array.from(
      { length: latestNewsLimit + 1 },
      (_, index) =>
        `<item><date>0${index + 1}-09-2026</date><title>Nyhed ${index + 1}</title><body>Nyhed ${index + 1}</body></item>`
    ).join('');
    const items = new DOMParser().parseFromString(
      `<items>
        <item><date>13-09-2026</date><title>Senere</title><body>Senere</body></item>
        ${published}
      </items>`,
      'text/xml'
    ).documentElement;

    const news = buildLatestNews(
      items,
      'da',
      {},
      new Date('2026-09-06T22:30:00Z')
    );

    expect(news).toHaveLength(latestNewsLimit + 1);
    expect(news[0].title).toBe('Senere');
    expect(news[latestNewsLimit].title).toBe(`Nyhed ${latestNewsLimit}`);
  });

  it('uses the front-page date parameter when clipping scheduled news', () => {
    const news = [
      { date: '13-09-2026', title: 'Senere' },
      { date: '06-09-2026', title: 'I dag' },
    ];
    const currentDate = new Date('2026-09-06T12:00:00Z');

    expect(
      latestNewsForDate(news, undefined, currentDate).map(item => item.title)
    ).toEqual(['I dag']);
    expect(
      latestNewsForDate(news, '09-12', currentDate).map(item => item.title)
    ).toEqual(['I dag']);
    expect(
      latestNewsForDate(news, '09-13', currentDate).map(item => item.title)
    ).toEqual(['Senere', 'I dag']);
  });
});
