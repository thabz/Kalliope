import { renderToStaticMarkup } from 'react-dom/server';
import {
  parseKeywordIds,
  SearchFilters,
  SearchResultCount,
  singleMatchingTextIdResultURL,
  totalHitsValue,
} from '../pages/search.js';

describe('search page', () => {
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
        poet={{ id: 'oehlenschlaeger', name: { lastname: 'Oehlenschläger' } }}
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
