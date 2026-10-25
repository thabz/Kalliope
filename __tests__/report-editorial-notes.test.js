import { inspectWork, inventoryHash, reviewExceptions } from '../tools/report-editorial-notes.js';

const text = (id, head = '', body = '') => `<text id="${id}"><head>${head}</head><body><poetry>${body}</poetry></body></text>`;
const work = (head = '', body = '') => `<kalliopework id="test" author="test"><workhead>${head}</workhead><workbody>${body}</workbody></kalliopework>`;
const inspect = xml => inspectWork(xml, 'fdirs/test/test.xml');

describe('editorial note inventory', () => {
  it.each([
    'Noter med en foranstillet asterisk er digterens egne.',
    'Noter med foranstillet * er forfatterens egne.',
    'Noter med foranstillet asteriks er Winthers egne.',
    'Noterne markeret med * er Johannes Dams egne.',
    'Udgiveren Vilhelm Andersens noter angivet med asterisk.',
    '* Noter med en foranstillet asterisk er digterens egne.',
  ])('groups the explicit work convention without silently marking notes: %s', declaration => {
    const rows = inspect(work(`<notes><note>${declaration}</note></notes>`, text('one', '', 'Ord<note>* Trykt.</note><footnote>Tilføjet.</footnote>')));
    expect(rows.map(row => row.group)).toEqual(['asterisk-declaration', 'declared-source', 'declared-editorial']);
    expect(rows.every(row => row.editorial === false)).toBe(true);
    expect(rows.map(row => row.declaration)).toEqual([0, 0, 0]);
  });

  it('keeps a text convention local and includes notes in headings', () => {
    const xml = work('', text('one', '<notes><note>Noter med foranstillet * er forfatterens egne.</note></notes><title>Titel<footnote>* Trykt.</footnote></title>', 'Ord<note>Tilføjet.</note>') +
      text('two', '', 'Ord<note>* Ukendt her.</note><note>Ukendt her.</note>'));
    const rows = inspect(xml);
    expect(rows.map(row => row.group)).toEqual(['asterisk-declaration', 'declared-source', 'declared-editorial', 'asterisk-without-declaration', 'other-inline']);
    expect(rows.map(row => row.scope)).toEqual(['one', 'one', 'one', 'two', 'two']);
    expect(rows[3].declaration).toBeNull();
  });

  it('distinguishes all printed footnotes from unstarred notes in the Rode convention', () => {
    const rows = inspect(work('', text('one', '<notes><note>Alle fodnoter og noter markeret med asterisk er Rodes egne.</note></notes>',
      'Ord<footnote>Trykt.</footnote><note>* Trykt.</note><note>Tilføjet.</note>')));
    expect(rows.map(row => row.group)).toEqual(['asterisk-declaration', 'declared-source', 'declared-source', 'declared-editorial']);
  });

  it('reports physical lines correctly despite XML comments, CDATA and Unicode separators', () => {
    const xml = '<kalliopework>\r\n<!-- <note>Eksempel.</note> -->\r\n<body>æ\u2028<note>Rigtig.</note><![CDATA[<note>Eksempel.</note>]]></body></kalliopework>';
    const rows = inspect(xml);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ line: 3, column: 9, text: 'Rigtig.', index: 0 });
  });

  it('keeps note identity independent of the added provenance attribute', () => {
    const before = inspect(work('<notes><note type="credits">Bidrag.</note></notes>'));
    const after = inspect(work('<notes><note editorial="true" type="credits">Bidrag.</note></notes>'));
    expect(after[0].hash).toBe(before[0].hash);
    expect(after[0].editorial).toBe(true);
    expect(inventoryHash(after)).not.toBe(inventoryHash(before));
    expect(inventoryHash(before)).toBe(inventoryHash(inspect(work('<notes><note type="credits">Bidrag.</note></notes>'))));
  });

  it('rejects malformed XML and excludes other document types', () => {
    expect(() => inspect('<kalliopework><note></kalliopework>')).toThrow();
    expect(inspect('<person><note>Metadata.</note></person>')).toEqual([]);
  });
});

describe('documented uncertainties', () => {
  const rows = inspect(work('', text('one', '', 'Ord<note>Ukendt ophav.</note>')));
  const groups = [{ reason: 'Ophavet er ikke dokumenteret.', files: {
    'fdirs/test/test.xml': [{ scope: rows[0].scope, hash: rows[0].hash }],
  } }];

  it('resolves an exception by content and owner even when its ordinal changes', () => {
    expect(reviewExceptions([{ ...rows[0], index: 20 }], groups)[0]).toMatchObject({
      index: 20, uncertainty: 'Ophavet er ikke dokumenteret.',
    });
  });

  it('does not silently lose or mark an unresolved note', () => {
    expect(() => reviewExceptions([], groups)).toThrow(/ændret eller mangler/);
    expect(() => reviewExceptions([{ ...rows[0], editorial: true }], groups)).toThrow(/editorial-markering/);
    expect(() => reviewExceptions(rows, [...groups, ...groups])).toThrow(/Gentaget undtagelse/);
  });
});
