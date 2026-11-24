jest.mock('../tools/build-static/xml.js', () => ({
  ...jest.requireActual('../tools/build-static/xml.js'),
  loadXMLDoc: jest.fn(),
}));
jest.mock('../tools/build-static/parsing.js', () => ({
  get_picture: jest.fn(),
}));

import { loadXMLDoc, parseXMLFragment } from '../tools/build-static/xml.js';
import { get_picture } from '../tools/build-static/parsing.js';
import {
  buildGlobalTimeline,
  buildPoetTimelineJson,
  compareNormalizedDate,
  normalizeTimelineDate,
  sortedTimeline,
} from '../tools/build-static/timeline.js';

const historyEvents = (dates) =>
  dates.map((date) => ({
    date,
    type: 'text',
    is_history_item: true,
    content_html: [['Fælles begivenhed']],
  }));

describe('timeline helpers', () => {
  beforeEach(() => {
    loadXMLDoc.mockReset();
    get_picture.mockReset();
  });

  it('retains artist and museum metadata for artwork in historical events', async () => {
    loadXMLDoc.mockReturnValue(parseXMLFragment(
      '<events><entry date="1801-04-02" type="image">' +
      '<picture artwork="lorentzen/slaget-paa-rheden-1802"/>' +
      '</entry></events>'
    ));
    const picture = {
      src: '/images/lorentzen/slaget-paa-rheden-1802.jpg',
      artist: { id: 'lorentzen' },
      museum: { id: 'fnm' },
      remoteUrl: 'https://example.org/artwork',
      content_html: [['Slaget paa Rheden']],
    };
    get_picture.mockResolvedValue(picture);
    await expect(buildGlobalTimeline({})).resolves.toEqual([{
      ...picture, date: '1801-04-02', type: 'image', is_history_item: true,
    }]);
  });

  it('preserves publication events when life dates are undocumented', async () => {
    const poet = {
      id: 'test-undocumented-dates',
      type: 'poet',
      name: { lastname: 'Forfatter' },
      period: null,
    };
    const works = new Map([
      [`${poet.id}/1671`, { title: 'Første værk', year: '1671', published: '1671' }],
      [`${poet.id}/1672`, { title: 'Andet værk', year: '1672', published: '1672' }],
    ]);
    const timeline = await buildPoetTimelineJson(poet, {
      workids: new Map([[poet.id, ['1671', '1672']]]),
      works,
      timeline: [],
    });

    expect(timeline.map(item => item.content_html[0][0])).toEqual([
      'Forfatter: Første værk.',
      'Forfatter: Andet værk.',
    ]);
  });

  it.each([null, {}])('keeps publication events when life dates are unknown (%p)', async period => {
    const poet = {
      id: 'test-unknown-dates', type: 'poet', name: { lastname: 'Digter' }, period,
    };
    const works = [1840, 1841].map(year => [
      `${poet.id}/${year}`,
      { year, published: `${year}-01-01`, title: `Værk ${year}`, has_content: false },
    ]);
    const timeline = await buildPoetTimelineJson(poet, {
      workids: new Map([[poet.id, ['1840', '1841']]]),
      works: new Map(works), timeline: historyEvents(['1850']),
    });
    expect(timeline.map(item => item.date)).toEqual(['1840-01-01', '1841-01-01']);
    expect(timeline.map(item => item.content_html[0][0])).toEqual([
      'Digter: Værk 1840.', 'Digter: Værk 1841.',
    ]);
  });

  it('limits shared events to 150 years after birth when the death year is unknown', async () => {
    const poet = {
      id: 'test-saxo', type: 'poet', name: { lastname: 'Saxo' },
      period: { born: { date: 'ca. 1165' }, dead: { date: '?' } },
    };
    const works = [1644, 2015].map(year => [
      `${poet.id}/${year}`,
      { year, published: `${year}`, title: `Udgave ${year}`, has_content: false },
    ]);
    const timeline = await buildPoetTimelineJson(poet, {
      workids: new Map([[poet.id, ['1644', '2015']]]),
      works: new Map(works),
      timeline: historyEvents(['1165', '1208', '1314', '1315', '2010']),
    });

    expect(timeline.map(item => item.date)).toEqual([
      'ca. 1165', '1208', '1314', '1644', '2015',
    ]);
    expect(timeline.filter(item => item.is_history_item)).toHaveLength(2);
  });

  it('uses baptism as the start year when birth is undocumented', async () => {
    const poet = {
      id: 'test-baptized-unknown-death', type: 'poet', name: { lastname: 'Digter' },
      period: {
        born: { date: '?' },
        baptized: { date: '1200-01-01' },
        dead: { date: '?' },
      },
    };
    const timeline = await buildPoetTimelineJson(poet, {
      workids: new Map([[poet.id, ['1400']]]),
      works: new Map([
        [`${poet.id}/1400`, {
          year: 1400, published: '1400', title: 'Værk', has_content: false,
        }],
      ]),
      timeline: historyEvents(['1250', '1350']),
    });

    expect(timeline.map(item => item.date)).toEqual([
      '1200-01-01', '1250', '1400',
    ]);
    expect(timeline.filter(item => item.is_history_item)).toHaveLength(1);
  });

  it('keeps shared events capped at a known death year with later editions', async () => {
    const poet = {
      id: 'test-known-death', type: 'poet', name: { lastname: 'Digter' },
      period: { born: { date: '1165' }, dead: { date: '1208' } },
    };
    const timeline = await buildPoetTimelineJson(poet, {
      workids: new Map([[poet.id, ['2015']]]),
      works: new Map([
        [`${poet.id}/2015`, {
          year: 2015, published: '2015', title: 'Sen udgave', has_content: false,
        }],
      ]),
      timeline: historyEvents(['1170', '1250']),
    });

    expect(timeline.map(item => item.date)).toEqual([
      '1165', '1170', '1208', '2015',
    ]);
    expect(timeline.filter(item => item.is_history_item)).toHaveLength(1);
  });

  it('handles approximate birth years before year zero', async () => {
    const poet = {
      id: 'test-bce', type: 'poet', name: { lastname: 'Digter' },
      period: { born: { date: 'ca. -0573' }, dead: { date: '?' } },
    };
    const timeline = await buildPoetTimelineJson(poet, {
      workids: new Map([[poet.id, ['-0400']]]),
      works: new Map([
        [`${poet.id}/-0400`, {
          year: -400, published: '-0400', title: 'Værk', has_content: false,
        }],
      ]),
      timeline: historyEvents(['-0500', '-0423']),
    });

    expect(timeline.map(item => item.date)).toEqual([
      'ca. -0573', '-0500', '-0400',
    ]);
  });

  it('renders baptism as baptism when no birth date is known', async () => {
    const poet = {
      id: 'test-baptized',
      type: 'poet',
      name: { firstname: 'Alberta', lastname: 'Eltzholtz' },
      period: {
        baptized: { date: '1846-05-24', place: null, inon: 'in' },
        dead: { date: '1934-05-19', place: null, inon: 'in' },
      },
    };
    const timeline = await buildPoetTimelineJson(poet, {
      workids: new Map([[poet.id, []]]),
      works: new Map(),
      timeline: [],
    });

    expect(timeline.map(item => item.content_html[0][0])).toEqual([
      'Eltzholtz døbt.',
      'Eltzholtz død.',
    ]);
  });

  it('normalizes partial and approximate dates', () => {
    expect(normalizeTimelineDate('1818')).toBe('1818-01-01');
    expect(normalizeTimelineDate('1818-06')).toBe('1818-06-01');
    expect(normalizeTimelineDate('1818-06-07')).toBe('1818-06-07');
    expect(normalizeTimelineDate('ca. 1818')).toBe('1818-01-01');
    expect(normalizeTimelineDate('c. 1818-06')).toBe('1818-06-01');
    expect(normalizeTimelineDate('-1818')).toBe('-1818-01-01');
  });

  it('compares normalized dates correctly', () => {
    expect(compareNormalizedDate('1818-01-01', '1819-01-01')).toBe(-1);
    expect(compareNormalizedDate('1819-01-01', '1818-01-01')).toBe(1);
    expect(compareNormalizedDate('1818-06-01', '1818-07-01')).toBe(-1);
    expect(compareNormalizedDate('-1818-01-01', '1818-01-01')).toBe(-1);
    expect(compareNormalizedDate('1818-01-01', '1818-01-01')).toBe(0);
  });

  it('sorts timelines in place by normalized date', () => {
    const timeline = [
      { normalized_date: '1840-01-01', id: 'c' },
      { normalized_date: '1818-01-01', id: 'a' },
      { normalized_date: '1830-01-01', id: 'b' },
      { normalized_date: '-0100-01-01', id: 'd' },
    ];

    const sorted = sortedTimeline(timeline);

    expect(sorted).toBe(timeline);
    expect(sorted.map((item) => item.id)).toEqual(['d', 'a', 'b', 'c']);
  });
});
