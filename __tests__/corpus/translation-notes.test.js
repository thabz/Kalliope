import { collectTranslationNoteIssues } from '../../tools/translation-note-validation.js';
import { parseWorkXml } from '../../tools/work-validation.js';

const authors = new Map([
  ['original', { id: 'goethe', names: ['Johann Wolfgang von Goethe', 'Goethe'] }],
  ['anonymous', { id: 'anonymous', names: ['Anonymous'], anonymous: true }],
  ['second', { id: 'burns', names: ['Robert Burns', 'Burns'] }],
]);
const inspect = note => collectTranslationNoteIssues('work.xml', parseWorkXml(
  `<kalliopework><text id="translation"><head><notes>${note}</notes></head></text></kalliopework>`,
), id => authors.get(id));

describe('explanatory translation notes', () => {
  it.each([
    '<note><xref poem="original"/></note>',
    '<note> <xref type="translation" poem="original"/>. </note>',
  ])('rejects bare poem references: %s', note => {
    expect(inspect(note)).toHaveLength(1);
    expect(inspect(note)[0]).toContain('work.xml: translation:');
  });

  it.each([
    'Oversættelse af Goethes', 'Gendigtning af Goethe:',
    'Fri gendigtning af dele af Goethes', 'Efter Goethe',
    'De sidste ti vers bygger på Goethes',
    'Gendigtning af Johann Wolfgang von Goethes',
    'Gendigtning af <a poet="goethe">Goethes</a>',
    'Gendigtning af <xref person="goethe"/>',
    'Oversættelse\n af  Goethes',
  ])('allows free wording and author markup: %s', prefix => {
    expect(inspect(`<note>${prefix} <xref type="translation" poem="original"/>.</note>`)).toEqual([]);
  });

  it('preserves printed quotations and explicit cross-reference labels', () => {
    expect(inspect('<note><a poem="original">Jf. s. 22.</a></note>')).toEqual([]);
  });

  it('accepts line-specific references', () => {
    expect(inspect('<note>Efter Goethe <xref type="translation" poem="original,2-8"/>.</note>')).toEqual([]);
  });

  it('allows explanatory references to anonymous originals without inventing an author', () => {
    expect(inspect('<note>Oversættelse af en skotsk folkevise <xref type="translation" poem="anonymous"/>.</note>')).toEqual([]);
  });

  it('requires the original author rather than any name', () => {
    expect(inspect('<note>Oversættelse af Schillers <xref type="translation" poem="original"/>.</note>'))
      .toEqual([expect.stringContaining('mangler digternavn')]);
  });

  it.each(['Goethes', 'Af Goethe', '<a poet="goethe">Goethe</a>'])('requires an explanation beyond the name: %s', prefix => {
    expect(inspect(`<note>${prefix} <xref type="translation" poem="original"/>.</note>`))
      .toEqual([expect.stringContaining('forklaring af relationen')]);
  });

  it('allows several originals, including different authors and apostrophe genitives', () => {
    expect(inspect('<note>Gendigtning af Goethes <xref type="translation" poem="original"/> og Robert Burns’ <xref type="translation" poem="second"/>.</note>')).toEqual([]);
  });

  it('allows multiple links to texts by the same author', () => {
    expect(inspect('<note>Gendigtning af Goethes <xref type="translation" poem="original"/> og <xref type="translation" poem="original"/>.</note>')).toEqual([]);
  });

  it('reports unresolved original authors', () => {
    expect(inspect('<note>Oversættelse af Goethes <xref type="translation" poem="missing"/>.</note>'))
      .toEqual([expect.stringContaining('kan ikke finde forfatter')]);
  });

  it('requires names for all original authors', () => {
    expect(inspect('<note>Gendigtning af Goethes <xref type="translation" poem="original"/> og <xref type="translation" poem="second"/>.</note>'))
      .toEqual([expect.stringContaining('Robert Burns')]);
  });

  it('does not mistake poem titles for surrounding prose or author names', () => {
    expect(inspect('<note>Oversættelse af <a type="translation" poem="original">Goethes digt</a>.</note>'))
      .toEqual([expect.stringContaining('mangler digternavn')]);
  });

  it('does not enforce translation requirements on other notes or unknown originals', () => {
    expect(inspect('<note>Se <xref poem="original"/>.</note><note unknown-original-by="goethe"/><!-- <note><xref poem="original"/></note> -->')).toEqual([]);
  });
});
