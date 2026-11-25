import { DOMParser } from '@xmldom/xmldom';
import { extractDates } from '../tools/build-static/parsing.js';
import { textDateEntries, addTextDates } from '../tools/build-static/text-dates.js';

it('preserves repeated date types without changing the existing first-date fields', () => {
  const head = new DOMParser().parseFromString('<head><dates>' +
    '<event>1800-01-01</event><event>1880-02-02</event><event>1880-02-02</event>' +
    '<performed>1900-03-03</performed><performed>1900-03-04</performed>' +
    '</dates></head>', 'text/xml').documentElement;
  const dates = extractDates(head);
  expect(dates.event).toBe('1800-01-01');
  expect(textDateEntries(dates)).toEqual([
    { type: 'performed', date: '1900-03-03' }, { type: 'event', date: '1800-01-01' },
    { type: 'event', date: '1880-02-02' }, { type: 'performed', date: '1900-03-04' },
  ]);
  const index = new Map();
  addTextDates(index, { id: 'poem', type: 'text' }, dates);
  expect([...index.keys()]).toEqual(['1900-03-03', '1800-01-01', '1880-02-02', '1900-03-04']);
  expect(index.get('1880-02-02')).toEqual([{ id: 'poem', textType: 'text', dateType: 'event' }]);
});

it('ignores empty dates and deduplicates entries without merging different types', () => {
  expect(textDateEntries({ written: ' ', event: ' 1900-01-01 ', additional: [
    { type: 'event', date: '1900-01-01' }, { type: 'written', date: '1900-01-01' },
    { type: 'published', date: '1900-01-02' },
  ] })).toEqual([{ type: 'event', date: '1900-01-01' }, { type: 'written', date: '1900-01-01' }]);
});
