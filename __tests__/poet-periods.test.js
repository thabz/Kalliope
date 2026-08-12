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
          title: { da: 'Oplysningstid', en: 'Enlightenment' },
          poets: [bellman, baggesen],
        },
        {
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
        { title: { da: 'Tom' }, poets: [] },
        { title: { da: 'Personer' }, poets: [{ ...aarestrup, type: 'person' }] },
      ],
      'da',
      'dk'
    );

    expect(groups).toEqual([]);
  });
});
