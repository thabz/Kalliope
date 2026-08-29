import { auditAuthors, authorKey, parseDflAuthorPage } from '../tools/dfl-author-audit.js';

describe('DFL author audit', () => {
  it('keys source ids separately from names', () => {
    expect(authorKey({ sourceId: 'knudsen', name: 'Erik Knudsen' })).toBe('dfl:knudsen');
    expect(authorKey({ sourceId: null, name: 'Erik  Knudsen' })).toBe('name:erik knudsen');
  });

  it('aggregates works and keeps source names and URLs', () => {
    const audit = auditAuthors([
      { authors: [{ sourceId: 'x', name: 'X', role: 'author', sourceUrl: 'one', match: { status: 'already-in-kalliope', reason: 'dfl-id' } }] },
      { authors: [{ sourceId: 'x', name: 'X', role: 'translator', sourceUrl: 'two', match: { status: 'already-in-kalliope', reason: 'dfl-id' } }] },
      { authors: [{ sourceId: 'y', name: 'Y', role: 'author', sourceUrl: 'three', match: { status: 'unmatched', reason: 'no-id-or-name-match' } }] },
    ]);
    expect(audit.counts).toMatchObject({ uniqueAuthors: 2, matched: 1, unmatched: 1, affectedWorks: 3 });
    expect(audit.records[0]).toMatchObject({ sourceId: 'x', workCount: 2, sourceUrls: ['one', 'two'] });
    expect(audit.records[0].roles).toEqual(['author', 'translator']);
  });

  it('extracts life dates from a DFL person page', () => {
    expect(parseDflAuthorPage('<h1>Johannes Jørgensen (1866-1956)</h1>', 'https://danskforfatterleksikon.dk/1850bib/JJohannesJoergensen.htm')).toMatchObject({ pageStatus: 'life-dates-found', preferredName: 'Johannes Jørgensen', birthYear: '1866', deathYear: '1956' });
  });

  it('extracts partial life dates from DFL person pages', () => {
    expect(parseDflAuthorPage('<h2>Levende Digter (f. 1945)</h2>', 'https://example.test/living.htm')).toMatchObject({ pageStatus: 'life-dates-found', preferredName: 'Levende Digter', birthYear: '1945', deathYear: null });
    expect(parseDflAuthorPage('<h2>Ældre Digter (d. 1945)</h2>', 'https://example.test/dead.htm')).toMatchObject({ pageStatus: 'life-dates-found', preferredName: 'Ældre Digter', birthYear: null, deathYear: '1945' });
  });

  it('does not treat role or placeholder headings as people', () => {
    expect(parseDflAuthorPage('<h1>Oversat af Otto Bræmer (1806-1883)</h1>', 'https://example.test/u2.htm')).toMatchObject({ pageStatus: 'non-person-placeholder', birthYear: null, deathYear: null });
  });
});
