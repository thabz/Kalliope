import { htmlToXml, replaceDashes } from '../libs/helpers.js';
import { isFileModified, force_reload } from '../libs/caching.js';
import {
  loadXMLDoc,
  safeGetText,
  safeGetAttr,
  getChildByTagName,
  getElementsByTagNames,
  getChildrenByTagName,
  getElementByTagName,
  safeGetInnerXML,
  tagName,
} from './xml.js';
import elasticSearchClient from '../libs/elasticsearch-client.js';
import { mapLimit } from './concurrency.js';
import {
  sourceWorkFilename,
  textsForWork,
  worksForPoet,
} from './anthologies.js';

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
  'tools/build-static/anthologies.js',
  'tools/build-static/xml.js',
  'tools/libs/elasticsearch-client.js',
  'tools/libs/helpers.js',
];

const getElasticsearchTextEntryKey = (poetId, workId) => `${poetId}-${workId}`;

const getElasticsearchTextEntrySourceFiles = (poetId, workId, work) =>
  work.sourceFiles || [
    `fdirs/${poetId}/info.xml`,
    `fdirs/${poetId}/${workId}.xml`,
  ];

const buildElasticsearchTextEntries = collected => {
  const entries = [];

  collected.poets.forEach((poet, poetId) => {
    worksForPoet(collected, poetId).forEach(work => {
      const workId = work.id;
      entries.push({
        poet,
        poetId,
        workId,
        work,
        textEntryKey: getElasticsearchTextEntryKey(poetId, workId),
        sourceFiles: getElasticsearchTextEntrySourceFiles(
          poetId,
          workId,
          work
        ),
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
    } else if (isFileModified(...entry.sourceFiles)) {
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
  const { poet, poetId, workId, textEntryKey, work: workMeta } = entry;
  const workData = {
    id: workId,
    title: workMeta.title,
    year: workMeta.year,
    status: workMeta.status,
    type: workMeta.type,
    virtualType: workMeta.virtualType,
  };
  const documents =
    workData.title === 'Andre digte' || workMeta.virtualType === 'anthology'
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

  const appendTextDocument = (text, textId) => {
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
  };

  if (workMeta.virtualType === 'anthology') {
    textsForWork(collected, poetId, workId).forEach(textMeta => {
      const filename = sourceWorkFilename(textMeta);
      const doc = loadXMLDoc(filename);
      const sourceText = getElementsByTagNames(doc, ['text', 'section']).find(
        text => safeGetAttr(text, 'id') === textMeta.sourceTextId
      );
      if (sourceText == null) {
        throw new Error(
          `${filename} mangler antologiteksten ${textMeta.sourceTextId}.`
        );
      }
      appendTextDocument(sourceText, textMeta.id);
    });
  } else {
    const filename = `fdirs/${poetId}/${workId}.xml`;
    const doc = loadXMLDoc(filename);
    const work = getElementByTagName(doc, 'kalliopework');
    const workBody = getElementByTagName(work, 'workbody');
    if (workBody != null) {
      getElementsByTagNames(workBody, ['text', 'section']).forEach(text => {
        const textId = safeGetAttr(text, 'id');
        const textMeta = collected.texts.get(textId);
        if (
          textMeta != null &&
          textMeta.placement === 'author' &&
          textMeta.sourcePoetId === poetId &&
          textMeta.sourceWorkId === workId
        ) {
          return;
        }
        appendTextDocument(text, textId);
      });
    }
  }

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
      return;
    }
    console.log('Elasticsearch update failed.');
    console.log(error);
    throw error;
  }
};

export {
  buildElasticsearchPoetEntries,
  buildElasticsearchTextEntries,
  buildElasticsearchTextEntryDocuments,
  getChangedElasticsearchTextEntries,
  update_elasticsearch,
};
