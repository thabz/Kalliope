jest.mock('../tools/libs/helpers.js', () => ({ writeText: jest.fn() }));

import { writeText } from '../tools/libs/helpers.js';
import { build_anniversaries_ical } from '../tools/build-static/ical.js';
import { poetFlag } from '../common/flags.js';

describe('anniversary calendar flags', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-08T12:00:00Z'));
    writeText.mockClear();
  });

  afterEach(() => jest.useRealTimers());

  it('serializes flags in birth and death summaries while preserving event identity', () => {
    const collected = { poets: new Map([
      ['kinck', {
        id: 'kinck', country: 'no',
        name: { firstname: 'Hans Ernst', lastname: 'Kinck' },
        period: { dead: { date: '1926-10-13' } },
      }],
      ['runeberg', {
        id: 'runeberg', country: 'un', nationality: 'fi',
        name: { firstname: 'Johan Ludvig', lastname: 'Runeberg' },
        period: { born: { date: '1804-02-05' }, dead: { date: '1877-05-06' } },
      }],
      ['birth', {
        id: 'birth', country: 'un', nationality: 'fi',
        name: { firstname: 'Test', lastname: 'Digter' },
        period: { born: { date: '1826-01-02' } },
      }],
    ]) };

    build_anniversaries_ical(collected);

    expect(writeText).toHaveBeenCalledTimes(1);
    const [filename, serialized] = writeText.mock.calls[0];
    const calendar = serialized.replace(/\r?\n[ \t]/g, '');
    expect(filename).toBe('public/Kalliope.ics');
    expect(calendar).toContain('SUMMARY:🇳🇴 Hans Ernst Kinck død for 100 år siden');
    expect(calendar).toContain('SUMMARY:🇫🇮 Test Digter født for 200 år siden');
    expect(calendar).toContain('UID:kinck-dead-2026@kalliope.org');
    expect(calendar).toContain('DTSTART;VALUE=DATE:20261013');
    expect(calendar).toContain('DESCRIPTION:Hans Ernst Kinck død 13/10 1926.');
    expect(calendar).toContain('URL:https://kalliope.org/da/bio/kinck');
    expect(calendar).not.toContain('UID:runeberg-born');
    expect(calendar).not.toContain('UID:runeberg-dead');
  });

  it('requires the selected nationality to have a flag instead of falling back silently', () => {
    expect(poetFlag({ id: 'kinck', country: 'no' })).toBe('🇳🇴');
    expect(poetFlag({ id: 'test', country: 'se', nationality: 'fi' })).toBe('🇫🇮');
    expect(() => poetFlag({ id: 'runeberg', country: 'un' })).toThrow('runeberg');
    expect(() => poetFlag({ id: 'test', country: 'no', nationality: 'xx' }))
      .toThrow('xx');
  });
});
