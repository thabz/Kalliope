import Index, { config } from '../pages/index.js';

describe('front page data', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('only serializes the five news items rendered by the page', async () => {
    const news = Array.from({ length: 6 }, (_, index) => ({ index }));
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({ json: async () => news })
      .mockResolvedValueOnce({ json: async () => [] });

    const props = await Index.getInitialProps({
      query: { lang: 'da', date: '08-28' },
    });

    expect(props.news).toEqual(news.slice(0, 5));
  });

  it('uses server-rendered HTML without the Next.js client runtime', () => {
    expect(config).toEqual({ unstable_runtimeJS: false });
  });
});
