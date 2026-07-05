jest.mock('../tools/libs/helpers.js', () => ({
  htmlToXml: jest.fn(),
  replaceDashes: text => text,
}));

jest.mock('../tools/libs/caching.js', () => ({
  isFileModified: jest.fn(),
  force_reload: false,
}));

jest.mock('../tools/libs/elasticsearch-client.js', () => ({
  create: jest.fn(),
  createIndex: jest.fn(),
  deletePoet: jest.fn(),
  deleteWork: jest.fn(),
  indexExists: jest.fn(),
}));

jest.mock('../tools/build-static/concurrency.js', () => ({
  mapLimit: jest.fn(async (items, fn) => Promise.all(items.map(fn))),
}));

jest.mock('../tools/build-static/xml.js', () => ({
  loadXMLDoc: jest.fn(() => 'doc'),
  safeGetText: jest.fn((element, tagName) => tagName),
  safeGetAttr: jest.fn((element, attrName) => attrName),
  getChildByTagName: jest.fn(() => 'head'),
  getElementsByTagNames: jest.fn(() => []),
  getChildrenByTagName: jest.fn(() => []),
  getElementByTagName: jest.fn((element, tagName) =>
    tagName === 'workbody' ? null : tagName
  ),
  safeGetInnerXML: jest.fn(() => null),
  tagName: jest.fn(),
}));

const elasticSearchClient = require('../tools/libs/elasticsearch-client.js');
const { isFileModified } = require('../tools/libs/caching.js');
const {
  buildElasticsearchPoetDocuments,
  getChangedElasticsearchWorkEntries,
  getElasticsearchWorkEntries,
  update_elasticsearch,
} = require('../tools/build-static/elastic.js');

const collected = {
  poets: new Map([
    [
      'poet',
      {
        id: 'poet',
        name: {
          firstname: 'Emil',
          lastname: 'Aarestrup',
          fullname: 'Carl Ludvig Emil Aarestrup',
        },
      },
    ],
  ]),
  workids: new Map([['poet', ['second', 'first']]]),
};

describe('Elasticsearch build-static step', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    elasticSearchClient.indexExists.mockResolvedValue(true);
    isFileModified.mockReturnValue(false);
  });

  test('builds stable work entries', () => {
    expect(
      getElasticsearchWorkEntries(collected).map(entry => ({
        workKey: entry.workKey,
        sourceFiles: entry.sourceFiles,
      }))
    ).toEqual([
      {
        workKey: 'poet-first',
        sourceFiles: ['fdirs/poet/info.xml', 'fdirs/poet/first.xml'],
      },
      {
        workKey: 'poet-second',
        sourceFiles: ['fdirs/poet/info.xml', 'fdirs/poet/second.xml'],
      },
    ]);
  });

  test('finds changed works from the shared file cache', () => {
    isFileModified.mockImplementation((...filenames) =>
      filenames.includes('fdirs/poet/first.xml')
    );

    const result = getChangedElasticsearchWorkEntries(
      getElasticsearchWorkEntries(collected)
    );

    expect(result.modifiedPoetIds.size).toBe(0);
    expect(result.entries.map(entry => entry.workKey)).toEqual(['poet-first']);
  });

  test('builds searchable poet documents', () => {
    expect(buildElasticsearchPoetDocuments(collected)).toEqual([
      {
        id: 'poet-poet',
        data: {
          result_type: 'poet',
          poet: collected.poets.get('poet'),
          poet_search: 'Emil Aarestrup Carl Ludvig Emil Aarestrup',
        },
      },
    ]);
  });

  test('skips Elasticsearch when no works changed and index exists', async () => {
    await update_elasticsearch(collected);

    expect(elasticSearchClient.createIndex).not.toHaveBeenCalled();
    expect(elasticSearchClient.deletePoet).not.toHaveBeenCalled();
    expect(elasticSearchClient.deleteWork).not.toHaveBeenCalled();
    expect(elasticSearchClient.create).not.toHaveBeenCalled();
  });

  test('skips Elasticsearch when the local server is unavailable', async () => {
    const error = new Error('connect ECONNREFUSED 127.0.0.1:9200');
    error.code = 'ECONNREFUSED';
    elasticSearchClient.indexExists.mockRejectedValue(error);
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(update_elasticsearch(collected)).resolves.toBeUndefined();

    expect(elasticSearchClient.createIndex).not.toHaveBeenCalled();
    expect(elasticSearchClient.deletePoet).not.toHaveBeenCalled();
    expect(elasticSearchClient.deleteWork).not.toHaveBeenCalled();
    expect(elasticSearchClient.create).not.toHaveBeenCalled();
    expect(consoleLog).toHaveBeenCalledWith(
      'Elasticsearch server not available; skipping search index update.'
    );

    consoleLog.mockRestore();
  });

  test('indexes only changed works', async () => {
    isFileModified.mockImplementation((...filenames) =>
      filenames.includes('fdirs/poet/first.xml')
    );

    await update_elasticsearch(collected);

    expect(elasticSearchClient.createIndex).not.toHaveBeenCalled();
    expect(elasticSearchClient.deletePoet).not.toHaveBeenCalled();
    expect(elasticSearchClient.deleteWork).toHaveBeenCalledTimes(1);
    expect(elasticSearchClient.deleteWork).toHaveBeenCalledWith(
      'kalliope',
      'poet',
      'first'
    );
    expect(elasticSearchClient.create).toHaveBeenCalledTimes(1);
    expect(elasticSearchClient.create).toHaveBeenCalledWith(
      'kalliope',
      'text',
      'poet-first',
      expect.objectContaining({
        poet: collected.poets.get('poet'),
        work: expect.objectContaining({ id: 'first' }),
      })
    );
  });

  test('reindexes all poet works when poet info changed', async () => {
    isFileModified.mockImplementation((...filenames) =>
      filenames.includes('fdirs/poet/info.xml')
    );

    await update_elasticsearch(collected);

    expect(elasticSearchClient.deletePoet).toHaveBeenCalledTimes(1);
    expect(elasticSearchClient.deletePoet).toHaveBeenCalledWith(
      'kalliope',
      'poet'
    );
    expect(elasticSearchClient.deleteWork).not.toHaveBeenCalled();
    expect(elasticSearchClient.create).toHaveBeenCalledTimes(3);
    expect(elasticSearchClient.create.mock.calls.map(call => call[2])).toEqual([
      'poet-poet',
      'poet-first',
      'poet-second',
    ]);
  });

  test('rebuilds the full index when the index is missing', async () => {
    elasticSearchClient.indexExists.mockResolvedValue(false);

    await update_elasticsearch(collected);

    expect(elasticSearchClient.createIndex).toHaveBeenCalledWith('kalliope');
    expect(elasticSearchClient.deletePoet).not.toHaveBeenCalled();
    expect(elasticSearchClient.deleteWork).not.toHaveBeenCalled();
    expect(elasticSearchClient.create).toHaveBeenCalledTimes(3);
    expect(elasticSearchClient.create.mock.calls.map(call => call[2])).toEqual([
      'poet-poet',
      'poet-first',
      'poet-second',
    ]);
  });
});
