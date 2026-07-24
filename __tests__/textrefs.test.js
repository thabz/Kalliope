import {
  collectTextRefs,
  extractTextRefs,
} from '../tools/build-static/textrefs.js';

describe('text refs', () => {
  it('groups ordinary refs and translations from xrefs', () => {
    expect(
      extractTextRefs(`
        <note>
          <xref poem="goethe2001111901"/>
          <xref type="translation" poem="goethe2001111902"/>
          <xref poem="goethe2001111903" type="translation"/>
          <a poem="goethe2001111904"/>
          <xref bibel="bibeljohannes01,1"/>
        </note>
      `)
    ).toEqual([
      { toId: 'goethe2001111901', type: 'mention' },
      { toId: 'goethe2001111902', type: 'translation' },
      { toId: 'goethe2001111903', type: 'translation' },
      { toId: 'goethe2001111904', type: 'mention' },
      { toId: 'bibeljohannes01', type: 'mention' },
    ]);
  });

  it('produces unchanged destination refs when only source whitespace changes', () => {
    const before = collectTextRefs(
      new Map([
        [
          'fdirs/source/one.xml',
          [{ fromId: 'source1', toId: 'target1', type: 'mention' }],
        ],
      ])
    );
    const after = collectTextRefs(
      new Map([
        [
          'fdirs/source/one.xml',
          [{ fromId: 'source1', toId: 'target1', type: 'mention' }],
        ],
      ])
    );

    expect(after).toEqual(before);
  });

  it('removes stale refs when a modified source no longer links to a target', () => {
    const refs = collectTextRefs(
      new Map([['fdirs/source/one.xml', []]])
    );

    expect(refs.has('target1')).toBe(false);
  });
});
