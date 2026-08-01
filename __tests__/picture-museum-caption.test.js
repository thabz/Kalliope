import { removeRedundantMuseumName } from '../tools/build-static/validation.js';

describe('picture museum captions', () => {
  it('removes the derived museum name but keeps the location', () => {
    expect(
      removeRedundantMuseumName(
        'Andrea del Castagno: <i>Francesco Petrarca</i>, ca. 1450. Galleria degli Uffizi, Firenze.',
        'Galleria degli Uffizi'
      )
    ).toBe(
      'Andrea del Castagno: <i>Francesco Petrarca</i>, ca. 1450. Firenze.'
    );
  });

  it('matches the canonical name case-insensitively', () => {
    expect(
      removeRedundantMuseumName(
        'Manuskript fra Det Kongelige Bibliotek.',
        'Det kongelige Bibliotek'
      )
    ).toBe('Manuskript.');
  });

  it('leaves descriptions without museum metadata unchanged', () => {
    expect(removeRedundantMuseumName('En beskrivelse.', null)).toBe(
      'En beskrivelse.'
    );
  });
});
