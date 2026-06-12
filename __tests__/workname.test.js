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
});
