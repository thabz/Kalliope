import { fullDatesInText, findMissingTextDates } from '../tools/text-date-validation.js';

it.each([
  ['5te Marts 1898', '1898-03-05'], ['4. Dec. 1909', '1909-12-04'],
  ['1ste Junii 1793', '1793-06-01'], ['28 Martii 1790', '1790-03-28'],
  ['1er juin 1828', '1828-06-01'], ['15. März 1769', '1769-03-15'],
  ['September 16, 1818', '1818-09-16'], ['May 4, 1865', '1865-05-04'],
  ['11th of April 1900', '1900-04-11'], ['1909-12-04', '1909-12-04'],
  ['29. Februar 2000', '2000-02-29'], ['25. Maj 2142', '2142-05-25'],
])('recognizes the complete printed date %s', (text, iso) => {
  expect(fullDatesInText(text)).toEqual([expect.objectContaining({ date: iso, printedDate: text })]);
});

it.each(['Februar 1900', '5te Marts', 'ca. 5te Marts 1898', '5te Marts 1898?',
  '31. April 1898', '29. Februar 1900', '123. Maj 1898', '5te Marts 1898-1899'])(
  'does not invent a complete date from %s', text => expect(fullDatesInText(text)).toEqual([]),
);

it('finds every date in title fields while excluding their notes', () => {
  const data = '<text id="poem"><head><title>Den 5te Marts 1898</title>' +
    '<subtitle><line>Født 1. Januar 1800</line><line>Død 2. Februar 1880<footnote>3. Marts 1900</footnote></line></subtitle>' +
    '<suptitle>Den 5te Marts 1898</suptitle></head></text>';
  expect(findMissingTextDates({ file: 'work.xml', data }).map(f => f.date))
    .toEqual(['1898-03-05', '1800-01-01', '1880-02-02']);
});

it('checks a closing dateline through layout markup but leaves ordinary prose alone', () => {
  const data = '<text id="poem"><head/><body><poetry>Jeg mindes 5. Marts 1898.\n' +
    '<nonum><right><small>Bozen, 6. April 1908.</small></right></nonum>\n</poetry></body></text>';
  expect(findMissingTextDates({ file: 'work.xml', data }).map(f => [f.date, f.location]))
    .toEqual([['1908-04-06', 'closing']]);
});

it('does not count a date in a closing note or an undated signature as a dateline', () => {
  const data = '<text><head/><body><poetry>Sidste vers<footnote>5. Marts 1898.</footnote></poetry></body></text>';
  expect(findMissingTextDates({ file: 'work.xml', data })).toEqual([]);
});

it('keeps nested texts, work dates and bibliographic sources separate', () => {
  const data = '<kalliopework><workhead><dates><event>1898-03-05</event></dates></workhead><workbody>' +
    '<text id="parent"><head><subtitle>5. Marts 1898</subtitle><source>6. April 1900</source></head><body>' +
    '<poetry>Vers</poetry><text id="child"><head><subtitle>6. April 1900</subtitle><dates><event>1898-03-05</event></dates></head></text>' +
    '</body></text></workbody></kalliopework>';
  expect(findMissingTextDates({ file: 'work.xml', data }).map(f => [f.textId, f.date]))
    .toEqual([['parent', '1898-03-05'], ['child', '1900-04-06']]);
});

it('accepts all registered types, including repeated dates of the same type', () => {
  const data = '<text><head><subtitle>1. Januar 1800 — 2. Februar 1880</subtitle>' +
    '<dates><event>1800-01-01</event><event>1880-02-02</event></dates></head></text>';
  expect(findMissingTextDates({ file: 'work.xml', data })).toEqual([]);
});
