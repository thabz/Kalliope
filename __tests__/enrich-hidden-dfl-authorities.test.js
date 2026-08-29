import { addAuthorityIdentifiers, normalizeAuthorityBindings } from '../tools/enrich-hidden-dfl-authorities.js';

describe('DFL-autoritets-id-er', () => {
  it('gemmer flertydige under-id-er uden at vælge ét', () => {
    const binding = viaf => ({ person: { value: 'http://www.wikidata.org/entity/Q123' }, dflId: { value: 'DflOne' }, viaf: { value: viaf }, gnd: { value: 'G1' } });
    expect(normalizeAuthorityBindings([binding('1'), binding('2')], [{ poetId: 'dfl-one', dflId: 'DflOne' }]))
      .toEqual([{ poetId: 'dfl-one', dflId: 'DflOne', wikidata: 'Q123', gnd: 'G1', ambiguousViaf: ['1', '2'] }]);
  });

  it('indsætter i skemaets rækkefølge og er idempotent', () => {
    const xml = '<?xml version="1.0"?><person id="dfl-one"><identifiers>\n    <danskforfatterleksikon-dk>DflOne</danskforfatterleksikon-dk>\n  </identifiers></person>';
    const record = { poetId: 'dfl-one', dflId: 'DflOne', wikidata: 'Q123', viaf: '1', gnd: 'G1' };
    const enriched = addAuthorityIdentifiers(xml, record);
    expect(enriched).toMatch(/<wikidata>Q123<\/wikidata>[\s\S]*<viaf>1<\/viaf>[\s\S]*<gnd>G1<\/gnd>[\s\S]*<danskforfatterleksikon-dk>/);
    expect(addAuthorityIdentifiers(enriched, record)).toBe(enriched);
  });
});
