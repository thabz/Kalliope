import {
  buildPoetTimelineJson,
  compareNormalizedDate,
  normalizeTimelineDate,
  sortedTimeline,
} from '../tools/build-static/timeline.js';

describe('timeline helpers', () => {
  it('renders baptism as baptism when no birth date is known', async () => {
    const poet = {
      id: 'test-baptized',
      type: 'poet',
      name: { firstname: 'Alberta', lastname: 'Eltzholtz' },
      period: {
        baptized: { date: '1846-05-24', place: null, inon: 'in' },
        dead: { date: '1934-05-19', place: null, inon: 'in' },
      },
    };
    const timeline = await buildPoetTimelineJson(poet, {
      workids: new Map([[poet.id, []]]),
      works: new Map(),
      timeline: [],
    });

    expect(timeline.map(item => item.content_html[0][0])).toEqual([
      'Eltzholtz døbt.',
      'Eltzholtz død.',
    ]);
  });

  it('normalizes partial and approximate dates', () => {
    expect(normalizeTimelineDate('1818')).toBe('1818-01-01');
    expect(normalizeTimelineDate('1818-06')).toBe('1818-06-01');
    expect(normalizeTimelineDate('1818-06-07')).toBe('1818-06-07');
    expect(normalizeTimelineDate('ca. 1818')).toBe('1818-01-01');
    expect(normalizeTimelineDate('c. 1818-06')).toBe('1818-06-01');
    expect(normalizeTimelineDate('-1818')).toBe('-1818-01-01');
  });

  it('compares normalized dates correctly', () => {
    expect(compareNormalizedDate('1818-01-01', '1819-01-01')).toBe(-1);
    expect(compareNormalizedDate('1819-01-01', '1818-01-01')).toBe(1);
    expect(compareNormalizedDate('1818-06-01', '1818-07-01')).toBe(-1);
    expect(compareNormalizedDate('-1818-01-01', '1818-01-01')).toBe(-1);
    expect(compareNormalizedDate('1818-01-01', '1818-01-01')).toBe(0);
  });

  it('sorts timelines in place by normalized date', () => {
    const timeline = [
      { normalized_date: '1840-01-01', id: 'c' },
      { normalized_date: '1818-01-01', id: 'a' },
      { normalized_date: '1830-01-01', id: 'b' },
      { normalized_date: '-0100-01-01', id: 'd' },
    ];

    const sorted = sortedTimeline(timeline);

    expect(sorted).toBe(timeline);
    expect(sorted.map((item) => item.id)).toEqual(['d', 'a', 'b', 'c']);
  });
});
