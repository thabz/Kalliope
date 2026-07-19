import {
  buildExternalIdentifierLinks,
  externalIdentifierIds,
} from '../common/external-identifiers.js';

describe('external identifiers', () => {
  it('builds links for every identifier in info.xml', () => {
    const identifiers = {
      wikidata: 'Q5673',
      'wikipedia-da': 'H.C. Andersen',
      'wikipedia-en': 'Hans Christian Andersen',
      'wikipedia-fr': 'Hans Christian Andersen',
      'wikipedia-de': 'Hans Christian Andersen',
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
        id: 'wikipedia',
        href: 'https://da.wikipedia.org/wiki/H.C._Andersen',
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
      'wikipedia-da': 'H.C. Andersen',
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
      'wikipedia',
      'runeberg-org',
      'gutenberg-org',
      'gravsted-dk',
    ]);
  });

  it('uses the Wikipedia article for the requested language', () => {
    const links = buildExternalIdentifierLinks(
      {
        'wikipedia-en': 'Alexander Pope',
        'wikipedia-fr': 'Alexander Pope',
      },
      { category: 'reference', lang: 'fr' },
    );

    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      id: 'wikipedia',
      label: 'Wikipedia',
      href: 'https://fr.wikipedia.org/wiki/Alexander_Pope',
    });
  });

  it('falls back to English when the requested Wikipedia article is missing', () => {
    const links = buildExternalIdentifierLinks(
      { 'wikipedia-en': 'Alexander Pope' },
      { category: 'reference', lang: 'de' },
    );

    expect(links.map(({ href }) => href)).toEqual([
      'https://en.wikipedia.org/wiki/Alexander_Pope',
    ]);
  });

  it('omits Wikipedia when the requested and English articles are missing', () => {
    expect(
      buildExternalIdentifierLinks(
        { 'wikipedia-fr': 'Alexander Pope' },
        { category: 'reference', lang: 'de' },
      ),
    ).toEqual([]);
  });

  it('encodes Wikipedia titles while preserving title subpages', () => {
    const links = buildExternalIdentifierLinks(
      { 'wikipedia-da': 'H.C. Ørsted/Æresbevisninger?' },
      { category: 'reference', lang: 'da' },
    );

    expect(links.map(({ href }) => href)).toEqual([
      'https://da.wikipedia.org/wiki/H.C._%C3%98rsted/%C3%86resbevisninger%3F',
    ]);
  });
});
