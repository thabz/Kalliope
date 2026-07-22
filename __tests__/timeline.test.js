import {
  compare_normalized_date,
  normalize_timeline_date,
  sorted_timeline,
} from '../tools/build-static/timeline.js';

describe('timeline helpers', () => {
  it('normalizes partial and approximate dates', () => {
    expect(normalize_timeline_date('1818')).toBe('1818-01-01');
    expect(normalize_timeline_date('1818-06')).toBe('1818-06-01');
    expect(normalize_timeline_date('1818-06-07')).toBe('1818-06-07');
    expect(normalize_timeline_date('ca. 1818')).toBe('1818-01-01');
    expect(normalize_timeline_date('c. 1818-06')).toBe('1818-06-01');
    expect(normalize_timeline_date('-1818')).toBe('-1818-01-01');
  });

  it('compares normalized dates correctly', () => {
    expect(compare_normalized_date('1818-01-01', '1819-01-01')).toBe(-1);
    expect(compare_normalized_date('1819-01-01', '1818-01-01')).toBe(1);
    expect(compare_normalized_date('1818-06-01', '1818-07-01')).toBe(-1);
    expect(compare_normalized_date('-1818-01-01', '1818-01-01')).toBe(-1);
    expect(compare_normalized_date('1818-01-01', '1818-01-01')).toBe(0);
  });

  it('sorts timelines in place by normalized date', () => {
    const timeline = [
      { normalized_date: '1840-01-01', id: 'c' },
      { normalized_date: '1818-01-01', id: 'a' },
      { normalized_date: '1830-01-01', id: 'b' },
      { normalized_date: '-0100-01-01', id: 'd' },
    ];

    const sorted = sorted_timeline(timeline);

    expect(sorted).toBe(timeline);
    expect(sorted.map((item) => item.id)).toEqual(['d', 'a', 'b', 'c']);
  });
});
