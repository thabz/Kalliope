import { renderToStaticMarkup } from 'react-dom/server';
import * as Client from '../common/client.js';
import LangContext from '../common/LangContext.js';
import TextsPage from '../pages/texts.js';

jest.mock('../common/client.js', () => ({ texts: jest.fn() }));
jest.mock('../components/page.js', () => ({
  __esModule: true,
  default: ({ children }) => children,
}));

describe('poet text list hydration', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each(['titles', 'first'])(
    'reuses the serialized %s order even when browser collation differs',
    async (type) => {
      Client.texts.mockResolvedValue({
        poet: {
          id: 'oehlenschlaeger',
          name: { firstname: 'Adam', lastname: 'Oehlenschläger' },
          lang: 'da',
          country: 'dk',
        },
        lines: [
          { id: 'oehlenschlaeger18030101', title: 'Aften-Vandring', firstline: 'Natten' },
          { id: 'oehlenschlaeger18030102', title: 'Aftenvandring', firstline: 'Natten!' },
        ],
      });
      const props = await TextsPage.getInitialProps({
        query: { lang: 'da', poetId: 'oehlenschlaeger', type },
      });
      const render = (pageProps) => renderToStaticMarkup(
        <LangContext.Provider value="da">
          <TextsPage {...pageProps} />
        </LangContext.Provider>
      );
      const serverHTML = render(props);
      expect(serverHTML).toContain(type === 'titles' ? 'Aften' : 'Natten');
      const browserProps = JSON.parse(JSON.stringify(props));

      jest.spyOn(Intl, 'Collator').mockImplementation(() => {
        throw new Error('Browser collation must not reorder the server HTML');
      });

      expect(render(browserProps)).toBe(serverHTML);
    }
  );

  it('preserves API errors without trying to group missing poet data', async () => {
    Client.texts.mockResolvedValue({ error: { statusCode: 404 } });
    const props = await TextsPage.getInitialProps({
      query: { lang: 'da', poetId: 'unknown', type: 'titles' },
    });
    expect(props.error).toEqual({ statusCode: 404 });
    expect(props.groups).toEqual([]);
  });
});
