const Dates = require('../common/dates.js');

describe('shared date helpers', () => {
  it('keeps precise date formatting available for real dates', () => {
    expect(Dates.formattedDate('1818-06-07')).toBe('7/6 1818');
  });

  it('formats work title dates as years only', () => {
    expect(Dates.formattedDate('1818-06-07')).toBe('7/6 1818');
    expect(Dates.formatTitleAndYear('Digte', '1818-06-07')).toBe(
      'Digte (1818)'
    );
    expect(Dates.formatTitleAndYear('Digte', 'ca. 1818-06-07')).toBe(
      'Digte (c. 1818)'
    );
    expect(Dates.formatTitleAndYear('Digte', '-0100-06-07')).toBe(
      'Digte (100 f.Kr.)'
    );
  });

  it('omits unknown years from work titles', () => {
    expect(Dates.formatTitleAndYear('Digte', null)).toBe('Digte');
    expect(Dates.formatTitleAndYear('Digte', '?')).toBe('Digte');
    expect(Dates.formatTitleAndYear('Digte', 'uden år')).toBe('Digte');
  });

  it('normalizes timeline dates independently of display formatting', () => {
    expect(Dates.normalizeTimelineDate('ca. 1818-06')).toBe('1818-06-01');
    expect(Dates.normalizeTimelineDate('-0100-02')).toBe('-0100-02-01');
  });
});
