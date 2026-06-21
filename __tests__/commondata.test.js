import CommonData from '../common/commondata.js';

describe('common data', () => {
  it('exposes image widths and formats', () => {
    expect(CommonData.availableImageWidths).toEqual([
      100, 150, 200, 250, 300, 400, 500, 600, 800,
    ]);
    expect(CommonData.availableImageFormats).toEqual(['jpg']);
    expect(CommonData.fallbackImagePostfix).toBe('-w800.jpg');
  });

  it('includes the expected color tokens', () => {
    expect(CommonData.lightTextColor).toBe('#767676');
    expect(CommonData.linkColor).toMatch(/^hsla\(/);
  });

  it('includes the expected country entries', () => {
    const danish = CommonData.countries.find((country) => country.code === 'dk');
    const other = CommonData.countries.find((country) => country.code === 'un');
    expect(danish.adjective.da).toBe('danske');
    expect(danish.adjective.en).toBe('Danish');
    expect(other.adjective.da).toBe('andre');
    expect(other.adjective.en).toBe('other');
  });
});
