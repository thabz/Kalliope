import { groupsByLiteraryPeriod } from '../pages/poets.js';

describe('gruppering af digtere efter litterær periode', () => {
  const aarestrup = {
    id: 'aarestrup',
    type: 'poet',
    literaryPeriods: ['dk-romantik'],
    name: { lastname: 'Aarestrup' },
  };
  const baggesen = {
    id: 'baggesen',
    type: 'poet',
    literaryPeriods: ['dk-oplysningstid', 'dk-romantik'],
    name: { lastname: 'Baggesen' },
  };
  const bellman = {
    id: 'bellman',
    type: 'poet',
    literaryPeriods: ['se-romantik'],
    name: { lastname: 'Bellman' },
  };

  it('bevarer APIets periodeorden, lokaliserer titler og filtrerer på land', () => {
    const groups = groupsByLiteraryPeriod(
      [
        {
          id: 'dk-oplysningstid',
          countries: ['dk'],
          title: { da: 'Oplysningstid', en: 'Enlightenment' },
        },
        {
          id: 'dk-romantik',
          countries: ['dk'],
          title: { da: 'Romantik', en: 'Romanticism' },
        },
      ],
      [aarestrup, baggesen, bellman],
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
        { id: 'dk-tom', countries: ['dk'], title: { da: 'Tom' } },
        { id: 'dk-romantik', countries: ['dk'], title: { da: 'Personer' } },
      ],
      [{ ...aarestrup, type: 'person' }],
      'da',
      'dk'
    );

    expect(groups).toEqual([]);
  });

  it('viser globale og landets lokale perioder, men ikke andre landes', () => {
    const baggesenWithGlobalPeriod = {
      ...baggesen,
      literaryPeriods: ['global-romantik', 'dk-romantik'],
    };
    const groups = groupsByLiteraryPeriod(
      [
        { id: 'global-romantik', countries: ['dk', 'se'], title: { da: 'Romantik' } },
        { id: 'dk-romantik', countries: ['dk'], title: { da: 'Dansk romantik' } },
        { id: 'se-romantik', countries: ['se'], title: { da: 'Svensk romantik' } },
      ],
      [baggesenWithGlobalPeriod, bellman],
      'da',
      'dk'
    );

    expect(groups).toEqual([
      { title: 'Romantik', items: [baggesenWithGlobalPeriod] },
      { title: 'Dansk romantik', items: [baggesenWithGlobalPeriod] },
    ]);
  });
});
