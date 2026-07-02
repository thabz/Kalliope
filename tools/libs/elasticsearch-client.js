const fetch = require('node-fetch');

const URLPrefix = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const requestTimeout = Math.max(
  1000,
  parseInt(process.env.KALLIOPE_ELASTICSEARCH_REQUEST_TIMEOUT_MS, 10) || 60000
);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const requestWithRetry = async (URL, options, attempts = 15) => {
  let lastError = null;
  const requestOptions = {
    timeout: requestTimeout,
    ...options,
  };
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(URL, requestOptions);
      if (res.ok) {
        return res;
      }
      const text = await res.text();
      lastError = new Error(
        `Elasticsearch ${requestOptions.method} ${URL} failed: ${res.status} ${text}`
      );
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) {
      await wait(500 * attempt);
    }
  }
  throw lastError;
};

class ElasticSearchClient {
  async indexExists(index) {
    const URL = `${URLPrefix}/${index}`;
    const res = await fetch(URL, {
      method: 'HEAD',
      timeout: requestTimeout,
    });
    if (res.ok) {
      return true;
    }
    if (res.status === 404) {
      return false;
    }
    const text = await res.text();
    throw new Error(
      `Elasticsearch HEAD ${URL} failed: ${res.status} ${text}`
    );
  }

  async createIndex(index) {
    const URL = `${URLPrefix}/${index}`;
    const deleteRes = await fetch(URL, {
      method: 'DELETE',
      timeout: requestTimeout,
    });
    const deleteText = await deleteRes.text();
    if (!deleteRes.ok && deleteRes.status !== 404) {
      throw new Error(
        `Elasticsearch DELETE ${URL} failed: ${deleteRes.status} ${deleteText}`
      );
    }
    const putRes = await requestWithRetry(URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mappings: {
          date_detection: false,
        },
      }),
    });
    return putRes.text();
  }

  async create(index, type, id, json) {
    const URL = `${URLPrefix}/${index}/_doc/${id}`;
    const body = JSON.stringify(json);
    const res = await requestWithRetry(URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });
    return res.json();
  }

  // Returns the raw JSON as (a promise of) text, not as an object.
  search(index, type, country, poetId, query, page = 0) {
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
                fields: ['text.title', 'text.content_html', 'text.subtitles'],
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
      body.query.bool.filter.push({
        term: { 'poet.id': poetId },
      });
    }

    return fetch(URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }).then(res => {
      return res.text();
    });
  }
}

const elasticSearchClient = new ElasticSearchClient();

module.exports = elasticSearchClient;
