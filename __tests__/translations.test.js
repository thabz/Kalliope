import _ from '../common/translations.js';

describe('translations helper', () => {
  it('returns translated strings when available', () => {
    expect(_('Digtere', 'en')).toBe('Poets');
    expect(_('ca.', 'en')).toBe('c.');
  });

  it('falls back to the original string when missing', () => {
    expect(_('This string is not translated', 'en')).toBe(
      'This string is not translated'
    );
  });

  it('replaces placeholders', () => {
    expect(_('Søg i {genetiveLastName} værker', 'en', {
      genetiveLastName: 'Aarestrup',
    })).toBe('Search Aarestrup works');
  });
});
