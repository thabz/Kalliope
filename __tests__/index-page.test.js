import Index from '../pages/index.js';

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
