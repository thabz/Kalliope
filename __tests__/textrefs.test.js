jest.mock('../tools/libs/caching.js', () => ({
  isFileModified: jest.fn(() => false),
  loadCachedJSON: jest.fn(() => null),
  writeCachedJSON: jest.fn(),
  force_reload: false,
  markFileDirty: jest.fn(),
}));

import { markFileDirty } from '../tools/libs/caching.js';
import {
  collectTextRefs,
  extractTextRefs,
  markChangedTextRefDestinationsDirty,
} from '../tools/build-static/textrefs.js';

describe('text refs', () => {
  beforeEach(() => {
    markFileDirty.mockClear();
  });

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

  it('does not dirty destinations when source refs are unchanged', () => {
    const refs = new Map([
      ['target1', { mention: ['source1'], translation: [] }],
    ]);
    const collected = {
      texts: new Map([
        ['target1', { poetId: 'target-poet', workId: 'target-work' }],
      ]),
    };

    markChangedTextRefDestinationsDirty(refs, refs, collected);

    expect(markFileDirty).not.toHaveBeenCalled();
  });

  it('dirties only the destination whose source ref was removed', () => {
    const before = new Map([
      ['target1', { mention: ['source1'], translation: [] }],
      ['target2', { mention: ['source2'], translation: [] }],
    ]);
    const after = new Map([
      ['target2', { mention: ['source2'], translation: [] }],
    ]);
    const collected = {
      texts: new Map([
        ['target1', { poetId: 'target-poet', workId: 'target-work' }],
        ['target2', { poetId: 'other-poet', workId: 'other-work' }],
      ]),
    };

    markChangedTextRefDestinationsDirty(before, after, collected);

    expect(markFileDirty).toHaveBeenCalledTimes(1);
    expect(markFileDirty).toHaveBeenCalledWith(
      'fdirs/target-poet/target-work.xml'
    );
  });

  it('removes stale refs when a modified source no longer links to a target', () => {
    const refs = collectTextRefs(
      new Map([['fdirs/source/one.xml', []]])
    );

    expect(refs.has('target1')).toBe(false);
  });
});
