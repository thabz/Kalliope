import { crossReference, normalizeName, parseWikidataSnapshot } from '../tools/wikidata-collector.js';

const provenance = { endpoint: 'https://query.wikidata.org/sparql', retrievedAt: '2026-08-07T00:00:00.000Z', queryVersion: 'test', querySha256: 'query', snapshotSha256: 'snapshot' };

describe('Wikidata collector', () => {
  it('groups raw bindings and keeps raw and normalized values separate', () => {
    const observations = parseWikidataSnapshot({ results: { bindings: [
      { person: { value: 'http://www.wikidata.org/entity/Q1' }, personLabel: { value: 'Test, Person' }, alias: { value: 'T. Person' }, birth: { value: '1900-01-01T00:00:00Z' }, occupation: { value: 'http://www.wikidata.org/entity/Q49757' } },
      { person: { value: 'http://www.wikidata.org/entity/Q1' }, personLabel: { value: 'Test, Person' }, viaf: { value: '123' }, gnd: { value: '12345' } },
    ] } }, provenance);
    expect(observations).toHaveLength(1);
    expect(observations[0]).toMatchObject({ sourceId: 'Q1', original: { aliases: ['T. Person'], rawBindings: expect.any(Array) }, normalized: { normalizedName: 'test person', birthYear: '1900', identifiers: { wikidata: 'Q1', viaf: '123', gnd: '12345' } }, provenance: { snapshotSha256: 'snapshot' } });
  });

  it('uses stable identifiers before names and reports date conflicts', () => {
    const observation = { sourceId: 'Q1', normalized: { normalizedName: normalizeName('Test Person'), aliases: [], birthYear: '1900', deathYear: '1970', identifiers: { wikidata: 'Q1' } } };
    const references = crossReference(observation, { kalliope: [ { sourceId: 'person', identifiers: { wikidata: 'Q1' }, birthYear: '1900', deathYear: '1970' }, { sourceId: 'other', normalizedName: 'test person', birthYear: '1901', deathYear: '1970' } ] });
    expect(references[0]).toMatchObject({ status: 'strong-match' });
    expect(references[0].matches).toEqual(expect.arrayContaining([expect.objectContaining({ status: 'strong-match', signals: ['stable-identifier'] })]));
    expect(references[0].matches).toEqual(expect.arrayContaining([expect.objectContaining({ status: 'conflict' })]));
  });

  it('matches by stable GND identifier', () => {
    const observation = { sourceId: 'Q2', normalized: { normalizedName: normalizeName('Bohr'), aliases: [], birthYear: '1885', deathYear: '1962', identifiers: { wikidata: 'Q2', gnd: '118550173' } } };
    const references = crossReference(observation, { kalliope: [ { sourceId: 'bohr', identifiers: { gnd: '118550173' }, birthYear: '1885', deathYear: '1962' } ] });
    expect(references[0]).toMatchObject({ status: 'strong-match' });
    expect(references[0].matches).toEqual(expect.arrayContaining([expect.objectContaining({ sourceId: 'bohr', status: 'strong-match', signals: ['stable-identifier'] })]));
  });
}); 
