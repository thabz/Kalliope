import {
  formattedAge,
  formattedDate,
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
});
