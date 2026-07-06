import _ from '../common/translations.js';

describe('translations helper', () => {
  it('returns translated strings when available', () => {
    expect(_('Digtere', 'en')).toBe('Poets');
    expect(_('ca.', 'en')).toBe('c.');
    expect(_('Henvisning', 'en')).toBe('Reference');
    expect(_('Henvisninger', 'de')).toBe('Verweise');
    expect(_('Gendigtning', 'fr')).toBe('Adaptation');
    expect(_('Noter', 'fr')).toBe('Notes');
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
    expect(_('Søg i {genetiveLastName} værker', 'de', {
      genetiveLastName: 'von Goethe',
    })).toBe('In den Werken von Goethe suchen');
    expect(_('Søg i {genetiveLastName} værker', 'fr', {
      genetiveLastName: 'de Reboul',
    })).toBe('Rechercher dans les œuvres de Reboul');
  });
});
