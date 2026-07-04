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
});
