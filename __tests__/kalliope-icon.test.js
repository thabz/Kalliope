import {
  getKalliopeIconDate,
  getKalliopeIconSrc,
} from '../common/kalliope-icon.js';

const date = (month, day) => new Date(2026, month - 1, day);

describe('Kalliope header icon', () => {
  test('uses a valid preview date from the URL', () => {
    expect(getKalliopeIconSrc(getKalliopeIconDate('?date=12-03'))).toBe(
      '/images/about/kalliope-days/12-03.jpg'
    );
  });

  test.each(['?date=02-30', '?date=13-01', '?date=2-14', '?date=wrong'])(
    'ignores the invalid preview date %s',
    search => {
      const currentDate = date(1, 10);

      expect(getKalliopeIconDate(search, currentDate)).toBe(currentDate);
    }
  );

  test.each([
    [2, 14],
    [3, 8],
    [4, 2],
    [4, 9],
    [5, 17],
    [6, 28],
    [7, 14],
    [9, 8],
    [11, 14],
    [12, 3],
    [12, 24],
    [12, 31],
  ])('uses the dated icon on %i-%i', (month, day) => {
    const dateKey = `${String(month).padStart(2, '0')}-${String(day).padStart(
      2,
      '0'
    )}`;

    expect(getKalliopeIconSrc(date(month, day))).toBe(
      `/images/about/kalliope-days/${dateKey}.jpg`
    );
  });

  test('uses the general December icon from December 1 through 26', () => {
    expect(getKalliopeIconSrc(date(12, 1))).toBe(
      '/images/about/kalliope-days/12-xx.jpg'
    );
    expect(getKalliopeIconSrc(date(12, 26))).toBe(
      '/images/about/kalliope-days/12-xx.jpg'
    );
  });

  test("uses the ruff icon on Kingo's birthday", () => {
    expect(getKalliopeIconSrc(date(12, 15))).toBe(
      '/images/about/kalliope-days/09-08.jpg'
    );
  });

  test('uses the standard icon after December 26 without a dated icon', () => {
    expect(getKalliopeIconSrc(date(12, 27))).toBe('/images/about/poet.jpg');
  });

  test('uses the standard icon on ordinary dates', () => {
    expect(getKalliopeIconSrc(date(1, 10))).toBe('/images/about/poet.jpg');
  });
});
