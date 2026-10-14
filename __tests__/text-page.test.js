import { renderToStaticMarkup } from 'react-dom/server';
import * as Client from '../common/client.js';
import LangContext from '../common/LangContext.js';
import TextPage, { blocksHaveMarginNotes } from '../pages/text.js';

jest.mock('../common/client.js', () => ({
  text: jest.fn(),
  poet: jest.fn(),
}));

describe('text page blocks', () => {
  it('accepts linkable sections without text blocks', () => {
    expect(blocksHaveMarginNotes(null)).toBe(false);
  });

  it('detects margin notes in text blocks', () => {
    const blocks = [
      {
        lines: [['En linje <margin>med en note</margin>.']],
      },
    ];

    expect(blocksHaveMarginNotes(blocks)).toBe(true);
  });
});

describe('text page breadcrumbs', () => {
  const poet = {
    id: 'oehlenschlaeger',
    country: 'dk',
    name: { firstname: 'Adam', lastname: 'Oehlenschläger' },
  };
  const collection = {
    id: 'antologierdk',
    type: 'collection',
    country: 'dk',
    name: { firstname: 'Antologier' },
  };
  const textData = {
    poet,
    work: {
      id: '1845-gaea',
      poet_id: collection.id,
      title: 'Gæa',
      breadcrumbtitle: '1845',
      year: '1845',
      parent: {
        id: '1845-1847-gaea',
        poet_id: collection.id,
        title: 'Gæa',
        year: '1845-47',
      },
    },
    section_titles: [{ title: 'Digte af A. Oehlenschläger' }],
    text: {
      id: 'oehlenschlaeger20260814006',
      title: 'Sangens Echo',
      linktitle: 'Sangens Echo',
      notes: [], pictures: [], keywords: [], variants: [], refs: [], blocks: [],
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it('uses the canonical anthology trail while retaining the text author', async () => {
    Client.text.mockResolvedValue(textData);
    Client.poet.mockResolvedValue(collection);
    const props = await TextPage.getInitialProps({
      query: { lang: 'da', textId: textData.text.id },
    });
    expect(Client.poet).toHaveBeenCalledWith(collection.id);
    expect(props.poet).toBe(poet);

    const html = renderToStaticMarkup(
      <LangContext.Provider value="da">
        <TextPage {...JSON.parse(JSON.stringify(props))} />
      </LangContext.Provider>
    );
    const breadcrumbs = html.match(/<nav\b[^>]*>(.*?)<\/nav>/)[1];
    expect(breadcrumbs).toContain('href="/da/works/antologierdk"');
    expect(breadcrumbs).toContain('Antologier');
    expect(breadcrumbs).not.toContain('/da/works/oehlenschlaeger');
    expect(breadcrumbs).toContain('/da/work/antologierdk/1845-1847-gaea');
    expect(breadcrumbs).toContain('/da/work/antologierdk/1845-gaea');
    expect(breadcrumbs).toContain('Digte af A. Oehlenschläger');
    expect(breadcrumbs).toContain('Sangens Echo');
  });

  it.each([undefined, poet.id])('reuses the author for a single-author work (%s)', async (poetId) => {
    Client.text.mockResolvedValue({
      ...textData,
      work: { id: 'digte', title: 'Digte', poet_id: poetId },
    });
    const props = await TextPage.getInitialProps({ query: { lang: 'da', textId: 'poem' } });
    expect(props.workPoet).toBe(poet);
    expect(Client.poet).not.toHaveBeenCalled();
  });

  it('preserves text API errors without fetching a breadcrumb owner', async () => {
    Client.text.mockResolvedValue({ error: { statusCode: 404 } });
    const props = await TextPage.getInitialProps({ query: { lang: 'da', textId: 'unknown' } });
    expect(props.error).toEqual({ statusCode: 404 });
    expect(Client.poet).not.toHaveBeenCalled();
  });
});
