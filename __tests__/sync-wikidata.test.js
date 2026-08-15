import { readFileSync } from 'fs';

describe('Wikidata sync', () => {
  it('maps Dansk Kvindebiografisk Leksikon to its info.xml identifier', () => {
    const script = readFileSync('tools/sync-wikidata.rb', 'utf8');

    expect(script).toContain(
      "addIdentifierNode(externalIds, 'P7939', 'kvindebiografisk-leksikon-lex-dk', doc, new_identifiers)",
    );
  });

  it('maps Dansk Forfatterleksikon to its info.xml identifier', () => {
    const script = readFileSync('tools/sync-wikidata.rb', 'utf8');

    expect(script).toContain(
      "addIdentifierNode(externalIds, 'P12386', 'danskforfatterleksikon-dk', doc, new_identifiers)",
    );
  });

  it('maps GND to its info.xml identifier', () => {
    const script = readFileSync('tools/sync-wikidata.rb', 'utf8');

    expect(script).toContain("addIdentifierNode({ 'gnd' => gndId }, 'gnd', 'gnd', doc, new_identifiers)");
  });
});
