import { resolveDflAuthors } from '../tools/dfl-author-resolution.js';

describe('DFL author resolution', () => {
  it('uses DFL id as certain match and dates as likely match', () => {
    const result = resolveDflAuthors({
      authorAudit: { records: [
        { key: 'dfl:a', sourceId: 'a', names: ['A'], roles: ['author'], sourceUrls: [], status: 'unmatched', workCount: 1 },
        { key: 'dfl:b', sourceId: 'b', names: ['B'], roles: ['translator'], sourceUrls: [], status: 'unmatched', workCount: 1 },
      ] },
      authorPageAudit: [
        { key: 'dfl:a', sourceId: 'a', preferredName: 'A', birthYear: '1800', deathYear: '1850', pageStatus: 'life-dates-found' },
        { key: 'dfl:b', sourceId: 'b', preferredName: 'B', birthYear: '1800', deathYear: '1850', pageStatus: 'life-dates-found' },
      ],
      kalliope: [
        { sourceId: 'ka', normalizedName: 'b', name: { alternatives: [] }, birthYear: '1800', deathYear: '1850', identifiers: { 'danskforfatterleksikon-dk': 'a' } },
      ],
      wikidata: [],
      danishAuthorIds: new Set(['a']),
    });
    expect(result.records.map(record => record.resolution.status)).toEqual(['certain', 'likely']);
    expect(result.records.map(record => record.eligibility.reason)).toEqual([
      'danish-original-language-and-poetry',
      'translated-foreign-poetry-into-danish',
    ]);
  });
});
