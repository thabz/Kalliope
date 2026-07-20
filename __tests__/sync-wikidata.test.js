import { readFileSync } from 'fs';

describe('Wikidata sync', () => {
  it('maps Dansk Kvindebiografisk Leksikon to its info.xml identifier', () => {
    const script = readFileSync('tools/sync-wikidata.rb', 'utf8');

    expect(script).toContain(
      "addIdentifierNode(externalIds, 'P7939', 'kvindebiografisk-leksikon-lex-dk', doc, new_identifiers)",
    );
  });
});
