import { htmlToXml } from '../tools/libs/helpers.js';

const collected = {
  texts: new Map(),
  keywords: new Map(),
  dict: new Map(),
};

const lineTexts = html => htmlToXml(html, collected).map(([line]) => line);

describe('helpers', () => {
  describe('htmlToXml', () => {
    it('removes inline XML comments', () => {
      expect(lineTexts('Foraaret <!-- section title -->')).toEqual([
        'Foraaret',
      ]);
    });

    it('preserves word boundaries around inline XML comments', () => {
      expect(lineTexts('foo <!-- c --> bar')).toEqual(['foo bar']);
    });

    it('removes XML comment lines without leaving empty numbered lines', () => {
      expect(
        htmlToXml(
          'Første linje\n   <!-- metadata checked -->\nAnden linje',
          collected
        )
      ).toEqual([
        ['Første linje', { num: 1 }],
        ['Anden linje', { num: 2 }],
      ]);
    });

    it('removes multi-line XML comments without leaving comment fragments', () => {
      expect(
        htmlToXml(
          'Første linje\n' +
            '   <!-- metadata\n' +
            '        checked: 2026-07-16\n' +
            '        source verified -->\n' +
            'Anden linje',
          collected
        )
      ).toEqual([
        ['Første linje', { num: 1 }],
        ['Anden linje', { num: 2 }],
      ]);
    });

    it('makes a multi-line language span valid on every rendered line', () => {
      expect(
        lineTexts('<span lang="sv">första raden\nandra raden</span>')
      ).toEqual([
        '<span lang="sv">första raden</span>',
        '<span lang="sv">andra raden</span>',
      ]);
    });

    it('keeps a multi-line footnote valid as one rendered line', () => {
      expect(
        lineTexts(
          'Verslinje<footnote>Første linje\n' +
            'anden <span lang="la"><i>linje</i></span>.</footnote>\n' +
            'Næste verslinje'
        )
      ).toEqual([
        'Verslinje<footnote>Første linje anden <span lang="la"><i>linje</i></span>.</footnote>',
        'Næste verslinje',
      ]);
    });

    it('preserves line indentation after a page break', () => {
      expect(
        lineTexts(
          '<pb n="18" facs="024.jpg"/>        andre drog fra borgen ned,'
        )
      ).toEqual([
        '<pb n="18" facs="024.jpg"/>' +
          '\u00a0'.repeat(16) +
          'andre drog fra borgen ned,',
      ]);
    });

    it('keeps escaped angle brackets as text for the browser XML parser', () => {
      expect(
        lineTexts('&lt;er røde af blodet af mænd, der dræbes,&gt;')
      ).toEqual(['&lt;er røde af blodet af mænd, der dræbes,&gt;']);
    });

    it('preserves inline margin markers in prose', () => {
      expect(
        htmlToXml(
          'Før margin<margin>En margintekst.</margin> efter margin',
          collected,
          false,
        )
      ).toEqual([
        [
          'Før margin<margin>En margintekst.</margin> efter margin',
          { num: 1, html: true },
        ],
      ]);
    });

    it('continues to extract margin markers from poetry lines', () => {
      expect(
        htmlToXml('<margin>Strofe 1.</margin>Første verslinje', collected, true)
      ).toEqual([['Første verslinje', { num: 1, margin: 'Strofe 1.' }]]);
    });
  });
});
