import Index from '../pages/index.js';
import { renderToStaticMarkup } from 'react-dom/server';
import LangContext from '../common/LangContext.js';

test('forsidens dagsbillede viser museum og link til værksiden', () => {
  const remoteUrl = 'https://www.npg.org.uk/collections/search/portrait/mw03305';
  const html = renderToStaticMarkup(
    <LangContext.Provider value="da">
      <Index news={[]} todaysEvents={[{
        type: 'image',
        src: '/images/hunt/p1.jpg',
        content_lang: 'da',
        content_html: [['Benjamin Robert Haydon: Leigh Hunt, ca. 1811.']],
        museum: { id: 'npg', name: 'National Portrait Gallery, London' },
        remoteUrl,
      }]} />
    </LangContext.Provider>
  );

  expect(html).toContain('National Portrait Gallery, London');
  expect(html).toContain('href="/da/museum/npg"');
  expect(html).toContain(`href="${remoteUrl}"`);
});

const news = [{ date: '01-01-2020', title: 'Nyhed' }];
const event = { type: 'text', date: '1900-10-02', content_html: 'Begivenhed' };

const jsonResponse = (data) => ({
  ok: true,
  json: async () => data,
});

describe('front page without generated API files', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('keeps news when today returns invalid JSON', async () => {
    global.fetch = jest.fn(async (url) =>
      url.includes('/api/today/')
        ? {
            ok: true,
            json: async () => {
              throw new SyntaxError('Unexpected end of JSON input');
            },
          }
        : jsonResponse(news)
    );

    const props = await Index.getInitialProps({ query: { lang: 'da' } });

    expect(props.todaysEvents).toEqual([]);
    expect(props.news).toEqual(news);
  });

  it('keeps today when news is missing', async () => {
    global.fetch = jest.fn(async (url) =>
      url.includes('/api/news_')
        ? { ok: false, status: 404 }
        : jsonResponse([event])
    );

    const props = await Index.getInitialProps({ query: { lang: 'da' } });

    expect(props.todaysEvents).toEqual([event]);
    expect(props.news).toEqual([]);
  });

  it('ignores a JSON error object in place of a news list', async () => {
    global.fetch = jest.fn(async (url) =>
      url.includes('/api/news_')
        ? jsonResponse({ error: 'build-static has not run' })
        : jsonResponse([event])
    );

    const props = await Index.getInitialProps({ query: { lang: 'da' } });

    expect(props.todaysEvents).toEqual([event]);
    expect(props.news).toEqual([]);
  });

  it('returns empty data when both requests fail', async () => {
    global.fetch = jest.fn(async () => {
      throw new Error('API unavailable');
    });

    const props = await Index.getInitialProps({ query: { lang: 'da' } });

    expect(props.todaysEvents).toEqual([]);
    expect(props.news).toEqual([]);
  });
});
