import { pluralize, toTitleCase, trimHtml } from '../common/strings.js';

describe('common strings helpers', () => {
  it('title-cases simple strings', () => {
    expect(toTitleCase('emil aarestrup')).toBe('Emil Aarestrup');
    expect(toTitleCase('kAaf yN')).toBe('Kaaf Yn');
  });

  it('keeps whitespace and punctuation while title-casing words', () => {
    expect(toTitleCase('  emil   aarestrup')).toBe('  Emil   Aarestrup');
    expect(toTitleCase('hej, verden!')).toBe('Hej, Verden!');
  });

  it('title-cases words containing digits by lowercasing the rest', () => {
    expect(toTitleCase('2DEN SANG')).toBe('2den Sang');
  });

  it('strips html tags from strings', () => {
    expect(trimHtml('<p>Hej <strong>verden</strong></p>')).toBe('Hej verden');
    expect(trimHtml('ingen tags')).toBe('ingen tags');
  });

  it('strips tags with attributes and self-closing tags', () => {
    expect(trimHtml('<a href="/x">Link</a><br/>mere')).toBe('Linkmere');
  });

  it('leaves plain angle-bracket text untouched when it is not a tag', () => {
    expect(trimHtml('2 < 3 og 4 > 1')).toBe('2 < 3 og 4 > 1');
  });

  it('pluralizes by exact count', () => {
    expect(pluralize(1, 'tekst', 'tekster')).toBe('tekst');
    expect(pluralize(0, 'tekst', 'tekster')).toBe('tekster');
    expect(pluralize(2, 'tekst', 'tekster')).toBe('tekster');
  });

  it('only treats the number 1 as singular', () => {
    expect(pluralize('1', 'tekst', 'tekster')).toBe('tekster');
    expect(pluralize(1.0, 'tekst', 'tekster')).toBe('tekst');
    expect(pluralize(1.1, 'tekst', 'tekster')).toBe('tekster');
  });
});
