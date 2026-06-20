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
    expect(translatePlace('Københavns Slot', 'en')).toBe('Copenhagen Castle');
    expect(translatePlace('Firenze', 'en')).toBe('Florence');
    expect(translatePlace('Venedig', 'en')).toBe('Venice');
    expect(translatePlace('Göteborg', 'en')).toBe('Gothenburg');
    expect(translatePlace('Konstantinopel', 'en')).toBe('Constantinople');
    expect(translatePlace('Turino, Savoy (nu Italien)', 'en')).toBe(
      'Turin, Savoy (now Italy)'
    );
    expect(translatePlace('Rom, Pavestaten (nuværende Italien)', 'en')).toBe(
      'Rome, the Papal States (present-day Italy)'
    );
    expect(translatePlace('Shiraz, Persien', 'en')).toBe('Shiraz, Persia');
    expect(translatePlace('Spentrup, Jylland', 'en')).toBe(
      'Spentrup, Jutland'
    );
    expect(translatePlace('Skt. Thomas, Dansk Vestindien', 'en')).toBe(
      'St. Thomas, Danish West Indies'
    );
    expect(translatePlace('skibsforlis på vej hjem fra Kina', 'en')).toBe(
      'shipwreck on the way home from China'
    );
    expect(translatePlace('Branderslev på Lolland', 'en')).toBe(
      'Branderslev on Lolland'
    );
    expect(translatePlace('Siracusa på Sicilien', 'en')).toBe(
      'Siracusa in Sicily'
    );
    expect(translatePlace('Nørre Vram i Skåne', 'en')).toBe(
      'Nørre Vram in Scania'
    );
    expect(translatePlace('nær Roskilde', 'en')).toBe('near Roskilde');
    expect(translatePlace('Det Gule Palæ, Kbh.', 'en')).toBe(
      'Det Gule Palæ, Copenhagen'
    );
    expect(translatePlace('Østerlinnet, Ribe Stift', 'en')).toBe(
      'Østerlinnet, Ribe Diocese'
    );
    expect(translatePlace('Underbjerg, Tørring Sogn', 'en')).toBe(
      'Underbjerg, Tørring Parish'
    );
    expect(translatePlace('Øksendal på Nordmøre', 'en')).toBe(
      'Øksendal in Nordmoere'
    );
  });

  it('leaves Danish place names unchanged for Danish display', () => {
    expect(translatePlace('København', 'da')).toBe('København');
  });
});
