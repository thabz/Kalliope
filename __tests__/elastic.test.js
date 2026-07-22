jest.mock('../tools/libs/helpers.js', () => ({
  htmlToXml: jest.fn(),
  replaceDashes: text => text,
}));

jest.mock('../tools/libs/caching.js', () => ({
  isFileModified: jest.fn(),
  force_reload: false,
}));

jest.mock('../tools/libs/elasticsearch-client.js', () => ({
  bulkCreate: jest.fn(),
  create: jest.fn(),
  createIndex: jest.fn(),
  deletePoet: jest.fn(),
  deleteWork: jest.fn(),
  indexExists: jest.fn(),
  refreshIndex: jest.fn(),
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

import * as elasticSearchClient from '../tools/libs/elasticsearch-client.js';
import { isFileModified } from '../tools/libs/caching.js';
import { htmlToXml } from '../tools/libs/helpers.js';
import * as xml from '../tools/build-static/xml.js';
import {
  buildElasticsearchPoetEntries,
  buildElasticsearchTextEntries,
  buildElasticsearchTextEntryDocuments,
  getChangedElasticsearchTextEntries,
  update_elasticsearch,
} from '../tools/build-static/elastic.js';

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
  works: new Map([
    [
      'poet/second',
      {
        id: 'second',
        title: 'Second',
        sourceFiles: ['fdirs/poet/info.xml', 'fdirs/poet/second.xml'],
      },
    ],
    [
      'poet/first',
      {
        id: 'first',
        title: 'First',
        sourceFiles: ['fdirs/poet/info.xml', 'fdirs/poet/first.xml'],
      },
    ],
  ]),
  texts: new Map(),
};

const collectedWithOtherPoems = {
  poets: collected.poets,
  workids: new Map([['poet', ['andre']]]),
  works: new Map([
    [
      'poet/andre',
      {
        id: 'andre',
        title: 'Andre digte',
        sourceFiles: ['fdirs/poet/info.xml', 'fdirs/poet/andre.xml'],
      },
    ],
  ]),
  texts: new Map(),
};

const bulkDocumentIds = () =>
  elasticSearchClient.bulkCreate.mock.calls.flatMap(call =>
    call[1].map(document => document.id)
  );

describe('Elasticsearch build-static step', () => {
  let consoleLog;

  beforeEach(() => {
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();
    elasticSearchClient.indexExists.mockResolvedValue(true);
    isFileModified.mockReturnValue(false);
    htmlToXml.mockReset();
    xml.loadXMLDoc.mockImplementation(() => 'doc');
    xml.safeGetText.mockImplementation((element, tagName) => tagName);
    xml.safeGetAttr.mockImplementation((element, attrName) => attrName);
    xml.getChildByTagName.mockImplementation(() => 'head');
    xml.getElementsByTagNames.mockImplementation(() => []);
    xml.getChildrenByTagName.mockImplementation(() => []);
    xml.getElementByTagName.mockImplementation((element, tagName) =>
      tagName === 'workbody' ? null : tagName
    );
    xml.safeGetInnerXML.mockImplementation(() => null);
    xml.tagName.mockReset();
  });

  afterEach(() => {
    consoleLog.mockRestore();
  });

  test('builds stable text entries', () => {
    expect(
      buildElasticsearchTextEntries(collected).map(entry => ({
        textEntryKey: entry.textEntryKey,
        sourceFiles: entry.sourceFiles,
      }))
    ).toEqual([
      {
        textEntryKey: 'poet-first',
        sourceFiles: ['fdirs/poet/info.xml', 'fdirs/poet/first.xml'],
      },
      {
        textEntryKey: 'poet-second',
        sourceFiles: ['fdirs/poet/info.xml', 'fdirs/poet/second.xml'],
      },
    ]);
  });

  test('finds changed text entries from the shared file cache', () => {
    isFileModified.mockImplementation((...filenames) =>
      filenames.includes('fdirs/poet/first.xml')
    );

    const result = getChangedElasticsearchTextEntries(
      buildElasticsearchTextEntries(collected)
    );

    expect(result.modifiedPoetIds.size).toBe(0);
    expect(result.entries.map(entry => entry.textEntryKey)).toEqual([
      'poet-first',
    ]);
  });

  test('builds searchable poet entries', () => {
    expect(buildElasticsearchPoetEntries(collected)).toEqual([
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
    expect(elasticSearchClient.bulkCreate).not.toHaveBeenCalled();
    expect(elasticSearchClient.refreshIndex).not.toHaveBeenCalled();
  });

  test('skips Elasticsearch when the local server is unavailable', async () => {
    const error = new Error('connect ECONNREFUSED 127.0.0.1:9200');
    error.code = 'ECONNREFUSED';
    elasticSearchClient.indexExists.mockRejectedValue(error);

    await expect(update_elasticsearch(collected)).resolves.toBeUndefined();

    expect(elasticSearchClient.createIndex).not.toHaveBeenCalled();
    expect(elasticSearchClient.deletePoet).not.toHaveBeenCalled();
    expect(elasticSearchClient.deleteWork).not.toHaveBeenCalled();
    expect(elasticSearchClient.create).not.toHaveBeenCalled();
    expect(consoleLog).toHaveBeenCalledWith(
      'Elasticsearch server not available; skipping search index update.'
    );
  });

  test('indexes only changed text entries', async () => {
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
    expect(elasticSearchClient.bulkCreate).toHaveBeenCalledTimes(1);
    expect(elasticSearchClient.bulkCreate).toHaveBeenCalledWith(
      'kalliope',
      [
        expect.objectContaining({
          id: 'poet-first',
          data: expect.objectContaining({
            result_type: 'work',
            poet: collected.poets.get('poet'),
            work: expect.objectContaining({ id: 'first' }),
          }),
        }),
      ]
    );
    expect(elasticSearchClient.refreshIndex).toHaveBeenCalledWith('kalliope');
  });

  test('skips work documents for Andre digte while indexing its texts', async () => {
    isFileModified.mockImplementation((...filenames) =>
      filenames.includes('fdirs/poet/andre.xml')
    );
    xml.getElementByTagName.mockImplementation((element, tagName) => tagName);
    xml.safeGetText.mockImplementation((element, tagName) =>
      tagName === 'title' ? 'Andre digte' : tagName
    );
    xml.safeGetAttr.mockImplementation((element, attrName) =>
      attrName === 'id' ? 'poet-andre-text' : attrName
    );
    xml.getElementsByTagNames.mockReturnValue(['text']);
    xml.tagName.mockReturnValue('text');
    xml.safeGetInnerXML.mockImplementation(element =>
      element === 'body' ? 'Tekstindhold' : 'Teksttitel'
    );
    htmlToXml.mockReturnValue([['Tekstindhold']]);

    await update_elasticsearch(collectedWithOtherPoems);

    expect(elasticSearchClient.bulkCreate).toHaveBeenCalledWith('kalliope', [
      expect.objectContaining({
        id: 'poet-andre-text',
        data: expect.objectContaining({
          result_type: 'text',
          poet: collected.poets.get('poet'),
          work: expect.objectContaining({
            id: 'andre',
            title: 'Andre digte',
          }),
        }),
      }),
    ]);
  });

  test('indexes an anthology text only under its author placement', () => {
    const sourcePoet = { id: 'anthology', name: { fullname: 'Antologi' } };
    const author = { id: 'author', name: { fullname: 'Forfatter' } };
    const sourceWork = {
      id: '1872',
      title: 'Antologien',
      sourceFiles: ['fdirs/anthology/info.xml', 'fdirs/anthology/1872.xml'],
    };
    const virtualWork = {
      id: 'antologier',
      title: 'Tekster i andre udgivelser',
      virtualType: 'anthology',
      sourceFiles: [
        'fdirs/author/info.xml',
        'fdirs/anthology/info.xml',
        'fdirs/anthology/1872.xml',
      ],
    };
    const anthologyCollected = {
      poets: new Map([
        ['anthology', sourcePoet],
        ['author', author],
      ]),
      works: new Map([
        ['anthology/1872', sourceWork],
        ['author/antologier', virtualWork],
      ]),
      texts: new Map([
        [
          'anthology-text',
          {
            id: 'anthology-text',
            poetId: 'author',
            workId: 'antologier',
            placement: 'author',
            sourcePoetId: 'anthology',
            sourceWorkId: '1872',
            sourceTextId: 'anthology-text',
          },
        ],
        [
          'anthology-texta',
          {
            id: 'anthology-texta',
            poetId: 'anthology',
            workId: '1872',
            placement: 'publication',
            sourcePoetId: 'anthology',
            sourceWorkId: '1872',
            sourceTextId: 'anthology-text',
            indexable: false,
          },
        ],
      ]),
    };
    const sourceText = { node: 'source-text' };
    xml.getElementByTagName.mockImplementation((element, tagName) => tagName);
    xml.getElementsByTagNames.mockReturnValue([sourceText]);
    xml.safeGetAttr.mockImplementation((element, attrName) => {
      if (element === sourceText && attrName === 'id') {
        return 'anthology-text';
      }
      return null;
    });
    xml.safeGetInnerXML.mockImplementation(element =>
      element === 'body' ? 'Tekstindhold' : 'Teksttitel'
    );
    xml.tagName.mockReturnValue('text');
    htmlToXml.mockReturnValue([['Tekstindhold']]);

    const entries = buildElasticsearchTextEntries(anthologyCollected);
    const physicalDocuments = buildElasticsearchTextEntryDocuments(
      anthologyCollected,
      entries.find(entry => entry.textEntryKey === 'anthology-1872')
    );
    const authorDocuments = buildElasticsearchTextEntryDocuments(
      anthologyCollected,
      entries.find(entry => entry.textEntryKey === 'author-antologier')
    );

    expect(physicalDocuments.map(document => document.id)).toEqual([
      'anthology-1872',
    ]);
    expect(authorDocuments).toEqual([
      expect.objectContaining({
        id: 'anthology-text',
        data: expect.objectContaining({
          result_type: 'text',
          poet: author,
          work: expect.objectContaining({
            id: 'antologier',
            virtualType: 'anthology',
          }),
        }),
      }),
    ]);
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
    expect(bulkDocumentIds()).toEqual([
      'poet-poet',
      'poet-first',
      'poet-second',
    ]);
    expect(elasticSearchClient.refreshIndex).toHaveBeenCalledWith('kalliope');
  });

  test('rebuilds the full index when the index is missing', async () => {
    elasticSearchClient.indexExists.mockResolvedValue(false);

    await update_elasticsearch(collected);

    expect(elasticSearchClient.createIndex).toHaveBeenCalledWith('kalliope');
    expect(elasticSearchClient.deletePoet).not.toHaveBeenCalled();
    expect(elasticSearchClient.deleteWork).not.toHaveBeenCalled();
    expect(bulkDocumentIds()).toEqual([
      'poet-poet',
      'poet-first',
      'poet-second',
    ]);
    expect(
      consoleLog.mock.calls.some(([message]) =>
        message.startsWith('Updating text entry ')
      )
    ).toBe(false);
    expect(elasticSearchClient.refreshIndex).toHaveBeenCalledWith('kalliope');
  });
});
