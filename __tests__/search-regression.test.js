import elasticSearchClient from '../tools/libs/elasticsearch-client.js';

const elasticsearchURL =
  process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

const fetchWithTimeout = (url, options = {}) => {
  return fetch(url, {
    ...options,
    signal: options.signal || AbortSignal.timeout(1500),
  });
};

const hasSearchIndex = async () => {
  try {
    const res = await fetchWithTimeout(`${elasticsearchURL}/kalliope`, {
      method: 'HEAD',
    });
    return res.ok;
  } catch (error) {
    return false;
  }
};

const search = async ({ country, poetId = '', query }) => {
  const responseText = await elasticSearchClient.search(
    'kalliope',
    'text',
    country,
    poetId,
    query
  );
  return JSON.parse(responseText);
};

const hitIds = result => result.hits.hits.map(hit => hit._id);

describe('Elasticsearch search regression', () => {
  test('covers merged search fixes when Elasticsearch is available', async () => {
    if (!(await hasSearchIndex())) {
      return;
    }

    // PR #1248: exact text-id searches should find the single poem directly.
    const singleTextId = await search({
      country: 'dk',
      query: 'reenberg2001062301',
    });
    expect(singleTextId.hits.total.value).toBe(1);
    expect(hitIds(singleTextId)).toEqual(['reenberg2001062301']);

    // PR #1250: exact title matches should outrank body-text matches.
    const hyrdernesTilbedelse = await search({
      country: 'dk',
      query: 'Hyrdernes Tilbedelse',
    });
    expect(hitIds(hyrdernesTilbedelse)[0]).toBe('luetken2018011837');
    expect(hyrdernesTilbedelse.hits.hits[0].highlight['text.title']).toEqual([
      '<em>Hyrdernes</em> <em>Tilbedelse</em>',
    ]);

    const lysEnglen = await search({
      country: 'dk',
      query: 'Lys-Englen',
    });
    expect(hitIds(lysEnglen)[0]).toBe('ingemann2017100422');
    expect(lysEnglen.hits.hits[0].highlight['text.title']).toEqual([
      '<em>Lys</em>-<em>Englen</em>',
    ]);

    // Scoped searches should keep results inside the selected poet.
    const scopedPoet = await search({
      country: 'dk',
      poetId: 'reenberg',
      query: 'I et Viinhus',
    });
    expect(scopedPoet.hits.total.value).toBeGreaterThan(0);
    expect(
      scopedPoet.hits.hits.every(hit => hit._source.poet.id === 'reenberg')
    ).toBe(true);
    expect(hitIds(scopedPoet)).toContain('reenberg2001062301');

    // Non-Danish collections should still search by title and stay in country.
    const englishTitle = await search({
      country: 'gb',
      query: 'The Tyger',
    });
    expect(hitIds(englishTitle)[0]).toBe('blake1999041324');
    expect(englishTitle.hits.hits[0]._source.poet.country).toBe('gb');

    const germanTitle = await search({
      country: 'de',
      query: 'Erlkönig',
    });
    expect(hitIds(germanTitle)[0]).toBe('goethe2000010805');
    expect(germanTitle.hits.hits[0]._source.poet.country).toBe('de');
  });
});
