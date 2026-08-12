import { groupsByLiteraryPeriod } from '../pages/poets.js';

describe('gruppering af digtere efter litterær periode', () => {
  const aarestrup = {
    id: 'aarestrup',
    type: 'poet',
    country: 'dk',
    name: { lastname: 'Aarestrup' },
  };
  const baggesen = {
    id: 'baggesen',
    type: 'poet',
    country: 'dk',
    name: { lastname: 'Baggesen' },
  };
  const bellman = {
    id: 'bellman',
    type: 'poet',
    country: 'se',
    name: { lastname: 'Bellman' },
  };

  it('bevarer APIets periodeorden, lokaliserer titler og filtrerer på land', () => {
    const groups = groupsByLiteraryPeriod(
      [
        {
          countries: ['dk'],
          title: { da: 'Oplysningstid', en: 'Enlightenment' },
          poets: [bellman, baggesen],
        },
        {
          countries: ['dk'],
          title: { da: 'Romantik', en: 'Romanticism' },
          poets: [aarestrup, baggesen],
        },
      ],
      'en',
      'dk'
    );

    expect(groups).toEqual([
      { title: 'Enlightenment', items: [baggesen] },
      { title: 'Romanticism', items: [baggesen, aarestrup] },
    ]);
  });

  it('udelader tomme perioder og digtere udenfor digteroversigten', () => {
    const groups = groupsByLiteraryPeriod(
      [
        { countries: ['dk'], title: { da: 'Tom' }, poets: [] },
        { countries: ['dk'], title: { da: 'Personer' }, poets: [{ ...aarestrup, type: 'person' }] },
      ],
      'da',
      'dk'
    );

    expect(groups).toEqual([]);
  });

  it('viser globale og landets lokale perioder, men ikke andre landes', () => {
    const groups = groupsByLiteraryPeriod(
      [
        { countries: ['dk', 'se'], title: { da: 'Romantik' }, poets: [baggesen] },
        { countries: ['dk'], title: { da: 'Dansk romantik' }, poets: [baggesen] },
        { countries: ['se'], title: { da: 'Svensk romantik' }, poets: [bellman] },
      ],
      'da',
      'dk'
    );

    expect(groups).toEqual([
      { title: 'Romantik', items: [baggesen] },
      { title: 'Dansk romantik', items: [baggesen] },
    ]);
  });
});
