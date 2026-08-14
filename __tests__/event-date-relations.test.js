import {
  normalizedEventDate,
  relatedEventEntries,
} from '../tools/build-static/event-date-relations.js';

const entry = (id, dateType = 'event', hasPoetry = true) => ({
  id,
  dateType,
  hasPoetry,
});

describe('event date relations', () => {
  it('only relates texts with the same structured event date', () => {
    const dates = new Map([
      [
        '1849-06-05',
        [
          entry('current'),
          entry('same-event'),
          entry('written-that-day', 'written'),
          entry('performed-that-day', 'performed'),
          entry('prose-that-day', 'event', false),
        ],
      ],
      ['1849-06-06', [entry('other-event')]],
    ]);

    expect(
      relatedEventEntries({
        textId: 'current',
        textDates: { event: '1849-06-05', written: '1849-06-06' },
        dates,
        resolveVariants: id => [id],
      }),
    ).toEqual([entry('same-event')]);
  });

  it('does not create occasion links from written or performed dates', () => {
    const dates = new Map([
      ['1849-06-05', [entry('same-event')]],
    ]);

    expect(
      relatedEventEntries({
        textId: 'current',
        textDates: { written: '1849-06-05', performed: '1849-06-05' },
        dates,
        resolveVariants: id => [id],
      }),
    ).toEqual([]);
  });

  it('collapses variants and excludes the current variant graph', () => {
    const dates = new Map([
      [
        '1849-06-05',
        [entry('current-variant'), entry('related-a'), entry('related-b')],
      ],
    ]);
    const variants = new Map([
      ['current', ['current', 'current-variant']],
      ['current-variant', ['current', 'current-variant']],
      ['related-a', ['related-a', 'related-b']],
      ['related-b', ['related-a', 'related-b']],
    ]);

    expect(
      relatedEventEntries({
        textId: 'current',
        textDates: { event: '1849-06-05' },
        dates,
        resolveVariants: id => variants.get(id),
      }),
    ).toEqual([entry('related-a')]);
  });

  it('normalizes whitespace and rejects missing event metadata', () => {
    expect(normalizedEventDate({ event: ' 1849-06-05 ' })).toBe('1849-06-05');
    expect(normalizedEventDate({ event: ' ' })).toBeNull();
    expect(normalizedEventDate({ written: '1849-06-05' })).toBeNull();
  });
});
