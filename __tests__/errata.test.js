import { DOMParser } from '@xmldom/xmldom';
import { validateErrata } from '../tools/errata.js';

const work = ({ declarations = '<errata status="none"/>', footnotes = '' } = {}) =>
  new DOMParser().parseFromString(`
    <kalliopework id="1900" author="test" status="complete">
      <workhead>
        <title>Test</title>
        <source facsimile="scan" facsimile-pages-num="50">Kilde</source>
        ${declarations}
      </workhead>
      <workbody><text id="test1"><head><title>Tekst</title></head>
        <body><poetry>rettet${footnotes}</poetry></body></text></workbody>
    </kalliopework>`, 'text/xml').documentElement;

const applied = '<errata status="applied" pages="[12-13]" facsimile-pages="20-21"/>';

describe('errata declarations and footnotes', () => {
  it('accepts a checked work without a correction sheet', () => {
    expect(validateErrata(work(), 'test.xml')).toEqual([]);
  });

  it('accepts multiple correction sheets and typed footnotes', () => {
    const declarations = `${applied}<errata status="applied" pages="[30]" facsimile-pages="40"/>`;
    expect(validateErrata(work({
      declarations,
      footnotes: '<footnote type="errata">rettet] trykt</footnote>',
    }), 'test.xml')).toEqual([]);
  });

  it('rejects applied errata without typed footnotes', () => {
    expect(validateErrata(work({ declarations: applied }), 'test.xml'))
      .toEqual(expect.arrayContaining([expect.stringContaining('kræver mindst én')]));
  });

  it.each([
    'rettet trykt',
    '] trykt',
    'rettet] ',
    'rettet]trykt',
    'rettet] rettet',
    'rettet] trykt] ekstra',
  ])('rejects malformed footnote %s', text => {
    const note = `<footnote type="errata">${text}</footnote>`;
    expect(validateErrata(work({ declarations: applied, footnotes: note }), 'test.xml'))
      .toEqual(expect.arrayContaining([expect.stringContaining('rettet] trykt')]));
  });

  it('rejects invalid or out-of-range facsimile pages', () => {
    const declarations = '<errata status="applied" pages="[12-13]" facsimile-pages="49-51"/>';
    expect(validateErrata(work({ declarations, footnotes: '<footnote type="errata">a] b</footnote>' }), 'test.xml'))
      .toEqual(expect.arrayContaining([expect.stringContaining('uden for facsimilekildens sider')]));
  });
});
