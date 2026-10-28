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

  it('shows the editorial label before a translation source under Forlæg', async () => {
    Client.text.mockResolvedValue({ ...textData, text: {
      ...textData.text,
      notes: [{ type: 'translation-source', editorial: true, content_lang: 'da',
        content_html: [['Gendigtning af Antonio Fogazzaros originaltekst.']] }],
    } });
    Client.poet.mockResolvedValue(collection);
    const props = await TextPage.getInitialProps({ query: { lang: 'da', textId: 'poem' } });
    const html = renderToStaticMarkup(
      <LangContext.Provider value="da"><TextPage {...JSON.parse(JSON.stringify(props))} /></LangContext.Provider>
    );
    const section = [...html.matchAll(/<section\b[^>]*>(.*?)<\/section>/g)]
      .map(match => match[1]).find(content => content.includes('>Forlæg<'));
    expect(section).toContain('>Kalliope<');
    expect(section).toContain('Gendigtning af Antonio Fogazzaros originaltekst.');
    expect(section.indexOf('>Kalliope<')).toBeLessThan(section.indexOf('Gendigtning af'));
  });

  it('renders edition, mention and translation citations with the same bibliography', async () => {
    const ref = {
      id: 'other', title: 'De to Røvere', poet: 'Adam Oehlenschläger', poetId: poet.id,
      work: 'Samlede Skrifter (1861)',
      citation: '<a poem="other">»De to Røvere«</a>, i: Adam Oehlenschläger: <i>Poetiske Skrifter</i>, udg. af F. L. Liebenberg, bd. 24, Kjøbenhavn: Forlaget, 1861, s. 353–356.',
    };
    Client.text.mockResolvedValue({ ...textData, work: { id: 'digte', title: 'Digte' }, text: {
      ...textData.text,
      source: { source: 'Adam Oehlenschläger: <i>Digte</i>, 1803.', pages: '10-12' },
      variants: [ref], refs: [ref], translations: [ref],
    } });
    const props = await TextPage.getInitialProps({ query: { lang: 'da', textId: 'poem' } });
    const html = renderToStaticMarkup(
      <LangContext.Provider value="da"><TextPage {...JSON.parse(JSON.stringify(props))} /></LangContext.Provider>
    );
    const sections = [...html.matchAll(/<section\b[^>]*>(.*?)<\/section>/g)].map(match => match[1]);
    const editions = sections.find(section => section.includes('Andre udgaver'));
    expect(editions).toContain('»De to Røvere«</a>, i: ');
    expect(editions).toContain('href="/da/text/other"');
    expect(editions).not.toContain('href="/da/works/oehlenschlaeger"');
    expect(editions).not.toContain('href="/da/works/liebenberg"');
    expect(editions).not.toContain('href="/da/work/oehlenschlaeger/bd24"');
    expect(editions).toContain('s. 353–356.');
    expect(editions).not.toContain('reference-metadata');
    const source = sections.find(section => section.includes('>Kilde<'));
    expect(source.replace(/<[^>]*>/g, '')).toContain('Adam Oehlenschläger: Digte, 1803, s. 10–12.');
    for (const heading of ['Omtalt i', 'Gendigtning']) {
      const section = sections.find(section => section.includes(heading));
      expect(section).toContain('»De to Røvere«</a>, i: ');
      expect(section.match(/<a\b/g)).toHaveLength(1);
      expect(section).toContain('s. 353–356.');
      expect(section).toContain('bd. 24, Kjøbenhavn: Forlaget, 1861, s. 353–356.');
      expect(section).not.toContain('reference-metadata');
    }
  });

  it.each([
    { facsimile: null, facsimilePageCount: null, facsimilePages: [9, 12] },
    { facsimile: 'scan', facsimilePageCount: null, facsimilePages: [9, 12] },
    { facsimile: 'scan', facsimilePageCount: 12, facsimilePages: [] },
    { facsimile: 'scan', facsimilePageCount: 12, facsimilePages: [0, 1] },
    { facsimile: 'scan', facsimilePageCount: 12, facsimilePages: [13, 14] },
  ])('renders the text and external source without an available local facsimile (%j)', async facsimile => {
    const digitalUrl = 'https://www.digitale-sammlungen.de/en/view/bsb11939631?page=9';
    Client.text.mockResolvedValue({ ...textData, text: {
      ...textData.text,
      blocks: [{ type: 'poetry', lines: [['En linje fra digtet.']] }],
      source: {
        source: 'Friedrich Leopold Graf zu Stolberg: <i>Jamben</i>, 1784.',
        pages: '7-10', digitalUrl, ...facsimile,
      },
    } });
    Client.poet.mockResolvedValue(collection);
    const props = await TextPage.getInitialProps({ query: { lang: 'da', textId: 'poem' } });
    const html = renderToStaticMarkup(
      <LangContext.Provider value="da"><TextPage {...JSON.parse(JSON.stringify(props))} /></LangContext.Provider>
    );
    expect(html).toContain('En linje fra digtet.');
    expect(html).toContain(`href="${digitalUrl}"`);
    expect(html.replace(/<[^>]*>/g, '')).toContain('Jamben, 1784, s. 7–10.');
    expect(html).not.toContain('/static/facsimiles/');
  });

  it.each(['poet', 'person'])('omits the current author link in sources and facsimile captions (%s)', async attribute => {
    Client.text.mockResolvedValue({ ...textData, text: {
      ...textData.text,
      source: {
        source: `<a ${attribute}="oehlenschlaeger"><b>Adam Oehlenschläger</b></a>: <i>Digte</i>, udg. af <a poet="liebenberg">F. L. Liebenberg</a>, 1803.`,
        pages: '10-12',
        digitalUrl: 'https://www.kb.dk/source',
        facsimile: 'scan', facsimilePages: [1, 2], facsimilePageCount: 2,
      },
    } });
    Client.poet.mockResolvedValue(collection);
    const props = await TextPage.getInitialProps({ query: { lang: 'da', textId: 'poem' } });
    const html = renderToStaticMarkup(
      <LangContext.Provider value="da"><TextPage {...JSON.parse(JSON.stringify(props))} /></LangContext.Provider>
    );
    const sidebar = html.match(/<aside\b[^>]*>(.*?)<\/aside>/)[1];
    expect(sidebar).not.toContain('href="/da/works/oehlenschlaeger"');
    expect(sidebar.match(/<b>Adam Oehlenschläger<\/b>: <i>Digte<\/i>/g)).toHaveLength(2);
    expect(sidebar.match(/href="\/da\/works\/liebenberg"/g)).toHaveLength(2);
    expect(sidebar).toContain('href="https://www.kb.dk/source"');
    expect(sidebar).toContain('s. 10–12.');
    expect(sidebar).toContain('/static/facsimiles/oehlenschlaeger/scan/t/000-w800.jpg');
  });
});
