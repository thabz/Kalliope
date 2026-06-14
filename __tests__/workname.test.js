import { workTitleString } from '../components/workname.js';

describe('work name helpers', () => {
  it('returns the title directly when no year is present', () => {
    expect(workTitleString({ title: 'Digte' })).toBe('Digte');
  });

  it('adds a formatted year when present', () => {
    expect(workTitleString({ title: 'Digte', year: '1818' })).toBe(
      'Digte (1818)'
    );
    expect(workTitleString({ title: 'Digte', year: '?' })).toBe('Digte');
  });

  it('always formats work dates as years only', () => {
    expect(workTitleString({ title: 'Digte', year: '1818-06-07' })).toBe(
      'Digte (1818)'
    );
    expect(workTitleString({ title: 'Digte', year: 'ca. 1818-06-07' })).toBe(
      'Digte (c. 1818)'
    );
  });
});
