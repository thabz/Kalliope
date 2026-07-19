import {
  buildExternalIdentifierLinks,
  externalIdentifierIds,
} from '../common/external-identifiers.js';

describe('external identifiers', () => {
  it('builds links for every identifier in info.xml', () => {
    const identifiers = {
      wikidata: 'Q5673',
      'gravsted-dk': 'hcandersen',
      viaf: '4925902',
      'lex-dk': 'H.C._Andersen',
      'teaterleksikon-lex-dk': 'H.C._Andersen',
      'biografisk-leksikon-lex-dk': 'H.C._Andersen',
      'litteraturpriser-dk': 'AHCAndersen',
      'runeberg-org': 'andersen',
      'gutenberg-org': '2298',
    };

    expect(buildExternalIdentifierLinks(identifiers).map(({ id, href }) => ({
      id,
      href,
    }))).toEqual([
      { id: 'viaf', href: 'https://viaf.org/viaf/4925902/' },
      { id: 'wikidata', href: 'https://www.wikidata.org/wiki/Q5673' },
      { id: 'lex-dk', href: 'https://lex.dk/H.C._Andersen' },
      {
        id: 'biografisk-leksikon-lex-dk',
        href: 'https://biografiskleksikon.lex.dk/H.C._Andersen',
      },
      {
        id: 'litteraturpriser-dk',
        href: 'https://www.litteraturpriser.dk/aut/AHCAndersen.htm',
      },
      {
        id: 'teaterleksikon-lex-dk',
        href: 'https://teaterleksikon.lex.dk/H.C._Andersen',
      },
      {
        id: 'runeberg-org',
        href: 'https://runeberg.org/authors/andersen.html',
      },
      {
        id: 'gutenberg-org',
        href: 'https://www.gutenberg.org/ebooks/author/2298',
      },
      {
        id: 'gravsted-dk',
        href: 'https://www.gravsted.dk/person.php?navn=hcandersen',
      },
    ]);
    expect(Object.keys(identifiers)).toEqual(externalIdentifierIds);
  });

  it('omits missing identifiers', () => {
    expect(buildExternalIdentifierLinks({ viaf: '4925902' })).toHaveLength(1);
    expect(buildExternalIdentifierLinks(null)).toEqual([]);
  });

  it('separates authority identifiers from external references', () => {
    const identifiers = {
      wikidata: 'Q5673',
      viaf: '4925902',
      'lex-dk': 'H.C._Andersen',
      'gutenberg-org': '2298',
    };

    expect(
      buildExternalIdentifierLinks(identifiers, { category: 'authority' }).map(
        ({ id }) => id,
      ),
    ).toEqual(['viaf', 'wikidata']);
    expect(
      buildExternalIdentifierLinks(identifiers, { category: 'reference' }).map(
        ({ id }) => id,
      ),
    ).toEqual(['lex-dk', 'gutenberg-org']);
  });

  it('orders external references by priority', () => {
    const identifiers = {
      'gravsted-dk': 'hcandersen',
      'gutenberg-org': '2298',
      'runeberg-org': 'andersen',
      'teaterleksikon-lex-dk': 'H.C._Andersen',
      'litteraturpriser-dk': 'AHCAndersen',
      'biografisk-leksikon-lex-dk': 'H.C._Andersen',
      'lex-dk': 'H.C._Andersen',
    };

    expect(
      buildExternalIdentifierLinks(identifiers, { category: 'reference' }).map(
        ({ id }) => id,
      ),
    ).toEqual([
      'lex-dk',
      'biografisk-leksikon-lex-dk',
      'litteraturpriser-dk',
      'teaterleksikon-lex-dk',
      'runeberg-org',
      'gutenberg-org',
      'gravsted-dk',
    ]);
  });
});
