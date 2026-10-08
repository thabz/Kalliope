import crypto from 'crypto';
import zlib from 'zlib';
import fs from 'node:fs';
import { textPath } from '../common/paths.js';
import {
  deterministicGzip,
  jsonLines,
  normalizedFullText,
  buildTextAuditFields,
  buildPoetRecords,
  buildTextRecord,
  buildTextRecords,
  buildWorkRecords,
  validateRelations,
  validateRecordShapes,
} from '../tools/build-static/corpus-dataset.js';

describe('versioned corpus dataset', () => {
  it('uses rendered records and reads unchanged texts from disk with identical output', () => {
    const authorText = { id: 'one', poetId: 'poet', workId: 'book', title: 'En titel' };
    const unchangedText = { ...authorText, id: 'two', title: 'Anden titel' };
    const publicationText = { ...authorText, id: 'onea', indexable: false };
    const textData = {
      text: {
        content_lang: 'da',
        source: { pages: '12–13' },
        blocks: [{ lines: ['En linje', { source: 'En anden linje' }] }],
        has_footnotes: 1,
        footnotes_count: 2,
      },
    };
    const collected = {
      poets: new Map([['poet', { lang: 'da', name: { firstname: 'En', lastname: 'Digter' } }]]),
      works: new Map([['poet/book', { title: 'En bog' }]]),
      texts: new Map([['two', unchangedText], ['onea', publicationText], ['one', authorText]]),
    };
    const readFile = jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(textData));
    try {
      const diskRecords = buildTextRecords(collected);
      expect(readFile).toHaveBeenCalledTimes(2);
      readFile.mockClear();
      collected.corpusTextRecords = new Map([
        ['one', buildTextRecord(collected, authorText, textData)],
      ]);
      expect(buildTextRecords(collected)).toEqual(diskRecords);
      expect(readFile).toHaveBeenCalledTimes(1);
      expect(readFile).toHaveBeenCalledWith(textPath('two'), 'utf8');
      expect(diskRecords.map(record => record.id)).toEqual(['one', 'two']);
      expect(diskRecords[0]).toEqual(expect.objectContaining({
        full_text: 'En linje\nEn anden linje',
        source_pages: '12–13',
        has_footnotes: true,
        footnotes_count: 2,
      }));
    } finally {
      readFile.mockRestore();
    }
  });

  it('writes one JSON record per line in the supplied deterministic order', () => {
    expect(jsonLines([{ id: 'a' }, { id: 'b' }])).toBe(
      '{"id":"a"}\n{"id":"b"}\n'
    );
  });

  it('creates reproducible gzip bytes', () => {
    const content = jsonLines([{ id: 'a' }]);
    const first = deterministicGzip(content);
    const second = deterministicGzip(content);

    expect(crypto.createHash('sha256').update(first).digest('hex')).toBe(
      crypto.createHash('sha256').update(second).digest('hex')
    );
    expect(zlib.gunzipSync(first).toString('utf8')).toBe(content);
  });

  it('sorts work records by their stable global ID', () => {
    const works = new Map([
      ['z/work', { id: 'work', title: 'Z' }],
      ['a/work', { id: 'work', title: 'A' }],
    ]);
    expect(buildWorkRecords({ works }).map(work => work.id)).toEqual([
      'a/work',
      'z/work',
    ]);
  });

  it('preserves baptism data independently of birth data', () => {
    const poets = new Map([
      ['eltzholtz', {
        id: 'eltzholtz',
        country: 'dk',
        lang: 'da',
        type: 'poet',
        name: { firstname: 'Alberta', lastname: 'Eltzholtz' },
        period: {
          baptized: { date: '1846-05-24', place: null, inon: 'in' },
          dead: { date: '1934-05-19', place: null, inon: 'in' },
        },
      }],
    ]);

    const record = buildPoetRecords({ poets })[0];
    expect(record).not.toHaveProperty('born');
    expect(record).toEqual(expect.objectContaining({
      baptized: { date: '1846-05-24', place: null, inon: 'in' },
      dead: { date: '1934-05-19', place: null, inon: 'in' },
    }));
  });

  it('preserves nationality independently of the poet grouping country', () => {
    const poets = new Map([
      ['runeberg', {
        id: 'runeberg', country: 'un', nationality: 'fi', lang: 'sv', type: 'poet',
        name: { firstname: 'Johan Ludvig', lastname: 'Runeberg' },
      }],
    ]);
    expect(buildPoetRecords({ poets })[0]).toEqual(expect.objectContaining({
      country: 'un', nationality: 'fi',
    }));
  });

  it('normalizes text blocks without losing line boundaries', () => {
    expect(normalizedFullText({
      title: ' En titel ',
      blocks: [{ lines: [' Første   linje ', { source: 'Anden linje' }] }],
    })).toBe('En titel\nFørste linje\nAnden linje');
  });

  it('keeps common audit fields in text records', () => {
    const fields = buildTextAuditFields(
      {
        firstline: 'Første linje',
        dates: { written: ' 1840-01-02 ', performed: '', event: '1841' },
      },
      { text: { has_footnotes: 1, footnotes_count: 2 } },
      { pages: '12–13' },
    );

    expect(fields).toEqual({
      firstline: 'Første linje',
      events: [
        { type: 'written', date: '1840-01-02' },
        { type: 'event', date: '1841' },
      ],
      has_footnotes: true,
      footnotes_count: 2,
      source_pages: '12–13',
    });
  });

  it('rejects dangling poet and work references', () => {
    const poets = [{ id: 'poet' }];
    const works = [{ id: 'poet/work', poet_id: 'poet' }];
    expect(() => validateRelations(poets, works, [{ id: 'text', poet_id: 'poet', work_id: 'missing' }]))
      .toThrow('Korpusteksten text');
    expect(() => validateRelations(poets, [{ id: 'other/work', poet_id: 'other' }], []))
      .toThrow('Korpusværket other/work');
  });

  it('rejects records that do not satisfy their documented schema fields', () => {
    expect(() => validateRecordShapes(
      [{ id: 'poet' }],
      [],
      []
    )).toThrow('poet-posten poet mangler feltet name');
  });
});
