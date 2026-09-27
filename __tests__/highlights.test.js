import { parseHighlightIntervals } from '../common/highlights.js';

describe('highlight intervals', () => {
  it('parses individual lines, ranges, and open-ended ranges', () => {
    expect(parseHighlightIntervals('1,2,5-6,9ff')).toEqual([
      { from: 1, to: 1 },
      { from: 2, to: 2 },
      { from: 5, to: 6 },
      { from: 9, to: Number.MAX_VALUE },
    ]);
  });

  it('ignores unsupported selectors', () => {
    expect(parseHighlightIntervals('Blomsteraande')).toEqual([]);
    expect(parseHighlightIntervals(null)).toEqual([]);
  });

  it('only accepts an open-ended range as the final selector', () => {
    expect(parseHighlightIntervals('1ff,5')).toEqual([]);
    expect(parseHighlightIntervals('1,5ff')).toEqual([
      { from: 1, to: 1 },
      { from: 5, to: Number.MAX_VALUE },
    ]);
  });
});
