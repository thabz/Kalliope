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
}

const elasticSearchClient = new ElasticSearchClient();

module.exports = elasticSearchClient;
