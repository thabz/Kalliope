const { htmlToXml, replaceDashes } = require('../libs/helpers.js');
const { isFileModified, force_reload } = require('../libs/caching.js');
const {
  loadXMLDoc,
  safeGetText,
  safeGetAttr,
  getChildByTagName,
  getElementsByTagNames,
  getChildrenByTagName,
  getElementByTagName,
  safeGetInnerXML,
  tagName,
} = require('./xml.js');
const elasticSearchClient = require('../libs/elasticsearch-client.js');
const { mapLimit } = require('./concurrency.js');

const elasticsearchConcurrency = Math.max(
  1,
  parseInt(process.env.KALLIOPE_ELASTICSEARCH_CONCURRENCY, 10) || 1
);
const elasticsearchBulkSize = Math.max(
  1,
  parseInt(process.env.KALLIOPE_ELASTICSEARCH_BULK_SIZE, 10) || 500
);
const elasticsearchForceRebuild = ['1', 'true', 'yes'].includes(
  (process.env.KALLIOPE_ELASTICSEARCH_FORCE_REBUILD || '').toLowerCase()
);
const elasticsearchCodeSourceFiles = [
  'tools/build-static/elastic.js',
  'tools/build-static/xml.js',
  'tools/libs/elasticsearch-client.js',
  'tools/libs/helpers.js',
];

const getElasticsearchTextEntryKey = (poetId, workId) => `${poetId}-${workId}`;

const getElasticsearchTextEntrySourceFiles = (poetId, workId) => [
  `fdirs/${poetId}/info.xml`,
  `fdirs/${poetId}/${workId}.xml`,
];

const buildElasticsearchTextEntries = collected => {
  const entries = [];

  collected.poets.forEach((poet, poetId) => {
    collected.workids.get(poetId).forEach(workId => {
      entries.push({
        poet,
        poetId,
        workId,
        textEntryKey: getElasticsearchTextEntryKey(poetId, workId),
        sourceFiles: getElasticsearchTextEntrySourceFiles(poetId, workId),
      });
    });
  });

  return entries.sort((a, b) => a.textEntryKey.localeCompare(b.textEntryKey));
};

const getChangedElasticsearchTextEntries = textEntries => {
  const modifiedPoetIds = new Set();
  const modifiedTextEntryKeys = new Set();

  textEntries.forEach(entry => {
    if (isFileModified(`fdirs/${entry.poetId}/info.xml`)) {
      modifiedPoetIds.add(entry.poetId);
    } else if (isFileModified(`fdirs/${entry.poetId}/${entry.workId}.xml`)) {
      modifiedTextEntryKeys.add(entry.textEntryKey);
    }
  });

  return {
    modifiedPoetIds,
    entries: textEntries.filter(
      entry =>
        modifiedPoetIds.has(entry.poetId) ||
        modifiedTextEntryKeys.has(entry.textEntryKey)
    ),
  };
};

const getPoetSearchText = poet => {
  const name = poet.name || {};
  return [
    name.firstname,
    name.lastname,
    name.fullname,
    name.pseudonym,
    name.christened,
    name.realname,
    name.sortname,
  ]
    .filter(Boolean)
    .join(' ');
};

const buildElasticsearchPoetEntries = collected => {
  return Array.from(collected.poets.values()).map(poet => ({
    id: `poet-${poet.id}`,
    data: {
      result_type: 'poet',
      poet,
      poet_search: getPoetSearchText(poet),
    },
  }));
};

const buildElasticsearchTextEntryDocuments = (collected, entry) => {
  const { poet, poetId, workId, textEntryKey } = entry;
  const filename = `fdirs/${poetId}/${workId}.xml`;
  let doc = loadXMLDoc(filename);
  const work = getElementByTagName(doc, 'kalliopework');
  const workBody = getElementByTagName(work, 'workbody');
  const status = safeGetAttr(work, 'status');
  const type = safeGetAttr(work, 'type');
  const head = getChildByTagName(work, 'workhead');
  const title = safeGetText(head, 'title');
  const year = safeGetText(head, 'year');
  const workData = {
    id: workId,
    title,
    year,
    status,
    type,
  };
  const documents =
    title === 'Andre digte'
      ? []
      : [
          {
            id: textEntryKey,
            data: {
              result_type: 'work',
              poet,
              work: workData,
            },
          },
        ];

  if (workBody == null) {
    return documents;
  }

  getElementsByTagNames(workBody, ['text', 'section']).forEach(text => {
    const textId = safeGetAttr(text, 'id');
    if (tagName(text) === 'section' && textId == null) {
      return;
    }
    const head = getChildByTagName(text, 'head');
    const body = getChildByTagName(text, 'body');
    const title = (
      safeGetInnerXML(getChildByTagName(head, 'linktitle')) ||
      safeGetInnerXML(getChildByTagName(head, 'title')) ||
      safeGetInnerXML(getChildByTagName(head, 'firstline'))
    ).replace(/<num>.*<\/num>/, '');
    const keywords = safeGetText(head, 'keywords');
    let subtitles = null;
    const subtitle = getChildByTagName(head, 'subtitle');
    if (subtitle && getChildrenByTagName(subtitle, 'line').length > 0) {
      subtitles = getChildrenByTagName(subtitle, 'line').map(s =>
        replaceDashes(safeGetInnerXML(s))
      );
    } else if (subtitle) {
      const subtitleString = safeGetInnerXML(subtitle);
      if (subtitleString.indexOf('<subtitle/>') === -1) {
        subtitles = [replaceDashes(subtitleString)];
      }
    }
    let keywordsArray = null;
    if (keywords) {
      keywordsArray = keywords.split(',');
    }

    const textData = {
      id: textId,
      title: replaceDashes(title),
      subtitles,
      keywords: keywordsArray,
      content_html: htmlToXml(
        (safeGetInnerXML(body) || '')
          .replace(/<note>.*?<\/note>/g, '')
          .replace(/<footnote>.*?<\/footnote>/g, '')
          .replace(/<.*?>/g, ' '),
        collected,
        false
      )
        .map(line => line[0])
        .join(' ')
        .replace(/<.*?>/g, ' '),
    };
    const data = {
      poet,
      work: workData,
      text: textData,
    };
    documents.push({
      id: textId,
      data: {
        result_type: 'text',
        ...data,
      },
    });
  });

  return documents;
};

