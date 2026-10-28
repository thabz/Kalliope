import {
  formattedAge,
  formattedDate,
  formatYearInterval,
  formatYearEra,
  formattedYearRange,
  formattedYear,
  parseDate,
} from '../components/formatteddate.js';

it('it parses dates including negative years', () => {
  expect(parseDate('1982-06-07')).toEqual({
    prefix: null,
    year: 1982,
    month: 6,
    day: 7,
  });
  expect(parseDate('0100-06-07')).toEqual({
    prefix: null,
    year: 100,
    month: 6,
    day: 7,
  });
  expect(parseDate('1818-06')).toEqual({
    prefix: null,
    year: 1818,
    month: 6,
    day: null,
  });
  expect(parseDate('-0100-02-03')).toEqual({
    prefix: null,
    year: -100,
    month: 2,
    day: 3,
  });
  expect(parseDate('-8000-02-03')).toEqual({
    prefix: null,
    year: -8000,
    month: 2,
    day: 3,
  });
});

it('it formats dates including negative years', () => {
  expect(formattedDate('1982-06-07')).toEqual('7/6 1982');
  expect(formattedDate('0100-06-07')).toEqual('7/6 100');
  expect(formattedDate('-100-02-03')).toEqual('3/2 100 f.Kr.');
  expect(formattedDate('-8000-02-03')).toEqual('3/2 8000 f.Kr.');
  expect(formattedDate('ca 1818')).toEqual('c.1818');
  expect(formattedDate('-100-02-03', 'en')).toEqual('3/2 100 BC');
  expect(formattedDate('-100-02-03', 'fr')).toEqual('3/2 100 av. J.-C.');
  expect(formattedDate('-100-02-03', 'de')).toEqual('3/2 100 v. Chr.');
  expect(formattedDate('ca 1818', 'fr')).toEqual('v.1818');
  expect(formattedDate('ca 1818', 'de')).toEqual('ca.1818');
});

it('it formats single years', () => {
  expect(formattedYear('1818')).toEqual('1818');
  expect(formattedYear('-0100')).toEqual('100 f.Kr.');
  expect(formattedYear('ca 1818')).toEqual('c. 1818');
  expect(formattedYear('-0100', 'en')).toEqual('100 BC');
  expect(formattedYear('-0100', 'fr')).toEqual('100 av. J.-C.');
  expect(formattedYear('-0100', 'de')).toEqual('100 v. Chr.');
  expect(formattedYear('ca 1818', 'fr')).toEqual('v. 1818');
});

it('formats year spans in work names', () => {
  expect(formattedYear('1845-47')).toEqual('1845–47');
  expect(formattedYear('1845-1847')).toEqual('1845–1847');
});

it('it formats year eras', () => {
  expect(formatYearEra('100', 'bce')).toEqual('100 f.Kr.');
  expect(formatYearEra('20', 'ce')).toEqual('20 e.Kr.');
  expect(formatYearEra('1818', null)).toEqual('1818');
  expect(formatYearEra('100', 'bce', 'en')).toEqual('100 BC');
  expect(formatYearEra('20', 'ce', 'fr')).toEqual('20 apr. J.-C.');
  expect(formatYearEra('100', 'bce', 'de')).toEqual('100 v. Chr.');
});

it('it formats year intervals', () => {
  expect(formatYearInterval(-25, -1)).toEqual('25 f.Kr. - 1 f.Kr.');
  expect(formatYearInterval(0, 24)).toEqual('1 - 24');
  expect(formatYearInterval(25, 49)).toEqual('25 - 49');
});

it('it formats age', () => {
  expect(
    formattedAge({
      born: { date: '1818-11-29' },
      dead: { date: '1901-12-23' },
    })
  ).toEqual('(blev 83 år)');
  expect(
    formattedAge({
      born: { date: '1818-11-29' },
      dead: { date: '1901-06-02' },
    })
  ).toEqual('(blev 82 år)');
  expect(
    formattedAge({
      born: { date: '1818' },
      dead: { date: '1901' },
    })
  ).toEqual('(blev ca. 82 år)');
  expect(
    formattedAge({
      born: { date: '-0040-11-29' },
      dead: { date: '0020-12-23' },
    })
  ).toEqual('(blev 59 år)');
  expect(
    formattedAge({
      born: { date: '-0040-11-29' },
      dead: { date: '0020-10-23' },
    })
  ).toEqual('(blev 58 år)');
  expect(
    formattedAge({
      born: { date: '1818-11-29' },
      dead: { date: null },
    })
  ).toEqual(null);
  expect(
    formattedAge({
      baptized: { date: '1818-11-29' },
      dead: { date: '1901-12-23' },
    })
  ).toEqual(null);
  expect(
    formattedAge(
      {
        born: { date: '1818' },
        dead: { date: '1901' },
      },
      'en'
    )
  ).toEqual('(age c. 82 years)');
});

it('it formats year ranges', () => {
  expect(formattedYearRange('1910', '1980')).toEqual('(1910–80)');
  expect(formattedYearRange('1782', '1810')).toEqual('(1782–1810)');
  expect(formattedYearRange('-0100', '-0050')).toEqual('(100–50 f.Kr.)');
  expect(formattedYearRange('-0030', '0020')).toEqual('(30 f.Kr.–20 e.Kr.)');
  expect(formattedYearRange('?', '?')).toEqual('(Ukendt levetid)');
  expect(formattedYearRange('-0030', '0020', 'en')).toEqual('(30 BC–20 AD)');
  expect(formattedYearRange('-0030', '0020', 'fr')).toEqual(
    '(30 av. J.-C.–20 apr. J.-C.)'
  );
  expect(formattedYearRange('-0030', '0020', 'de')).toEqual(
    '(30 v. Chr.–20 n. Chr.)'
  );
  expect(formattedYearRange('?', '?', 'en')).toEqual('(Unknown lifetime)');
});

it.each([undefined, null, '?'])('marks a known death year when birth is %s', born => {
  expect(formattedYearRange(born, '1695-05-09')).toBe('(†\u00a01695)');
  expect(formattedYearRange(born, 'ca. 1700')).toBe('(†\u00a0c. 1700)');
  expect(formattedYearRange(born, '-0050')).toBe('(†\u00a050 f.Kr.)');
  expect(formattedYearRange(born, '?')).toBe('(Ukendt levetid)');
});

it.each([
  ['da', '(†\u00a0c. 1700)', '(†\u00a050 f.Kr.)'],
  ['en', '(†\u00a0c. 1700)', '(†\u00a050 BC)'],
  ['de', '(†\u00a0ca. 1700)', '(†\u00a050 v. Chr.)'],
  ['fr', '(†\u00a0v. 1700)', '(†\u00a050 av. J.-C.)'],
])('localizes death years with unknown birth in %s', (lang, approximate, bce) => {
  expect(formattedYearRange('?', 'ca. 1700', lang)).toBe(approximate);
  expect(formattedYearRange('?', '-0050', lang)).toBe(bce);
});

it('keeps a known birth year when the death year is unknown', () => {
  expect(formattedYearRange('1800', '?')).toBe('(1800–ukendt år)');
});
