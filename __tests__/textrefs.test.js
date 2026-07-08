import { extractTextRefs } from '../tools/build-static/textrefs.js';

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
});
