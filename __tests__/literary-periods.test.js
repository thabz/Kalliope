import {
  literaryPeriods,
  sortedLiteraryPeriods,
  validateLiteraryPeriods,
} from '../common/literary-periods.js';
import {
  literaryPeriodForApi,
  parseLiteraryPeriods,
} from '../tools/build-static/poets.js';

describe('litteraturperiodekataloget', () => {
  const globalIds = [
    'antikken',
    'middelalderen',
    'renaessance-og-humanisme',
    'barok-og-tidlig-modernitet',
    'oplysningstid-og-klassicisme',
    'romantik-og-praeromantik',
    'realisme-og-naturalisme',
    'symbolisme-og-fin-de-siecle',
    'modernisme-og-avantgarde',
    'efterkrigstid',
    'postmodernisme',
    'samtid',
  ];

  it('bevarer de 12 globale id’er', () => {
    expect(literaryPeriods.filter(period => period.scope === 'global').map(period => period.id)).toEqual(globalIds);
  });

  it('sorterer kronologisk og bevarer katalogrækkefølgen ved lighed', () => {
    expect(sortedLiteraryPeriods.map(period => period.sortYear)).toEqual(
      [...sortedLiteraryPeriods].map(period => period.sortYear).sort((a, b) => a - b)
    );
    const tied = sortedLiteraryPeriods.filter(period => period.sortYear === 1945);
    expect(tied.map(period => literaryPeriods.indexOf(period))).toEqual(
      tied.map(period => literaryPeriods.indexOf(period)).sort((a, b) => a - b)
    );
  });

  it('validerer metadata og lokale landeområder', () => {
    expect(() => validateLiteraryPeriods([{ id: 'x', scope: 'local', sortYear: 1, countries: ['xx'], sources: [], title: { da: 'x', en: 'x', fr: 'x', de: 'x' } }])).toThrow('ukendt land');
    expect(() => parseLiteraryPeriods('test', 'se', 'dk-guldalder-og-romantik')).toThrow('uden for landeområdet');
  });

  it('udelader interne metadata fra API’et', () => {
    const local = literaryPeriods.find(period => period.id === 'dk-det-moderne-gennembrud');
    expect(literaryPeriodForApi(local)).toEqual({
      id: local.id,
      scope: 'local',
      countries: ['dk'],
      title: local.title,
    });
    expect(literaryPeriodForApi(local)).not.toHaveProperty('sortYear');
    expect(literaryPeriodForApi(local)).not.toHaveProperty('sources');
  });

  it('accepterer flere globale og flere lokale perioder', () => {
    expect(parseLiteraryPeriods('test', 'dk', 'romantik-og-praeromantik,realisme-og-naturalisme,dk-guldalder-og-romantik,dk-det-moderne-gennembrud')).toHaveLength(4);
  });
});
