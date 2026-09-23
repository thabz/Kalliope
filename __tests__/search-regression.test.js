import fs from 'fs';
import elasticSearchClient from '../tools/libs/elasticsearch-client.js';

const elasticsearchURL =
  process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const elasticsearchIndex = 'kalliope-ci';
const integrationEnabled =
  process.env.KALLIOPE_ELASTICSEARCH_INTEGRATION === 'true';
const regressionPoetIds = new Set([
  'blake',
  'claussen',
  'goethe',
  'ingemann',
  'luetken',
  'mallarme',
  'reenberg',
]);

jest.setTimeout(180000);

const fetchWithTimeout = (url, options = {}) => {
  return fetch(url, {
    ...options,
    signal: options.signal || AbortSignal.timeout(1500),
  });
};

const loadCollectedMap = name => {
  const entries = JSON.parse(
    fs.readFileSync(`caches/collected.${name}.json`, 'utf8')
  );
  return new Map(entries);
};

const loadCollected = () => ({
  poets: loadCollectedMap('poets'),
  works: loadCollectedMap('works'),
  texts: loadCollectedMap('texts'),
  keywords: loadCollectedMap('keywords'),
  dict: loadCollectedMap('dict'),
});

const requireElasticsearch = async () => {
  const res = await fetchWithTimeout(
    `${elasticsearchURL}/_cluster/health?wait_for_status=yellow&timeout=30s`,
    { signal: AbortSignal.timeout(35000) }
  );
  if (res.ok === false) {
    throw new Error(
      `Elasticsearch health check failed with status ${res.status}.`
    );
  }
};

const search = async ({ country, keywordIds = [], poetId = '', query }) => {
  const responseText = await elasticSearchClient.search(
    elasticsearchIndex,
    'text',
    country,
    poetId,
    query,
    0,
    keywordIds
  );
  return JSON.parse(responseText);
};

const hitIds = result => result.hits.hits.map(hit => hit._id);

const describeElasticsearch = integrationEnabled ? describe : describe.skip;

describeElasticsearch('Elasticsearch search regression', () => {
  beforeAll(async () => {
    await requireElasticsearch();
    const { update_elasticsearch } = await import(
      '../tools/build-static/elastic.js'
    );
    await update_elasticsearch(loadCollected(), {
      index: elasticsearchIndex,
      poetIds: regressionPoetIds,
      forceRebuild: true,
      skipUnavailable: false,
    });
  });

  test('covers merged search fixes against Elasticsearch', async () => {
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

    // Accent-insensitive search should find accented Danish titles.
    const ekbatana = await search({
      country: 'dk',
      query: 'ekbatana',
    });
    expect(ekbatana.hits.total.value).toBeGreaterThan(0);
    expect(hitIds(ekbatana)).toContain('claussen2001082601');
    const claussenEkbatana = ekbatana.hits.hits.find(
      hit => hit._id === 'claussen2001082601'
    );
    expect(claussenEkbatana._source.poet.id).toBe('claussen');
    expect(claussenEkbatana._source.text.title).toBe('Ekbátana');

    // Accent-insensitive search should also cover poet names.
    const mallarme = await search({
      country: 'dk',
      query: 'mallarme',
    });
    expect(mallarme.hits.total.value).toBeGreaterThan(0);
    expect(hitIds(mallarme)).toContain('poet-mallarme');
    const mallarmePoet = mallarme.hits.hits.find(
      hit => hit._id === 'poet-mallarme'
    );
    expect(mallarmePoet._source.poet.id).toBe('mallarme');
    expect(mallarmePoet._source.poet.name.lastname).toBe('Mallarmé');

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

    // Keyword articles and deliberately tagged texts share the broad search.
    const romanticismKeyword = await search({
      country: 'dk',
      query: 'romantikken',
    });
    expect(hitIds(romanticismKeyword)).toContain('keyword-romantikken');
    const romanticismHit = romanticismKeyword.hits.hits.find(
      hit => hit._id === 'keyword-romantikken'
    );
    expect(romanticismHit._source.keyword.title).toBe('Romantikken');

    const sonnetKeyword = await search({ country: 'dk', query: 'sonnet' });
    expect(hitIds(sonnetKeyword)).toContain('keyword-sonnet');

    // An explicit keyword filter returns texts only and agrees with their ids.
    const sonnets = await search({
      country: 'dk',
      keywordIds: ['sonnet'],
      query: '',
    });
    expect(sonnets.hits.total.value).toBeGreaterThan(0);
    expect(
      sonnets.hits.hits.every(
        hit =>
          hit._source.result_type === 'text' &&
          hit._source.text.keyword_ids.includes('sonnet')
      )
    ).toBe(true);
  });
});
