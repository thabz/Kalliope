import { renderToStaticMarkup } from 'react-dom/server';
import LangContext from '../common/LangContext.js';
import {
  getDocumentHeight,
  parseKeywordIds,
  RenderedHits,
  SearchFilters,
  SearchResultCount,
  singleMatchingTextIdResultURL,
  totalHitsValue,
} from '../pages/search.js';

describe('search page', () => {
  const poet = { id: 'testpoet', name: { lastname: 'Testdigter' } };
  const work = { id: 'testwork', title: 'Værktitel', year: '1900' };
  const text = { id: 'testtext', title: 'Teksttitel', title_prefix: 'I.' };
  const renderHit = (resultType, highlight) => renderToStaticMarkup(
    <LangContext.Provider value="da">
      <RenderedHits hits={[{
        _id: `test-${resultType}`,
        _source: { result_type: resultType, poet, work, text },
        highlight,
      }]} />
    </LangContext.Provider>
  );

  test.each([undefined, null, {}, {
    'work.title': [], 'text.title': [], 'text.content_html': [],
  }, {
    'work.title': null, 'text.title': null, 'text.content_html': null,
  }])('renders normal titles when highlights are absent: %p', highlight => {
    const workHtml = renderHit('work', highlight);
    expect(workHtml).toContain('Værktitel');
    expect(workHtml).toContain('(1900)');
    expect(workHtml).toContain('href="/da/work/testpoet/testwork"');
    const textHtml = renderHit('text', highlight);
    expect(textHtml).toContain('Teksttitel');
    expect(textHtml).toContain('I. ');
    expect(textHtml).toContain('href="/da/text/testtext"');
  });

  test.each(['', ' ,.!;?123 ', '<em></em>'])(
    'preserves an explicitly empty title highlight: %p', fragment => {
      const highlight = {
        'work.title': [fragment],
        'text.title': [fragment],
        'text.content_html': [fragment],
      };
      expect(renderHit('work', highlight)).toContain(
        'href="/da/work/testpoet/testwork"></a>'
      );
      expect(renderHit('text', highlight)).toContain(
        'href="/da/text/testtext"></a>'
      );
    }
  );

  test('renders highlighted titles and text excerpts', () => {
    const highlight = {
      'work.title': ['Mit <em>værk</em>'],
      'text.title': ['Min <em>tekst</em>'],
      'text.content_html': ['Et <em>fund</em> i teksten'],
    };
    expect(renderHit('work', highlight)).toContain('Mit <em>værk</em>');
    const textHtml = renderHit('text', highlight);
    expect(textHtml).toContain('Min <em>tekst</em>');
    expect(textHtml).toContain('Et <em>fund</em> i teksten');
  });

  test.each([{}, { body: null, documentElement: null }, {
    body: {}, documentElement: {},
  }, {
    body: { scrollHeight: 0, offsetHeight: null },
    documentElement: { clientHeight: 0 },
  }])('uses zero for missing document dimensions: %p', document => {
    expect(getDocumentHeight(document)).toBe(0);
  });

  test.each([
    ['body', 'scrollHeight'], ['body', 'offsetHeight'],
    ['documentElement', 'clientHeight'], ['documentElement', 'scrollHeight'],
    ['documentElement', 'offsetHeight'],
  ])('uses %s.%s even when the other dimensions are missing', (element, dimension) => {
    expect(getDocumentHeight({ [element]: { [dimension]: 1200 } })).toBe(1200);
  });

  test('uses the largest document dimension for the scroll threshold', () => {
    expect(getDocumentHeight({
      body: { scrollHeight: 1000, offsetHeight: 1100 },
      documentElement: { clientHeight: 800, scrollHeight: 1400, offsetHeight: 1200 },
    })).toBe(1400);
  });

  test.each([
    ['artist', 'kroyer', 'P.S. Krøyer', ['Kunstner', 'Artist', 'Künstler', 'Artiste']],
    ['person', 'heibergjohanne', 'Johanne Luise Heiberg', ['Person', 'Person', 'Person', 'Personne']],
    ['poet', 'oehlenschlaeger', 'Oehlenschläger', ['Digter', 'Poet', 'Dichter', 'Poète']],
    ['collection', 'folkeviser', 'Folkeviser', ['Samling', 'Collection', 'Sammlung', 'Collection']],
    [undefined, 'unknown', 'Ukendt type', ['Person', 'Person', 'Person', 'Personne']],
  ])('labels %s search results and filters using the registered type', (type, id, fullname, labels) => {
    const poet = { id, type, name: { firstname: fullname } };
    ['da', 'en', 'de', 'fr'].forEach((lang, index) => {
      const html = renderToStaticMarkup(
        <LangContext.Provider value={lang}>
          <RenderedHits hits={[{ _id: `poet-${id}`, _source: { result_type: 'poet', poet } }]} />
        </LangContext.Provider>
      );
      expect(html).toMatch(new RegExp(`class="[^"]*result-type[^"]*">${labels[index]}</span>`));
      expect(html).toContain(fullname);
      expect(html).toContain(`/${lang}/works/${id}`);
      const filters = renderToStaticMarkup(
        <SearchFilters country="all" keywordFilters={[]} lang={lang} poet={poet} query="" />
      );
      expect(filters).toContain(`${labels[index]}: ${fullname}`);
    });
  });

  test('parses unique comma-separated keyword filters', () => {
    expect(parseKeywordIds(' sonnet,elegi,sonnet,, ')).toEqual([
      'sonnet',
      'elegi',
    ]);
    expect(parseKeywordIds()).toEqual([]);
  });

  test('renders removable keyword, query, poet and collection filters', () => {
    const html = renderToStaticMarkup(
      <SearchFilters
        country="dk"
        keywordFilters={[{ id: 'sonnet', title: 'Sonet' }]}
        lang="da"
        poet={{ id: 'oehlenschlaeger', type: 'poet', name: { lastname: 'Oehlenschläger' } }}
        query="Kærlighed"
      />
    );

    expect(html).toContain('Fritekst: Kærlighed');
    expect(html).toContain('Nøgleord: Sonet');
    expect(html).toContain('Digter: Oehlenschläger');
    expect(html).toContain('Samling: dansk');
    expect(html).toContain(
      '/da/search/dk/oehlenschlaeger?keyword=sonnet'
    );
    expect(html).toContain(
      '/da/search/all/oehlenschlaeger?query=K%C3%A6rlighed&amp;keyword=sonnet'
    );
  });

  test('gets total hits from Elasticsearch 7 response format', () => {
    expect(totalHitsValue({ total: { value: 7, relation: 'eq' } })).toBe(7);
  });

  test('does not render a zero count before search results arrive', () => {
    expect(
      renderToStaticMarkup(<SearchResultCount lang="da" totalHits={null} />)
    ).toBe('');
    expect(
      renderToStaticMarkup(<SearchResultCount lang="da" totalHits={0} />)
    ).toContain('0 resultater fundet');
  });

  test('redirects to the text when the only result exactly matches the searched id', () => {
    expect(
      singleMatchingTextIdResultURL('da', ' aarestrup1838a18 ', {
        hits: {
          total: { value: 1, relation: 'eq' },
          hits: [
            {
              _source: {
                result_type: 'text',
                text: { id: 'aarestrup1838a18' },
              },
            },
          ],
        },
      })
    ).toBe('/da/text/aarestrup1838a18');
  });

  test('does not redirect when the single text result does not match the searched id', () => {
    expect(
      singleMatchingTextIdResultURL('da', 'blomst', {
        hits: {
          total: { value: 1, relation: 'eq' },
          hits: [
            {
              _source: {
                result_type: 'text',
                text: { id: 'aarestrup1838a18' },
              },
            },
          ],
        },
      })
    ).toBeNull();
  });

  test.each([undefined, null, []])('does not redirect when the hit list is absent: %p', hits => {
    expect(singleMatchingTextIdResultURL('da', 'testtext', {
      hits: { total: { value: 1 }, hits },
    })).toBeNull();
  });

  test.each([undefined, null, {}])('does not redirect when the hit source or text is absent: %p', source => {
    expect(singleMatchingTextIdResultURL('da', 'testtext', {
      hits: { total: { value: 1 }, hits: [{ _source: source }] },
    })).toBeNull();
  });

  test('does not redirect when there are multiple results', () => {
    expect(
      singleMatchingTextIdResultURL('da', 'aarestrup1838a18', {
        hits: {
          total: { value: 2, relation: 'eq' },
          hits: [
            {
              _source: {
                result_type: 'text',
                text: { id: 'aarestrup1838a18' },
              },
            },
            {
              _source: {
                result_type: 'text',
                text: { id: 'aarestrup1838a19' },
              },
            },
          ],
        },
      })
    ).toBeNull();
  });
});
