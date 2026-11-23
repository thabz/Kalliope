import { changedDateTextIds } from '../tools/build-static/related-dates.js';

describe('date relation cache dependencies', () => {
  const haste = { id: 'haste', title: 'Birthday song' };
  const other = { id: 'other', title: 'Another song' };
  const date = '1826-01-28';

  it('invalidates the unchanged poem when another poem acquires its date', () => {
    expect(changedDateTextIds(
      new Map([[date, [haste]]]),
      new Map([[date, [haste, other]]]),
    )).toEqual(new Set(['haste', 'other']));
  });

  it('invalidates both sides when a relation disappears', () => {
    expect(changedDateTextIds(
      new Map([[date, [haste, other]]]),
      new Map([[date, [haste]]]),
    )).toEqual(new Set(['haste', 'other']));
  });

  it('refreshes related titles but leaves unchanged dates alone', () => {
    const previous = new Map([[date, [haste, other]]]);
    expect(changedDateTextIds(previous, previous)).toEqual(new Set());
    expect(changedDateTextIds(previous, new Map([
      [date, [haste, { ...other, title: 'Corrected title' }]],
    ]))).toEqual(new Set(['haste', 'other']));
  });
});
