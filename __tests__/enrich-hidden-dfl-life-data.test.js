import { applyLifeDataToXml, dateCompatible, isSafeNameMatch, resolveField } from '../tools/enrich-hidden-dfl-life-data.js';

const source = (name, field, value, placeId = null) => ({ source: name, sourceId: name, sourceUrl: `https://example.com/${name}`, field, value, raw: value, ...(placeId == null ? {} : { placeId }) });

describe('berigelse af skjulte DFL-digtere', () => {
  it('behandler forskellig datopræcision som forenelig', () => {
    expect(dateCompatible('1901', '1901-04-02')).toBe(true);
    expect(dateCompatible('1901-04', '1901-04-02')).toBe(true);
    expect(dateCompatible('1901-04-03', '1901-04-02')).toBe(false);
  });

  it('vælger højeste kompatible præcision og registrerer reelle konflikter', () => {
    const resolved = resolveField('birthDate', [
      source('wikidata', 'birthDate', '1901-04-02'),
      source('gnd', 'birthDate', '1901'),
      source('dfl', 'birthDate', '1902'),
    ]);
    expect(resolved.selected).toMatchObject({ source: 'wikidata', value: '1901-04-02' });
    expect(resolved.alternatives).toEqual([expect.objectContaining({ source: 'dfl', value: '1902' })]);
  });

  it('indsætter steder, id-er og konfliktkommentar og renser et struktureret fødselsår', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<person id="dfl-test" country="un" lang="da" type="poet" hidden="true">\n  <name>\n    <fullname>Test Person, f. 1901</fullname>\n  </name>\n  <identifiers>\n    <danskforfatterleksikon-dk>Test</danskforfatterleksikon-dk>\n  </identifiers>\n</person>\n`;
    const record = {
      identifiers: { wikidata: 'Q1', viaf: '2', gnd: '3', lex: 'test-person' },
      fields: {
        birthDate: { selected: source('wikidata', 'birthDate', '1901-04-02') },
        deathDate: { selected: source('wikidata', 'deathDate', '1970') },
        birthPlace: { selected: source('wikidata', 'birthPlace', 'Odense', 'Q1') },
        deathPlace: { selected: null },
      },
      conflicts: [{ field: 'birthDate', alternatives: [source('dfl', 'birthDate', '1902')] }],
    };
    const result = applyLifeDataToXml(xml, record);
    expect(result).toContain('<fullname>Test Person</fullname>');
    expect(result).toContain('<!-- Konflikt birthDate: dfl=1902 -->');
    expect(result).toContain('<date>1901-04-02</date>');
    expect(result).toContain('<place>Odense</place>');
    expect(result).toContain('<lex-dk>test-person</lex-dk>');
  });

  it('accepterer ikke et navnematch uden et ekstra identitetssignal', () => {
    expect(isSafeNameMatch({ name: 'Jens Jensen' }, { name: 'Jens Jensen' })).toBe(false);
    expect(isSafeNameMatch(
      { name: 'Jens Jensen', birthYear: '1901' },
      { name: 'Jens Jensen', birthYear: '1901' }
    )).toBe(true);
    expect(isSafeNameMatch(
      { name: 'Jens Jensen', identifiers: { gnd: '1' } },
      { name: 'J. Jensen', alternativeNames: ['Jens Jensen'], identifiers: { gnd: '1' } }
    )).toBe(true);
  });
});
