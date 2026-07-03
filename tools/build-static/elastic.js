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
const elasticsearchForceRebuild = ['1', 'true', 'yes'].includes(
  (process.env.KALLIOPE_ELASTICSEARCH_FORCE_REBUILD || '').toLowerCase()
);
const elasticsearchCodeSourceFiles = [
  'tools/build-static/elastic.js',
  'tools/build-static/xml.js',
  'tools/libs/elasticsearch-client.js',
  'tools/libs/helpers.js',
];

const getElasticsearchWorkKey = (poetId, workId) => `${poetId}-${workId}`;

const getElasticsearchWorkSourceFiles = (poetId, workId) => [
  `fdirs/${poetId}/info.xml`,
  `fdirs/${poetId}/${workId}.xml`,
];

const getElasticsearchWorkEntries = collected => {
  const entries = [];

  collected.poets.forEach((poet, poetId) => {
    collected.workids.get(poetId).forEach(workId => {
      entries.push({
        poet,
        poetId,
        workId,
        workKey: getElasticsearchWorkKey(poetId, workId),
        sourceFiles: getElasticsearchWorkSourceFiles(poetId, workId),
      });
    });
  });

  return entries.sort((a, b) => a.workKey.localeCompare(b.workKey));
};

const getChangedElasticsearchWorkEntries = workEntries => {
  const modifiedPoetIds = new Set();
  const modifiedWorkKeys = new Set();

  workEntries.forEach(entry => {
    if (isFileModified(`fdirs/${entry.poetId}/info.xml`)) {
      modifiedPoetIds.add(entry.poetId);
    } else if (isFileModified(`fdirs/${entry.poetId}/${entry.workId}.xml`)) {
      modifiedWorkKeys.add(entry.workKey);
    }
  });

  return {
    modifiedPoetIds,
    entries: workEntries.filter(
      entry =>
        modifiedPoetIds.has(entry.poetId) || modifiedWorkKeys.has(entry.workKey)
    ),
  };
};

const buildElasticsearchWorkDocuments = (collected, entry) => {
  const { poet, poetId, workId, workKey } = entry;
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
  const documents = [
    {
      id: workKey,
      data: {
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
      data,
    });
  });

  return documents;
};

const writeElasticsearchDocuments = async documents => {
  console.log(
    `Writing ${documents.length} Elasticsearch documents with concurrency ${elasticsearchConcurrency}`
  );
  let completed = 0;
  await mapLimit(
    documents,
    async document => {
      const result = await elasticSearchClient.create(
        'kalliope',
        'text',
        document.id,
        document.data
      );
      completed += 1;
      if (completed % 100 === 0 || completed === documents.length) {
        console.log(
          `Wrote ${completed}/${documents.length} Elasticsearch documents`
        );
      }
      return result;
    },
    elasticsearchConcurrency
  );
};

const update_elasticsearch = async collected => {
  const indexWorks = async entries => {
    const documents = [];

    entries.forEach(entry => {
      console.log(`Updating work ${entry.workKey} in elasticsearch`);
      const workDocuments = buildElasticsearchWorkDocuments(collected, entry);
      documents.push(...workDocuments);
    });

    await writeElasticsearchDocuments(documents);
  };

  try {
    const workEntries = getElasticsearchWorkEntries(collected);
    const indexExists = await elasticSearchClient.indexExists('kalliope');
    const codeModified = isFileModified(...elasticsearchCodeSourceFiles);
    const needsFullRebuild =
      force_reload ||
      elasticsearchForceRebuild ||
      !indexExists ||
      codeModified;

    if (needsFullRebuild) {
      await elasticSearchClient.createIndex('kalliope');
      await indexWorks(workEntries);
      return;
    }

    const {
      modifiedPoetIds,
      entries: changedWorkEntries,
    } = getChangedElasticsearchWorkEntries(workEntries);

    if (changedWorkEntries.length === 0) {
      console.log('Skipping Elasticsearch update; no changed works');
      return;
    }

    await mapLimit(
      Array.from(modifiedPoetIds),
      poetId => elasticSearchClient.deletePoet('kalliope', poetId),
      elasticsearchConcurrency
    );
    await mapLimit(
      changedWorkEntries.filter(entry => !modifiedPoetIds.has(entry.poetId)),
      entry =>
        elasticSearchClient.deleteWork(
          'kalliope',
          entry.poetId,
          entry.workId
        ),
      elasticsearchConcurrency
    );

    await indexWorks(changedWorkEntries);
  } catch (error) {
    console.log('Elasticsearch update failed.');
    console.log(error);
    throw error;
  }
};

module.exports = {
  getChangedElasticsearchWorkEntries,
  getElasticsearchWorkEntries,
  update_elasticsearch,
};
