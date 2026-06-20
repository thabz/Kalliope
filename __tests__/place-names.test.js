const { translatePlace } = require('../common/place-names.js');

describe('place names', () => {
  it('translates Danish place names for English display', () => {
    expect(translatePlace('København', 'en')).toBe('Copenhagen');
    expect(translatePlace('Zollenspieker ved Hamburg', 'en')).toBe(
      'Zollenspieker near Hamburg'
    );
    expect(
      translatePlace('Raivola, Finland (nu Roshchino, Rusland)', 'en')
    ).toBe('Raivola, Finland (now Roshchino, Russia)');
  });

  it('leaves Danish place names unchanged for Danish display', () => {
    expect(translatePlace('København', 'da')).toBe('København');
  });
});
