const fetch = require('node-fetch');
const queue = require('async/queue');

const URLPrefix = 'http://localhost:9200';

const indexingQueue = queue(async (task, callback) => {
  const { index, type, id, json } = task;
  const URL = `${URLPrefix}/${index}/${type}/${id}`;
  const body = JSON.stringify(json);
  try {
    const res = await fetch(URL, { method: 'PUT', body: body });
    const result = await res.json();
    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
}, 100);

class ElasticSearchClient {
  async createIndex(index) {
    const URL = `${URLPrefix}/${index}`;
    try {
      await fetch(URL, { method: 'PUT' });
    } catch (error) {
      console.log(error);
    }
  }

  async create(index, type, id, json) {
    indexingQueue.push({ index, type, id, json }, err => {
      if (err) {
        console.log(err);
      }
    });
  }

  // Returns the raw JSON as (a promise of) text, not as an object.
  async search(index, type, country, poetId, query, page = 0) {
    const URL = `${URLPrefix}/${index}/_search`;
    const body = {
      size: 10,
      from: page * 10,
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
      highlight: {
        fields: {
          'text.content_html': {},
        },
      },
    };
    if (poetId != null && poetId.length > 0) {
      console.log('Add poet filter for ', poetId);
      body.query.bool.filter.push({
        term: { 'poet.id': poetId },
      });
    }
    try {
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
    } catch (error) {
      console.log(error);
    }
  }
}

const elasticSearchClient = new ElasticSearchClient();

module.exports = elasticSearchClient;
