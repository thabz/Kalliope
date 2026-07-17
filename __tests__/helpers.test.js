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
  });
});
