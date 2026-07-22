import {
  singleMatchingTextIdResultURL,
  totalHitsValue,
} from '../pages/search.js';

describe('search page', () => {
  test('gets total hits from Elasticsearch 7 response format', () => {
    expect(totalHitsValue({ total: { value: 7, relation: 'eq' } })).toBe(7);
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
