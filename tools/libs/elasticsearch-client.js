const fetch = require('node-fetch');

const URLPrefix = 'http://localhost:9200';

class ElasticSearchClient {
  async createIndex(index) {
    const URL = `${URLPrefix}/${index}`;
    const body = JSON.stringify(json);
    await fetch(URL, { method: 'PUT', body: body });
  }

  async create(index, type, id, json, callback) {
    const URL = `${URLPrefix}/${index}/${type}/${id}`;
    const body = JSON.stringify(json);
    const res = await fetch(URL, { method: 'PUT', body: body });
    const result = await res.json();
    return result;
  }

  // Returns the raw JSON as (a promise of) text, not as an object.
  async search(index, type, country, poet, query) {
    const URL = `${URLPrefix}/${index}/_search`;
    const body = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query,
                fields: ['text.title', 'text.content_html'],
              },
            },
          ],
          filter: [{ term: { 'poet.country': country } }],
        },
      },
    };
    const res = await fetch(URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const result = await res.text();
    return result;
  }
}

const elasticSearchClient = new ElasticSearchClient();

module.exports = elasticSearchClient;
