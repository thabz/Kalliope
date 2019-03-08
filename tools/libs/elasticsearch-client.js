const fetch = require('node-fetch');
const queue = require('async/queue');

/*

// Search all 
curl -XGET "http://localhost:9200/kalliope-dk/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match_all": {}
  }
}'
// Show all indices
curl -XGET "http://localhost:9200/_cat/indices?v"

// Delete all indices
curl -XDELETE "http://localhost:9200/kalliope-*"

*/

const URLPrefix = 'http://localhost:9200';

const indexingQueue = queue((task, callback) => {
  const { index, id, json } = task;
  const URL = `${URLPrefix}/${index}/_doc/${id}`;
  const body = JSON.stringify(json);
  return fetch(URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body,
  })
    .then(res => {
      return res.json();
    })
    .then(json => {
      callback(json);
      return json;
    })
    .catch(error => {
      callback(error);
      return null;
    });
}, 100);

class ElasticSearchClient {
  createIndex(index, lang) {
    const URL = `${URLPrefix}/${index}`;
    const fields = ['title', 'content_html', 'subtitles'];
    const analyzerNames = {
      da: 'danish',
      en: 'english',
      it: 'italian',
      fr: 'french',
      de: 'german',
      no: 'norwegian',
      sv: 'swedish',
    };
    const properties = {};
    fields.forEach(field => {
      properties[field] = {
        type: 'string',
        fields: {
          analyzed: {
            type: 'string',
            analyzer: analyzerNames[lang],
          },
        },
      };
    });
    const mappings = {
      mappings: {
        _doc: {
          properties: properties,
        },
      },
    };
    return fetch(URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: mappings,
    });
  }

  create(index, id, json) {
    indexingQueue.push({ index, id, json }, err => {
      if (err) {
        console.log(err);
      }
    });
  }

  // Returns the raw JSON as (a promise of) text, not as an object.
  search(index, country, poetId, query, page = 0) {
    const URL = `${URLPrefix}/${index}/_search`;
    const body = {
      size: 10,
      from: page * 10,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                type: 'most_fields',
                query: query,
                fields: [
                  'text.title',
                  'text.title.analyzed',
                  'text.content_html',
                  'text.content_html.analyzed',
                  'text.subtitles',
                  'text.subtitles.analyzed',
                ],
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
