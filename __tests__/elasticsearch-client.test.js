import elasticSearchClient from '../tools/libs/elasticsearch-client.js';

const response = {
  ok: true,
  json: jest.fn(async () => ({ errors: false, items: [] })),
  text: jest.fn(async () => ''),
};

describe('Elasticsearch client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    response.json.mockClear();
    response.text.mockClear();
    global.fetch = jest.fn().mockResolvedValue(response);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test('creates an accent-insensitive text index', async () => {
    await elasticSearchClient.createIndex('kalliope');

    const putCall = global.fetch.mock.calls.find(([, options]) => {
      return options.method === 'PUT';
    });
    const body = JSON.parse(putCall[1].body);

    expect(body.settings.analysis.analyzer.kalliope_text).toEqual({
      tokenizer: 'standard',
      filter: ['lowercase', 'asciifolding'],
    });
    expect(body.settings.analysis.normalizer.kalliope_keyword).toEqual({
      type: 'custom',
      filter: ['lowercase', 'asciifolding'],
    });
    expect(body.mappings.properties.text.properties.content_html).toEqual({
      type: 'text',
      analyzer: 'kalliope_text',
    });
    expect(body.mappings.properties.text.properties.id).toEqual({
      type: 'keyword',
    });
    expect(body.mappings.properties.text.properties.title.analyzer).toBe(
      'kalliope_text'
    );
    expect(body.mappings.properties.text.properties.subtitles.analyzer).toBe(
      'kalliope_text'
    );
    expect(
      body.mappings.properties.text.properties.title.fields.exact
    ).toEqual({
      type: 'keyword',
      normalizer: 'kalliope_keyword',
    });
    expect(body.mappings.properties.work.properties.title).toEqual({
      type: 'text',
      analyzer: 'kalliope_text',
      fields: {
        exact: {
          type: 'keyword',
          normalizer: 'kalliope_keyword',
        },
      },
    });
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

    const [url, options] = global.fetch.mock.calls[0];
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

  test('searches poet names across countries and works/texts in selected country', async () => {
    await elasticSearchClient.search('kalliope', 'text', 'dk', '', 'aarestrup');

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    const resultTypeQuery = body.query.bool.filter[0].bool;
    const workQuery = resultTypeQuery.should[1].bool.must[0].bool;
    const textQuery = resultTypeQuery.should[2].bool.must[0].bool;

    expect(body.query.bool.must).toEqual([]);
    expect(body.highlight.fields).toEqual({
      'work.title': {},
      'text.title': {},
      'text.content_html': {},
    });
    expect(resultTypeQuery.minimum_should_match).toBe(1);
    expect(resultTypeQuery.should[0]).toEqual({
      bool: {
        filter: [{ term: { result_type: 'poet' } }],
        must: [
          {
            multi_match: {
              query: 'aarestrup',
              fields: ['poet_search^4'],
            },
          },
        ],
      },
    });
    expect(resultTypeQuery.should[1].bool.filter).toEqual([
      { term: { 'poet.country': 'dk' } },
    ]);
    expect(workQuery.filter).toEqual([{ term: { result_type: 'work' } }]);
    expect(workQuery.must).toEqual([
      {
        multi_match: {
          query: 'aarestrup',
          fields: ['work.title^8'],
        },
      },
    ]);
    expect(workQuery.should).toEqual([
      {
        match: {
          'work.title.exact': {
            query: 'aarestrup',
            boost: 24,
          },
        },
      },
      {
        match_phrase: {
          'work.title': {
            query: 'aarestrup',
            boost: 12,
          },
        },
      },
      {
        match_phrase_prefix: {
          'work.title': {
            query: 'aarestrup',
            boost: 6,
          },
        },
      },
    ]);
    expect(resultTypeQuery.should[2].bool.filter).toEqual([
      { term: { 'poet.country': 'dk' } },
    ]);
    expect(textQuery.filter).toEqual([{ term: { result_type: 'text' } }]);
    expect(textQuery.must).toEqual([
      {
        multi_match: {
          query: 'aarestrup',
          fields: [
            'text.title^10',
            'text.subtitles^2',
            'text.content_html',
          ],
        },
      },
    ]);
    expect(textQuery.should).toEqual([
      {
        match: {
          'text.title.exact': {
            query: 'aarestrup',
            boost: 40,
          },
        },
      },
      {
        match_phrase: {
          'text.title': {
            query: 'aarestrup',
            boost: 20,
          },
        },
      },
      {
        match_phrase_prefix: {
          'text.title': {
            query: 'aarestrup',
            boost: 10,
          },
        },
      },
    ]);
  });

  test('searches only works and texts when scoped to a poet', async () => {
    await elasticSearchClient.search(
      'kalliope',
      'text',
      'dk',
      'aarestrup',
      'rose'
    );

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    const scopedQuery = body.query.bool.must[0].bool;
    const workQuery = scopedQuery.should[0].bool;
    const textQuery = scopedQuery.should[1].bool;

    expect(body.query.bool.filter).toEqual([
      { term: { 'poet.id': 'aarestrup' } },
      { term: { 'poet.country': 'dk' } },
    ]);
    expect(scopedQuery.minimum_should_match).toBe(1);
    expect(scopedQuery.should).toHaveLength(2);
    expect(workQuery.must[0].multi_match.fields).toEqual(['work.title^8']);
    expect(workQuery.should[0]).toEqual({
      match: {
        'work.title.exact': {
          query: 'rose',
          boost: 24,
        },
      },
    });
    expect(textQuery.must[0].multi_match.fields).toEqual([
      'text.title^10',
      'text.subtitles^2',
      'text.content_html',
    ]);
    expect(textQuery.should[0]).toEqual({
      match: {
        'text.title.exact': {
          query: 'rose',
          boost: 40,
        },
      },
    });
  });
});
