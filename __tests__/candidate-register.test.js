import { extractDflTitleUrls, matchRecord, normalizeName, parseDfl, parseDflTitles, parseWikidata, yearFromDate } from '../tools/candidate-register.js';

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

  it('parses GND from wikidata query results', () => {
    const records = parseWikidata({
      personLabel: { value: 'Niels Bohr' },
      person: { value: 'https://www.wikidata.org/entity/Q1390' },
      gnd: { value: '118550173' },
      birth: { value: '1885-10-07' },
      death: { value: '1962-11-18' },
    });
    expect(records[0]).toMatchObject({ identifiers: { wikidata: 'Q1390', gnd: '118550173' } });
  });

  it('extracts Danish poetry works and author provenance from a DFL title page', () => {
    const records = parseDflTitles('Babylon marcherer, (1970, digte, dansk)<br>af <a href="/1850bib/knudsen.htm">Erik Knudsen</a>', 'https://danskforfatterleksikon.dk/1850/sk1850titb.htm');
    expect(records[0]).toMatchObject({ title: 'Babylon marcherer', year: '1970', type: 'digte', language: 'dansk', sourceUrl: 'https://danskforfatterleksikon.dk/1850/sk1850titb.htm' });
    expect(records[0].authors[0]).toMatchObject({ name: 'Erik Knudsen', sourceId: 'knudsen', sourceUrl: 'https://danskforfatterleksikon.dk/1850bib/knudsen.htm' });
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
