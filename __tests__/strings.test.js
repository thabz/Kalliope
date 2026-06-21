import { pluralize, toTitleCase, trimHtml } from '../common/strings.js';

describe('common strings helpers', () => {
  it('title-cases simple strings', () => {
    expect(toTitleCase('emil aarestrup')).toBe('Emil Aarestrup');
    expect(toTitleCase('kAaf yN')).toBe('Kaaf Yn');
  });

  it('strips html tags from strings', () => {
    expect(trimHtml('<p>Hej <strong>verden</strong></p>')).toBe('Hej verden');
    expect(trimHtml('ingen tags')).toBe('ingen tags');
  });

  it('pluralizes by exact count', () => {
    expect(pluralize(1, 'tekst', 'tekster')).toBe('tekst');
    expect(pluralize(0, 'tekst', 'tekster')).toBe('tekster');
    expect(pluralize(2, 'tekst', 'tekster')).toBe('tekster');
  });
});
