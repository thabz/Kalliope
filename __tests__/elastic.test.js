const fileContents = new Map();

jest.mock('../tools/libs/helpers.js', () => ({
  htmlToXml: jest.fn(),
  replaceDashes: text => text,
  loadFile: filename => fileContents.get(filename) || Buffer.from(filename),
}));

jest.mock('../tools/libs/caching.js', () => ({
  loadCachedJSON: jest.fn(),
  writeCachedJSON: jest.fn(),
  force_reload: false,
}));

jest.mock('../tools/libs/elasticsearch-client.js', () => ({
  create: jest.fn(),
  createIndex: jest.fn(),
  indexExists: jest.fn(),
}));

jest.mock('../tools/build-static/concurrency.js', () => ({
  mapLimit: jest.fn(),
}));

jest.mock('../tools/build-static/xml.js', () => ({
  loadXMLDoc: jest.fn(),
  safeGetText: jest.fn(),
  safeGetAttr: jest.fn(),
  getChildByTagName: jest.fn(),
  getElementsByTagNames: jest.fn(),
  getChildrenByTagName: jest.fn(),
  getElementByTagName: jest.fn(),
  safeGetInnerXML: jest.fn(),
  tagName: jest.fn(),
}));

const elasticSearchClient = require('../tools/libs/elasticsearch-client.js');
const {
  loadCachedJSON,
  writeCachedJSON,
} = require('../tools/libs/caching.js');
const {
  buildElasticsearchSourceSnapshot,
  getElasticsearchSourceFiles,
  update_elasticsearch,
} = require('../tools/build-static/elastic.js');

const collected = {
  poets: new Map([['poet', { id: 'poet' }]]),
  workids: new Map([['poet', ['second', 'first']]]),
};

describe('Elasticsearch build-static step', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fileContents.clear();
  });

  test('builds a stable source file list', () => {
    expect(getElasticsearchSourceFiles(collected)).toEqual([
      'fdirs/poet/first.xml',
      'fdirs/poet/info.xml',
      'fdirs/poet/second.xml',
      'tools/build-static/elastic.js',
      'tools/build-static/xml.js',
      'tools/libs/elasticsearch-client.js',
      'tools/libs/helpers.js',
    ]);
  });

  test('skips Elasticsearch rebuild when sources are unchanged and index exists', async () => {
    const snapshot = buildElasticsearchSourceSnapshot(collected);

    loadCachedJSON.mockReturnValue(snapshot);
    elasticSearchClient.indexExists.mockResolvedValue(true);

    await update_elasticsearch(collected);

    expect(elasticSearchClient.createIndex).not.toHaveBeenCalled();
    expect(elasticSearchClient.create).not.toHaveBeenCalled();
    expect(writeCachedJSON).not.toHaveBeenCalled();
  });
});
