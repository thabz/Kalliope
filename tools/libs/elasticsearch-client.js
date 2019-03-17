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

const fields = [
  'text.title',
  'text.content_html',
  'text.subtitles',
  'poet.name.firstname',
  'poet.name.lastname',
];

class ElasticSearchClient {
  createIndex(index, lang) {
    const URL = `${URLPrefix}/${index}`;
    const analyzerNames = {
      da: 'danish',
      en: 'english',
      it: 'italian',
      fr: 'french',
      de: 'german',
      no: 'norwegian',
      sv: 'swedish',
    };

    const mappings = { _doc: {} };
    const handle = (obj, name, remaining) => {
      if (remaining.length === 0) {
        obj.properties = obj.properties || {};
        obj.properties[name] = {
          type: 'text',
          fields: {
            analyzed: {
              type: 'text',
              analyzer: analyzerNames[lang],
            },
          },
        };
      } else {
        let properties = obj.properties || {};
        let newObj = properties[name] || {};
        const newRemaining = remaining.slice();
        const newName = newRemaining.shift();
        handle(newObj, newName, newRemaining);
        properties[name] = newObj;
        obj['properties'] = properties;
      }
    };

    fields.forEach(path => {
      const pathItems = path.split('.');
      const name = pathItems.shift();
      handle(mappings._doc, name, pathItems);
    });

    //console.log(JSON.stringify({ mappings }, null, 2));
    return fetch(URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mappings }),
    })
      .then(res => {
        if (res.status !== 200) {
          return res.text();
        }
      })
      .then(body => {
        if (body) {
          // Vores PUT smider en fejl, hvis indexet allerede eksisterer.
          // Dette ignorerer vi. Enable nedenstående console.log hvis noget (andet)
          // fejler.
          //console.log(body);
        }
      });
  }

  create(index, id, json) {
    indexingQueue.push({ index, id, json }, err => {
      if (err) {
        //console.log(err);
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
                  // TODO: Byg nedenstående ud fra fields foroven.
                  'text.title',
                  'text.title.analyzed',
                  'text.content_html',
                  'text.content_html.analyzed',
                  'text.subtitles',
                  'text.subtitles.analyzed',
                  'poet.name.firstname',
                  'poet.name.firstname.analyzed',
                  'poet.name.lastname',
                  'poet.name.lastname.analyzed',
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