const chunkDocuments = documents => {
  const chunks = [];

  for (let i = 0; i < documents.length; i += elasticsearchBulkSize) {
    chunks.push(documents.slice(i, i + elasticsearchBulkSize));
  }

  return chunks;
};

const writeElasticsearchDocuments = async documents => {
  const chunks = chunkDocuments(documents);

  console.log(
    `Writing ${documents.length} Elasticsearch documents in ` +
      `${chunks.length} bulk request(s) with concurrency ` +
      elasticsearchConcurrency
  );
  let completed = 0;
  await mapLimit(
    chunks,
    async chunk => {
      const result = await elasticSearchClient.bulkCreate('kalliope', chunk);
      completed += chunk.length;
      if (
        completed % elasticsearchBulkSize === 0 ||
        completed === documents.length
      ) {
        console.log(
          `Wrote ${completed}/${documents.length} Elasticsearch documents`
        );
      }
      return result;
    },
    elasticsearchConcurrency
  );
};

const isElasticsearchUnavailable = error => {
  const unavailableCodes = new Set([
    'ECONNREFUSED',
    'ECONNRESET',
    'ENOTFOUND',
    'EHOSTUNREACH',
    'ETIMEDOUT',
  ]);
  let current = error;

  while (current != null) {
    if (
      unavailableCodes.has(current.code) ||
      unavailableCodes.has(current.errno)
    ) {
      return true;
    }
    if (
      /\b(ECONNREFUSED|ECONNRESET|ENOTFOUND|EHOSTUNREACH|ETIMEDOUT)\b/.test(
        current.message || ''
      )
    ) {
      return true;
    }
    current = current.cause;
  }

  return false;
};

const update_elasticsearch = async collected => {
  const indexElasticsearchPoetEntries = async entries => {
    await writeElasticsearchDocuments(entries);
  };

  const indexElasticsearchTextEntries = async entries => {
    const documents = [];

    entries.forEach(entry => {
      console.log(`Updating text entry ${entry.textEntryKey} in elasticsearch`);
      const textEntryDocuments = buildElasticsearchTextEntryDocuments(
        collected,
        entry
      );
      documents.push(...textEntryDocuments);
    });

    await writeElasticsearchDocuments(documents);
  };

  try {
    const textEntries = buildElasticsearchTextEntries(collected);
    const poetEntries = buildElasticsearchPoetEntries(collected);
    const indexExists = await elasticSearchClient.indexExists('kalliope');
    const codeModified = isFileModified(...elasticsearchCodeSourceFiles);
    const needsFullRebuild =
      force_reload ||
      elasticsearchForceRebuild ||
      !indexExists ||
      codeModified;

    if (needsFullRebuild) {
      await elasticSearchClient.createIndex('kalliope');
      await indexElasticsearchPoetEntries(poetEntries);
      await indexElasticsearchTextEntries(textEntries);
      await elasticSearchClient.refreshIndex('kalliope');
      return;
    }

    const {
      modifiedPoetIds,
      entries: changedTextEntries,
    } = getChangedElasticsearchTextEntries(textEntries);

    if (changedTextEntries.length === 0) {
      console.log('Skipping Elasticsearch update; no changed text entries');
      return;
    }

    await mapLimit(
      Array.from(modifiedPoetIds),
      poetId => elasticSearchClient.deletePoet('kalliope', poetId),
      elasticsearchConcurrency
    );
    await mapLimit(
      changedTextEntries.filter(entry => !modifiedPoetIds.has(entry.poetId)),
      entry =>
        elasticSearchClient.deleteWork(
          'kalliope',
          entry.poetId,
          entry.workId
        ),
      elasticsearchConcurrency
    );

    const changedPoetEntries = poetEntries.filter(entry =>
      modifiedPoetIds.has(entry.data.poet.id)
    );
    if (changedPoetEntries.length > 0) {
      await indexElasticsearchPoetEntries(changedPoetEntries);
    }
    await indexElasticsearchTextEntries(changedTextEntries);
    await elasticSearchClient.refreshIndex('kalliope');
  } catch (error) {
    if (isElasticsearchUnavailable(error)) {
      console.log(
        'Elasticsearch server not available; skipping search index update.'
      );
      console.log(error.message);
      return;
    }
    console.log('Elasticsearch update failed.');
    console.log(error);
    throw error;
  }
};

module.exports = {
  buildElasticsearchPoetEntries,
  buildElasticsearchTextEntries,
  getChangedElasticsearchTextEntries,
  update_elasticsearch,
};
