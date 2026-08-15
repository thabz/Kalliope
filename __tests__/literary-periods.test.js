import {
  literaryPeriods,
  loadLiteraryPeriods,
  validateLiteraryPeriods,
} from '../tools/build-static/literary-periods.js';
import {
  literaryPeriodForApi,
  parseLiteraryPeriods,
} from '../tools/build-static/poets.js';

describe('litteraturperiodekataloget', () => {
  it('læser JSON, validerer og sorterer med katalogrækkefølge som tie-breaker', () => {
    expect(literaryPeriods.periods.length).toBeGreaterThan(0);
    expect(literaryPeriods.sorted.map(period => period.sortYear)).toEqual(
      [...literaryPeriods.sorted].map(period => period.sortYear).sort((a, b) => a - b)
    );
    expect(literaryPeriods.periods.some(period => period.id === 'antikken')).toBe(false);
    expect(literaryPeriods.periods.every(period => period.tradition != null)).toBe(true);
  });

  it('validerer prefix, land, titel, kilde og år', () => {
    const base = literaryPeriods.periods[0];
    expect(() => validateLiteraryPeriods({ periods: [{ ...base, id: 'dk-forkert', tradition: 'fr' }] })).toThrow('prefix');
    expect(() => validateLiteraryPeriods({ periods: [{ ...base, countries: ['xx'] }] })).toThrow('ukendt land');
    expect(() => validateLiteraryPeriods({ periods: [{ ...base, title: { ...base.title, de: undefined } }] })).toThrow('titel');
    expect(() => validateLiteraryPeriods({ periods: [{ ...base, sources: [] }] })).toThrow('kilde');
    expect(() => validateLiteraryPeriods({ periods: [{ ...base, sortYear: '1800' }] })).toThrow('sortYear');
  });

  it('validerer XML-medlemskab mod traditionens land', () => {
    expect(() => parseLiteraryPeriods('test', 'se', 'dk-guldalder-og-romantik')).toThrow('uden for landeområdet');
    expect(parseLiteraryPeriods('test', 'dk', 'dk-guldalder-og-romantik,dk-det-moderne-gennembrud')).toHaveLength(2);
  });

  it('udelader redaktionelle felter fra API’et', () => {
    const period = literaryPeriods.idMap.get('dk-det-moderne-gennembrud');
    expect(literaryPeriodForApi(period)).toEqual({ id: period.id, countries: ['dk'], title: period.title });
    expect(literaryPeriodForApi(period)).not.toHaveProperty('tradition');
    expect(literaryPeriodForApi(period)).not.toHaveProperty('sortYear');
    expect(literaryPeriodForApi(period)).not.toHaveProperty('sources');
  });
});
