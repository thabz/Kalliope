import { DOMParser } from '@xmldom/xmldom';
import { validateErrata } from '../tools/errata.js';

const work = ({ declarations = '<errata status="none"/>', comments = '' } = {}) =>
  new DOMParser().parseFromString(`
    <kalliopework id="1900" author="test" status="complete">
      <workhead>
        <title>Test</title>
        <source facsimile="scan" facsimile-pages-num="50">Kilde</source>
        ${declarations}
      </workhead>
      <workbody><text id="test1"><head><title>Tekst</title></head>
        <body><poetry>rettet${comments}</poetry></body></text></workbody>
    </kalliopework>`, 'text/xml').documentElement;

const applied = '<errata status="applied" pages="[12-13]" facsimile-pages="20-21"/>';

describe('errata declarations and comments', () => {
  it('accepts a checked work without a correction sheet', () => {
    expect(validateErrata(work(), 'test.xml')).toEqual([]);
  });

  it('accepts multiple correction sheets and correction comments', () => {
    const declarations = `${applied}<errata status="applied" pages="[30]" facsimile-pages="40"/>`;
    expect(validateErrata(work({
      declarations,
      comments: '<!-- Rettelsesark: rettet] trykt -->',
    }), 'test.xml')).toEqual([]);
  });

  it('accepts an unnumbered correction block with a precise facsimile page', () => {
    expect(validateErrata(work({
      declarations: '<errata status="applied" pages="[upagineret]" facsimile-pages="10"/>',
      comments: '<!-- Rettelsesark: taler] læser -->',
    }), 'test.xml')).toEqual([]);
  });

  it('rejects applied errata without correction comments', () => {
    expect(validateErrata(work({ declarations: applied }), 'test.xml'))
      .toEqual(expect.arrayContaining([expect.stringContaining('kræver mindst én')]));
  });

  it('records a reviewed correction sheet without inventing text corrections', () => {
    const declarations = '<errata status="reviewed" pages="12-13" facsimile-pages="20-21"/>';
    expect(validateErrata(work({ declarations }), 'test.xml')).toEqual([]);
    expect(validateErrata(work({ declarations, comments: '<!-- Rettelsesark: a] b -->' }), 'test.xml'))
      .toEqual(expect.arrayContaining([expect.stringContaining('kræver <errata status="applied"/>')]));
  });

  it('validates the source pages of reviewed sheets and forbids combining them with none', () => {
    const reviewed = '<errata status="reviewed" pages="12-13" facsimile-pages="49-51"/>';
    expect(validateErrata(work({ declarations: reviewed }), 'test.xml'))
      .toEqual(expect.arrayContaining([expect.stringContaining('uden for facsimilekildens sider')]));
    expect(validateErrata(work({ declarations: '<errata status="none"/>' + reviewed }), 'test.xml'))
      .toEqual(expect.arrayContaining([expect.stringContaining('må stå alene')]));
  });

  it.each([
    'rettet trykt',
    '] trykt',
    'rettet] ',
    'rettet]trykt',
    'rettet] rettet',
    ' rettet] rettet ',
    '∅] ∅',
    'rettet] trykt] ekstra',
  ])('rejects malformed comment %s', text => {
    const note = `<!-- Rettelsesark: ${text} -->`;
    expect(validateErrata(work({ declarations: applied, comments: note }), 'test.xml'))
      .toEqual(expect.arrayContaining([expect.stringContaining('rettet] trykt')]));
  });

  it('rejects invalid or out-of-range facsimile pages', () => {
    const declarations = '<errata status="applied" pages="[12-13]" facsimile-pages="49-51"/>';
    expect(validateErrata(work({ declarations, comments: '<!-- Rettelsesark: a] b -->' }), 'test.xml'))
      .toEqual(expect.arrayContaining([expect.stringContaining('uden for facsimilekildens sider')]));
  });
  it.each(['ord] ∅', '∅] ord', 'Ord,] Ord.'])('accepts additions, deletions and punctuation: %s', text => {
    expect(validateErrata(work({ declarations: applied, comments: `<!-- Rettelsesark: ${text} -->` }), 'test.xml')).toEqual([]);
  });

  it.each(['', '<errata status="none"/>'])('requires applied registration for comments (%s)', declarations => {
    expect(validateErrata(work({ declarations, comments: '<!-- Rettelsesark: a] b -->' }), 'test.xml'))
      .toContainEqual(expect.stringContaining('kræver <errata status="applied"/>'));
  });

  it.each(['Rettelsesark a] b', 'rettelsesark: a] b', 'Rettelsesark: a] b\nfortsat'])('rejects malformed correction marker %s', text => {
    const issues = validateErrata(work({ declarations: applied, comments: `<!-- ${text} -->` }), 'test.xml');
    expect(issues).toContainEqual(expect.stringContaining('skal have formen'));
    expect(issues).toContainEqual(expect.stringContaining('kræver mindst én gyldig'));
  });

  it('rejects legacy correction footnotes even with valid comments', () => {
    const comments = '<!-- Rettelsesark: a] b --><footnote type="errata">a] b</footnote>';
    expect(validateErrata(work({ declarations: applied, comments }), 'test.xml'))
      .toContainEqual(expect.stringContaining('rettelsesfodnoter er ikke tilladt'));
  });

  it('ignores unrelated XML comments', () => {
    expect(validateErrata(work({ comments: '<!-- Redaktionel arbejdskommentar -->' }), 'test.xml')).toEqual([]);
  });

  it('validates named facsimile sources', () => {
    const declarations = '<errata status="applied" in="missing" pages="12" facsimile-pages="20"/>';
    const node = work({ declarations, comments: '<!-- Rettelsesark: a] b -->' });
    expect(validateErrata(node, 'test.xml')).toContainEqual(expect.stringContaining('mangler en tilknyttet facsimilekilde'));
    node.getElementsByTagName('source')[0].setAttribute('id', 'missing');
    expect(validateErrata(node, 'test.xml')).toEqual([]);
  });

});
