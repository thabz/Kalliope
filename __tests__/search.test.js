import { totalHitsValue } from '../pages/search.js';

describe('search page', () => {
  test('gets total hits from Elasticsearch 7 response format', () => {
    expect(totalHitsValue({ total: { value: 7, relation: 'eq' } })).toBe(7);
  });
});
