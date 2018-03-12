describe('ICU checks', () => {
  // https://nodejs.org/api/intl.html#intl_providing_icu_data_at_runtime
  it(`Har ICU overhovedet`, () => {
    expect(typeof Intl).toBe('object');
    expect(typeof process.versions.icu).toBe('string');
  });

  it(`Har fuld ICU`, () => {
    // https://nodejs.org/api/intl.html#intl_providing_icu_data_at_runtime
    const hasFullICU = (() => {
      try {
        const january = new Date(9e8);
        const spanish = new Intl.DateTimeFormat('es', { month: 'long' });
        return spanish.format(january) === 'enero';
      } catch (err) {
        return false;
      }
    })();
    expect(hasFullICU).toBe(true);
  });
});
