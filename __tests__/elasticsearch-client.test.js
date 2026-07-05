jest.mock('node-fetch', () => jest.fn());

const fetch = require('node-fetch');
const elasticSearchClient = require('../tools/libs/elasticsearch-client.js');

const response = {
  ok: true,
  json: jest.fn(async () => ({ errors: false, items: [] })),
  text: jest.fn(async () => ''),
};

describe('Elasticsearch client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    response.json.mockClear();
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

  test('writes documents through the bulk API as newline-delimited JSON', async () => {
    await elasticSearchClient.bulkCreate('kalliope', [
      {
        id: 'poet-first',
        data: {
          result_type: 'work',
        },
      },
      {
        id: 'text-id',
        data: {
          result_type: 'text',
          title: 'Første linje',
        },
      },
    ]);

    const [url, options] = fetch.mock.calls[0];
    const lines = options.body.split('\n');

    expect(url).toBe('http://localhost:9200/kalliope/_bulk');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/x-ndjson');
    expect(lines).toEqual([
      JSON.stringify({ index: { _id: 'poet-first' } }),
      JSON.stringify({ result_type: 'work' }),
      JSON.stringify({ index: { _id: 'text-id' } }),
      JSON.stringify({ result_type: 'text', title: 'Første linje' }),
      '',
    ]);
  });

  test('searches poet names across countries and texts in selected country', async () => {
    await elasticSearchClient.search('kalliope', 'text', 'dk', '', 'aarestrup');

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    const resultTypeFilter = body.query.bool.filter[0].bool;

    expect(body.query.bool.must[0].multi_match.fields).toEqual([
      'poet_search^4',
      'text.title^3',
      'text.subtitles^2',
      'text.content_html',
    ]);
    expect(resultTypeFilter).toEqual({
      should: [
        { term: { result_type: 'poet' } },
        {
          bool: {
            filter: [
              { term: { result_type: 'text' } },
              { term: { 'poet.country': 'dk' } },
            ],
          },
        },
      ],
      minimum_should_match: 1,
    });
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
      { term: { 'poet.id': 'aarestrup' } },
      { term: { result_type: 'text' } },
      { term: { 'poet.country': 'dk' } },
    ]);
  });
});
