import { DOMParser } from '@xmldom/xmldom';
import {
  buildLatestNews,
  latestNewsLimit,
} from '../tools/build-static/news.js';

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

    const news = buildLatestNews(items, 'da', {});

    expect(news).toHaveLength(latestNewsLimit);
    expect(news[0].date).toBe('01-01-2026');
    expect(news[latestNewsLimit - 1].date).toBe('05-01-2026');
  });
});
