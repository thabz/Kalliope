import {
  extractDflAuthorIndexUrls,
  extractDflTitleUrls,
  matchRecord,
  normalizeName,
  parseDanishAuthorIds,
  parseDfl,
  parseDflTitles,
  selectDflPoetryRelations,
  yearFromDate,
} from '../tools/candidate-register.js';

describe('candidate register normalization', () => {
  it('normalizes punctuation, whitespace and composed characters without changing source values', () => {
    expect(normalizeName('  H.C.  Andersen ')).toBe('h c andersen');
  });

  it('extracts years from full and partial dates', () => {
    expect(yearFromDate('1805-04-02')).toBe('1805');
    expect(yearFromDate('ca. 1875')).toBe('1875');
    expect(yearFromDate('?')).toBeNull();
  });

  it('parses DFL links as source records with provenance', () => {
    const records = parseDfl('<a href="/1850bib/andersen.htm">Andersen, H.C. (1805-1875)</a>');
    expect(records[0]).toMatchObject({ source: 'danskforfatterleksikon', sourceId: 'andersen', sourceUrl: 'https://danskforfatterleksikon.dk/1850bib/andersen.htm', birthYear: '1805', deathYear: '1875' });
  });

  it('discovers DFL title archive files from the title index', () => {
    expect(extractDflTitleUrls('<a href="sk1850tita.htm">A</a><a href="sk1850titb.htm">B</a>')).toEqual([
      'https://danskforfatterleksikon.dk/1850/sk1850tita.htm',
      'https://danskforfatterleksikon.dk/1850/sk1850titb.htm',
    ]);
  });

  it('discovers Danish-original author indexes and their stable ids', () => {
    expect(extractDflAuthorIndexUrls(
      '<a href="sk1850forfa.htm">A</a><a href="sk1850forfb.htm">B</a>'
    )).toEqual([
      'https://danskforfatterleksikon.dk/1850/sk1850forfa.htm',
      'https://danskforfatterleksikon.dk/1850/sk1850forfb.htm',
    ]);
    expect(parseDanishAuthorIds(
      '<div class="authorelement">A <a href="AAnna.htm"><b>Anna</b></a></div>'
    )).toEqual(['AAnna']);
  });

  it('extracts Danish poetry works and author provenance from a DFL title page', () => {
    const records = parseDflTitles('Babylon marcherer, (1970, digte, dansk)<br>af <a href="/1850bib/knudsen.htm">Erik Knudsen</a>', 'https://danskforfatterleksikon.dk/1850/sk1850titb.htm');
    expect(records[0]).toMatchObject({ title: 'Babylon marcherer', year: '1970', type: 'digte', language: 'dansk', sourceUrl: 'https://danskforfatterleksikon.dk/1850/sk1850titb.htm' });
    expect(records[0].authors[0]).toMatchObject({ name: 'Erik Knudsen', sourceId: 'knudsen', sourceUrl: 'https://danskforfatterleksikon.dk/1850bib/knudsen.htm' });
  });

  it('bevarer oversætteren som særskilt rolle', () => {
    const records = parseDflTitles(
      'Et digt, (1970, digte, dansk)<br>af <a href="../1850u/u1.htm">Poet</a><br>oversat af <a href="../1850/OOtto.htm">Otto</a>',
      'https://danskforfatterleksikon.dk/1850/sk1850tite.htm'
    );
    expect(records[0].authors.map(author => author.role)).toEqual([
      'author',
      'translator',
    ]);
  });

  it('vælger danske digtere og oversættere til dansk, men aldrig prosa', () => {
    const works = selectDflPoetryRelations([
      {
        type: 'digte',
        language: 'dansk',
        authors: [
          { sourceId: 'poet', role: 'author' },
          { sourceId: 'outbound-translator', role: 'translator' },
        ],
      },
      {
        type: 'digte',
        language: 'engelsk',
        authors: [
          { sourceId: 'foreign-poet', role: 'author' },
          { sourceId: 'danish-translator', role: 'translator' },
        ],
      },
      {
        type: 'roman',
        language: 'dansk',
        authors: [{ sourceId: 'novelist', role: 'author' }],
      },
    ]);
    expect(works.map(work => work.authors[0].sourceId)).toEqual([
      'poet',
      'danish-translator',
    ]);
  });
});

describe('candidate register matching', () => {
  const kalliope = [{ sourceId: 'andersen', normalizedName: 'h c andersen', birthYear: '1805', deathYear: '1875', identifiers: { wikidata: 'Q5673' } }];

  it('uses an external id as a certain match', () => {
    expect(matchRecord({ normalizedName: 'different name', birthYear: null, deathYear: null, identifiers: { wikidata: 'Q5673' }, evidence: { poetry: true, language: true } }, kalliope)).toMatchObject({ status: 'already-in-kalliope', confidence: 'certain', kalliopeId: 'andersen' });
  });

  it('does not merge on name alone', () => {
    expect(matchRecord({ normalizedName: 'h c andersen', birthYear: null, deathYear: null, identifiers: {}, evidence: { poetry: true, language: true } }, kalliope)).toMatchObject({ status: 'needs-review', confidence: 'possible' });
  });
});
