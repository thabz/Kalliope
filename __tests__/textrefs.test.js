const {
  extractTextRefs,
  removeTextRefSources,
} = require('../tools/build-static/textrefs.js');

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

  it('removes stale refs before rebuilding changed texts', () => {
    const textrefs = new Map([
      [
        'goethe2001111901',
        {
          mention: ['frankenau2001070319', 'kaalund2018061908'],
          translation: ['blicher20030915108', 'frankenau2001070319'],
        },
      ],
      [
        'goethe2001111902',
        {
          mention: ['frankenau2001070319'],
          translation: [],
        },
      ],
    ]);

    removeTextRefSources(textrefs, ['frankenau2001070319']);

    expect(textrefs.get('goethe2001111901')).toEqual({
      mention: ['kaalund2018061908'],
      translation: ['blicher20030915108'],
    });
    expect(textrefs.has('goethe2001111902')).toBe(false);
  });
});
