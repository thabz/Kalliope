jest.mock('node-fetch', () => jest.fn());

const fetch = require('node-fetch');
const elasticSearchClient = require('../tools/libs/elasticsearch-client.js');

const response = {
  ok: true,
  text: jest.fn(async () => ''),
};

describe('Elasticsearch client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    response.text.mockClear();
    fetch.mockResolvedValue(response);
  });

  test('creates an accent-insensitive text index', async () => {
    await elasticSearchClient.createIndex('kalliope');

    const putCall = fetch.mock.calls.find(([, options]) => {
      return options.method === 'PUT';
    });
    const body = JSON.parse(putCall[1].body);

    expect(body.settings.analysis.analyzer.kalliope_text).toEqual({
      tokenizer: 'standard',
      filter: ['lowercase', 'asciifolding'],
    });
    expect(body.mappings.properties.text.properties.content_html).toEqual({
      type: 'text',
      analyzer: 'kalliope_text',
    });
    expect(body.mappings.properties.text.properties.title.analyzer).toBe(
      'kalliope_text'
    );
    expect(body.mappings.properties.text.properties.subtitles.analyzer).toBe(
      'kalliope_text'
    );
  });

  test('searches both texts and poet names', async () => {
    await elasticSearchClient.search('kalliope', 'text', 'dk', '', 'aarestrup');

    const body = JSON.parse(fetch.mock.calls[0][1].body);

    expect(body.query.bool.must[0].multi_match.fields).toEqual([
      'poet_search^4',
      'text.title^3',
      'text.subtitles^2',
      'text.content_html',
    ]);
    expect(body.query.bool.filter).toEqual([{ term: { 'poet.country': 'dk' } }]);
  });

  test('searches only texts when scoped to a poet', async () => {
    await elasticSearchClient.search(
      'kalliope',
      'text',
      'dk',
      'aarestrup',
      'rose'
    );

    const body = JSON.parse(fetch.mock.calls[0][1].body);

    expect(body.query.bool.filter).toEqual([
      { term: { 'poet.country': 'dk' } },
      { term: { 'poet.id': 'aarestrup' } },
      { term: { result_type: 'text' } },
    ]);
  });
});
