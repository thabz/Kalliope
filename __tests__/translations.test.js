import _ from '../common/translations.js';

describe('translations helper', () => {
  it('returns translated strings when available', () => {
    expect(_('Digtere', 'en')).toBe('Poets');
    expect(_('ca.', 'en')).toBe('c.');
    expect(_('Henvisning', 'en')).toBe('Reference');
    expect(_('Henvisninger', 'de')).toBe('Verweise');
    expect(_('Digtere', 'de')).toBe('Dichter');
    expect(_('Gendigtning', 'fr')).toBe('Adaptation');
    expect(_('Digtere', 'fr')).toBe('Poètes');
    expect(_('Noter', 'fr')).toBe('Notes');
    expect(_('Identifikatorer', 'en')).toBe('Identifiers');
    expect(_('Identifikatorer', 'de')).toBe('Identifikatoren');
    expect(_('Identifikatorer', 'fr')).toBe('Identifiants');
    expect(_('Eksterne ressourcer', 'en')).toBe('External resources');
    expect(_('Eksterne ressourcer', 'de')).toBe('Externe Ressourcen');
    expect(_('Eksterne ressourcer', 'fr')).toBe('Ressources externes');
    expect(_('Forlæg', 'de')).toBe('Vorlage');
    expect(_('Andre udgaver', 'fr')).toBe('Autres éditions');
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
