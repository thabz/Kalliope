const URLPrefix = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const requestTimeout = Math.max(
  1000,
  parseInt(process.env.KALLIOPE_ELASTICSEARCH_REQUEST_TIMEOUT_MS, 10) || 60000
);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const withRequestTimeout = options => ({
  ...options,
  signal: options.signal || AbortSignal.timeout(requestTimeout),
});

const requestWithRetry = async (
  URL,
  options,
  attempts = 15,
  acceptedStatuses = []
) => {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const requestOptions = withRequestTimeout(options);
    try {
      const res = await fetch(URL, requestOptions);
      if (res.ok || acceptedStatuses.includes(res.status)) {
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
    const res = await fetch(URL, withRequestTimeout({
      method: 'HEAD',
    }));
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
    const deleteRes = await requestWithRetry(
      URL,
      {
        method: 'DELETE',
      },
      15,
      [404]
    );
    await deleteRes.text();
    const putRes = await requestWithRetry(URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        settings: {
          analysis: {
            analyzer: {
              kalliope_text: {
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding'],
              },
            },
          },
        },
        mappings: {
          date_detection: false,
          properties: {
            text: {
              properties: {
                title: {
                  type: 'text',
                  analyzer: 'kalliope_text',
                },
                content_html: {
                  type: 'text',
                  analyzer: 'kalliope_text',
                },
                subtitles: {
                  type: 'text',
                  analyzer: 'kalliope_text',
                },
              },
            },
            work: {
              properties: {
                title: {
                  type: 'text',
                  analyzer: 'kalliope_text',
                },
              },
            },
          },
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

  async bulkCreate(index, documents) {
    if (documents.length === 0) {
      return { errors: false, items: [] };
    }

    const URL = `${URLPrefix}/${index}/_bulk`;
    const body =
      documents
        .map(document =>
          [
            JSON.stringify({
              index: {
                _id: document.id,
              },
            }),
            JSON.stringify(document.data),
          ].join('\n')
        )
        .join('\n') + '\n';
    const res = await requestWithRetry(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-ndjson',
      },
      body,
    });
    const result = await res.json();

    if (result.errors) {
      const failedItem = result.items.find(item => {
        const action = item.index || item.create || item.update;
        return action && action.error;
      });
      throw new Error(
        `Elasticsearch bulk ${URL} failed: ${JSON.stringify(failedItem)}`
      );
    }

    return result;
  }

  async refreshIndex(index) {
    const URL = `${URLPrefix}/${index}/_refresh`;
    const res = await requestWithRetry(URL, {
      method: 'POST',
    });
    return res.json();
  }

  async deleteByQuery(index, query) {
    const URL = `${URLPrefix}/${index}/_delete_by_query?conflicts=proceed&refresh=true`;
    const res = await requestWithRetry(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    return res.json();
  }

  deletePoet(index, poetId) {
    return this.deleteByQuery(index, {
      term: {
        'poet.id': poetId,
      },
    });
  }

  deleteWork(index, poetId, workId) {
    return this.deleteByQuery(index, {
      bool: {
        filter: [
          {
            term: {
              'poet.id': poetId,
            },
          },
          {
            term: {
              'work.id': workId,
            },
          },
        ],
      },
    });
  }

  // Returns the raw JSON as (a promise of) text, not as an object.
  search(index, type, country, poetId, query, page = 0) {
    const URL = `${URLPrefix}/${index}/_search`;
    const poetSearchQuery = {
      bool: {
        filter: [{ term: { result_type: 'poet' } }],
        must: [
          {
            multi_match: {
              query,
              fields: ['poet_search^4'],
            },
          },
        ],
      },
    };
    const workSearchQuery = {
      bool: {
        filter: [{ term: { result_type: 'work' } }],
        must: [
          {
            multi_match: {
              query,
              fields: ['work.title^3'],
            },
          },
        ],
      },
    };
    const textSearchQuery = {
      bool: {
        filter: [{ term: { result_type: 'text' } }],
        must: [
          {
            multi_match: {
              query,
              fields: ['text.title^3', 'text.subtitles^2', 'text.content_html'],
            },
          },
        ],
      },
    };
    const body = {
      size: 10,
      from: page * 10,
      query: {
        bool: {
          must: [],
          filter: [],
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
      body.query.bool.must.push({
        bool: {
          should: [workSearchQuery, textSearchQuery],
          minimum_should_match: 1,
        },
      });
      body.query.bool.filter.push({
        term: { 'poet.country': country },
      });
    } else {
      body.query.bool.filter.push({
        bool: {
          should: [
            poetSearchQuery,
            {
              bool: {
                must: [workSearchQuery],
                filter: [{ term: { 'poet.country': country } }],
              },
            },
            {
              bool: {
                must: [textSearchQuery],
                filter: [{ term: { 'poet.country': country } }],
              },
            },
          ],
          minimum_should_match: 1,
        },
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

export default elasticSearchClient;
