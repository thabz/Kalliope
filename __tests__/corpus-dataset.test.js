import crypto from 'crypto';
import zlib from 'zlib';
import {
  deterministicGzip,
  jsonLines,
  normalizedFullText,
  buildTextAuditFields,
  buildWorkRecords,
  validateRelations,
  validateRecordShapes,
} from '../tools/build-static/corpus-dataset.js';

describe('versioned corpus dataset', () => {
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
