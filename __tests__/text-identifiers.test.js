import { DOMParser } from '@xmldom/xmldom';
import { getIdentifiers, identifierAllowlist } from '../tools/build-static/xml.js';

const parse = xml => getIdentifiers(
  new DOMParser().parseFromString(`<head>${xml}</head>`, 'text/xml').documentElement,
  identifierAllowlist.text,
);

describe('text identifiers', () => {
  it('keeps repeated catalogue types and separate, case-sensitive qualifiers', () => {
    const xml = '<identifiers><wikidata>Q123</wikidata>' +
      '<dgf-id variant="B" witness="b">5</dgf-id>' +
      '<dv-id>59</dv-id><dgf-id appendix="c">149</dgf-id>' +
      '<dgf-id witness="b">8</dgf-id><dv-id variant="A">6</dv-id></identifiers>';
    const expected = {
      wikidata: 'Q123',
      'dgf-id': [{ value: '5', variant: 'B', witness: 'b' }, { value: '149', appendix: 'c' }, { value: '8', witness: 'b' }],
      'dv-id': [{ value: '59' }, { value: '6', variant: 'A' }],
    };
    expect(parse(xml)).toEqual(expected);
    expect(JSON.parse(JSON.stringify(parse(xml)))).toEqual(expected);
  });

  it('allows texts with no catalogue numbers and keeps Wikidata a string', () => {
    expect(parse('<title>Titel</title>')).toEqual({});
    expect(getIdentifiers(null, identifierAllowlist.text)).toEqual({});
    expect(parse('<identifiers><wikidata> Q123 </wikidata></identifiers>')).toEqual({ wikidata: 'Q123' });
  });

  it.each(['dgf-id', 'dv-id'])('rejects invalid or repeated %s numbers', tag => {
    for (const number of ['', '0', '-1', '01', '1.5', 'DgF 5', '5 B', ' 5', '5 ', '5\n', '1 og 2', '<b>5</b>']) {
      expect(() => parse(`<identifiers><${tag}>${number}</${tag}></identifiers>`)).toThrow(/positivt heltal/);
    }
    expect(() => parse(`<identifiers><${tag}>5</${tag}><${tag} variant="B">5</${tag}></identifiers>`)).toThrow(/gentager nummeret 5/);
  });

  it('rejects unknown and empty attributes, unknown types and multiple containers', () => {
    for (const attributes of ['variant=""', 'witness=" "', 'appendix=" c"', 'bogus="c"', 'variant="b&#10;"']) {
      expect(() => parse(`<identifiers><dgf-id ${attributes}>149</dgf-id></identifiers>`)).toThrow(/ugyldig attribut/);
    }
    expect(() => parse('<identifiers><isbn>5</isbn></identifiers>')).toThrow(/ikke-tilladt/);
    expect(() => parse('<identifiers/><identifiers/>')).toThrow(/flere/);
  });
});
