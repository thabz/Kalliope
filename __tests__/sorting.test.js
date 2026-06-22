import * as Sorting from '../common/sorting.js';

//const Sorting = require('./sorting.js');

describe('sectionsByTitle', () => {
  it('sorts ÆØÅ correctly', () => {
    const data = ['Ø', 'A', 'Æ', 'B', 'Å', 'C'].map(x => {
      return { title: x };
    });
    const sorted = data.sort(Sorting.sectionsByTitle).map(x => x.title);
    expect(sorted).toEqual(['A', 'B', 'C', 'Æ', 'Ø', 'Å']);
  });
  it('sorts ÆØAa correctly', () => {
    const data = ['Ø', 'A', 'Æ', 'B', 'Aa', 'C'].map(x => {
      return { title: x };
    });
    const sorted = data.sort(Sorting.sectionsByTitle).map(x => x.title);
    expect(sorted).toEqual(['A', 'B', 'C', 'Æ', 'Ø', 'Aa']);
  });

  it('puts unknown sections at the end', () => {
    const data = ['Ukendt titel', 'B', 'A', 'Unknown section', 'C'].map(
      (x) => {
        return { title: x };
      }
    );
    const sorted = data.sort(Sorting.sectionsByTitle).map((x) => x.title);
    expect(sorted).toEqual(['A', 'B', 'C', 'Ukendt titel', 'Unknown section']);
  });
});

describe('poetsByLastnameForCountry', () => {
  it('sorts German poet names by German collation', () => {
    const data = ['Müller', 'Mörike', 'Mozart', 'Meyer'].map((lastname) => {
      return { name: { lastname } };
    });
    const sorted = data
      .sort(Sorting.poetsByLastnameForCountry('de'))
      .map((x) => x.name.lastname);
    expect(sorted).toEqual(['Meyer', 'Mörike', 'Mozart', 'Müller']);
  });

  it('sorts ungrouped poet names by Danish collation', () => {
    const data = ['Øster', 'Andersen', 'Aagesen', 'Blicher'].map(
      (lastname) => {
        return { name: { lastname } };
      }
    );
    const sorted = data
      .sort(Sorting.poetsByLastnameForCountry('un'))
      .map((x) => x.name.lastname);
    expect(sorted).toEqual(['Andersen', 'Blicher', 'Øster', 'Aagesen']);
  });
});

describe('linesPairsByLineForLang', () => {
  it('sorts Aa as Å in Danish line sorting', () => {
    const data = ['Ø', 'A', 'Æ', 'B', 'Aa', 'C'].map((x) => {
      return { sortBy: x };
    });
    const sorted = data
      .sort(Sorting.linesPairsByLineForLang('da'))
      .map((x) => x.sortBy);
    expect(sorted).toEqual(['A', 'B', 'C', 'Æ', 'Ø', 'Aa']);
  });

  it('sorts Tennysons Waäit by English line sorting', () => {
    const data = [
      'Wab',
      'Waäit till our Sally cooms in, fur thou mun a’ sights to tell',
      'Waz',
    ].map((x) => {
      return { sortBy: x };
    });
    const sorted = data
      .sort(Sorting.linesPairsByLineForLang('en'))
      .map((x) => x.sortBy);
    expect(sorted).toEqual([
      'Waäit till our Sally cooms in, fur thou mun a’ sights to tell',
      'Wab',
      'Waz',
    ]);
  });

  it('ignores punctuation when sorting French elisions', () => {
    const data = [
      "L'Ennemi",
      'La Beauté',
      'Le Balcon',
      'Les Bijoux',
    ].map((x) => {
      return { sortBy: x };
    });
    const sorted = data
      .sort(Sorting.linesPairsByLineForLang('fr'))
      .map((x) => x.sortBy);
    expect(sorted).toEqual([
      'La Beauté',
      'Le Balcon',
      "L'Ennemi",
      'Les Bijoux',
    ]);
  });

  it('sorts French accented letters as their base letters', () => {
    const data = ['Effet', 'École', 'Ecologie', 'Économie'].map((x) => {
      return { sortBy: x };
    });
    const sorted = data
      .sort(Sorting.linesPairsByLineForLang('fr'))
      .map((x) => x.sortBy);
    expect(sorted).toEqual(['École', 'Ecologie', 'Économie', 'Effet']);
  });

  it('sorts French œ as oe', () => {
    const data = ['coffre', 'cœur', 'coexistence'].map((x) => {
      return { sortBy: x };
    });
    const sorted = data
      .sort(Sorting.linesPairsByLineForLang('fr'))
      .map((x) => x.sortBy);
    expect(sorted).toEqual(['cœur', 'coexistence', 'coffre']);
  });

  it('sorts Swedish Å, Ä, and Ö after Z', () => {
    const data = ['Ö', 'Y', 'Ä', 'X', 'Å', 'Z'].map((x) => {
      return { sortBy: x };
    });
    const sorted = data
      .sort(Sorting.linesPairsByLineForLang('sv'))
      .map((x) => x.sortBy);
    expect(sorted).toEqual(['X', 'Y', 'Z', 'Å', 'Ä', 'Ö']);
  });

  it('sorts German ß as ss', () => {
    const data = ['Mast', 'Maße', 'Massel', 'Masse'].map((x) => {
      return { sortBy: x };
    });
    const sorted = data
      .sort(Sorting.linesPairsByLineForLang('de'))
      .map((x) => x.sortBy);
    expect(sorted).toEqual(['Masse', 'Maße', 'Massel', 'Mast']);
  });
});

describe('lineSectionTitleForLang', () => {
  it('groups Danish Aa as Å', () => {
    expect(Sorting.lineSectionTitleForLang('Aarets tider', 'da')).toEqual('Å');
  });

  it('groups German umlauts by their base letters', () => {
    expect(Sorting.lineSectionTitleForLang('Äolsharfen', 'de')).toEqual('A');
    expect(Sorting.lineSectionTitleForLang('Öffnet die Fenster', 'de')).toEqual(
      'O'
    );
    expect(Sorting.lineSectionTitleForLang('Über allen Gipfeln', 'de')).toEqual(
      'U'
    );
  });

  it('groups accented letters by their base letters outside Danish', () => {
    expect(Sorting.lineSectionTitleForLang('Ève', 'fr')).toEqual('E');
  });
});

describe('poetYearSectionsByTitle', () => {
  it('puts 25-49 first among CE sections and unknown sections last', () => {
    const data = [
      '50 - 74',
      'Ukendt fødeår',
      '1 - 24',
      '100 - 124',
      '25 - 49',
      '25 f.Kr. - 1 f.Kr.',
    ].map((x) => {
      return { title: x };
    });
    const sorted = data
      .sort(Sorting.poetYearSectionsByTitle)
      .map((x) => x.title);
    expect(sorted).toEqual([
      '25 f.Kr. - 1 f.Kr.',
      '25 - 49',
      '1 - 24',
      '50 - 74',
      '100 - 124',
      'Ukendt fødeår',
    ]);
  });
});
