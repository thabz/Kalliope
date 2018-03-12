describe('ICU checks', () => {
  it(`Har ICU installeret`, () => {
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
