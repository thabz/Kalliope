import * as Sorting from '../common/sorting.js';

//const Sorting = require('./sorting.js');

describe('locale lookup', () => {
  it('returns known locales and falls back to Danish', () => {
    expect(Sorting.localeForLang('fr')).toBe('fr-FR');
    expect(Sorting.localeForLang('unknown')).toBe('da-DK');
    expect(Sorting.localeForCountry('us')).toBe('en-US');
    expect(Sorting.localeForCountry('unknown')).toBe('da-DK');
  });
});

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

describe('poetsByLastname', () => {
  it('uses sortname before lastname and firstname', () => {
    const data = [
      { name: { firstname: 'Jens', lastname: 'Baggesen' } },
      {
        name: {
          firstname: 'Adam',
          lastname: 'Oehlenschläger',
          sortname: 'Adam Oehlenschläger',
        },
      },
      { name: { firstname: 'Johan Ludvig', lastname: 'Heiberg' } },
    ];
    const sorted = data.sort(Sorting.poetsByLastname).map((x) => {
      return x.name.lastname;
    });
    expect(sorted).toEqual(['Oehlenschläger', 'Baggesen', 'Heiberg']);
  });

  it('falls back to firstname when lastname is missing', () => {
    const data = [
      { name: { firstname: 'Zacharias' } },
      { name: { firstname: 'Ambrosius' } },
    ];
    const sorted = data.sort(Sorting.poetsByLastname).map((x) => {
      return x.name.firstname;
    });
    expect(sorted).toEqual(['Ambrosius', 'Zacharias']);
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

describe('poetsByBirthDate', () => {
  it('sorts poets by birth date', () => {
    const data = [
      {
        name: { lastname: 'Middle' },
        period: { born: { date: '1850-01-01' } },
      },
      {
        name: { lastname: 'Late' },
        period: { born: { date: '1900-01-01' } },
      },
      {
        name: { lastname: 'Early' },
        period: { born: { date: '1800-01-01' } },
      },
      {
        name: { lastname: 'Later' },
        period: { born: { date: '1920-01-01' } },
      },
    ];
    const sorted = data.sort(Sorting.poetsByBirthDate).map((x) => {
      return x.name.lastname;
    });
    expect(sorted).toEqual(['Early', 'Middle', 'Late', 'Later']);
  });

  it('sorts equal birth dates by lastname', () => {
    const data = [
      {
        name: { lastname: 'Ørsted' },
        period: { born: { date: '1782-10-11' } },
      },
      {
        name: { lastname: 'Blicher' },
        period: { born: { date: '1782-10-11' } },
      },
      {
        name: { lastname: 'Aarestrup' },
        period: { born: { date: '1782-10-11' } },
      },
    ];
    const sorted = data.sort(Sorting.poetsByBirthDate).map((x) => {
      return x.name.lastname;
    });
    expect(sorted).toEqual(['Blicher', 'Ørsted', 'Aarestrup']);
  });

  it('falls back to lastname when period data is missing', () => {
    const data = [
      { name: { lastname: 'Ørsted' } },
      { name: { lastname: 'Blicher' } },
      { name: { lastname: 'Aarestrup' } },
      { name: { lastname: 'Andersen' } },
    ];
    const sorted = data.sort(Sorting.poetsByBirthDate).map((x) => {
      return x.name.lastname;
    });
    expect(sorted).toEqual(['Andersen', 'Blicher', 'Ørsted', 'Aarestrup']);
  });

  it('uses country collation when birth dates are equal', () => {
    const data = ['Müller', 'Meyer', 'Mörike', 'Mozart'].map((lastname) => {
      return {
        name: { lastname },
        period: { born: { date: '1800-01-01' } },
      };
    });
    const sorted = data
      .sort(Sorting.poetsByBirthDateForCountry('de'))
      .map((x) => x.name.lastname);
    expect(sorted).toEqual(['Meyer', 'Mörike', 'Mozart', 'Müller']);
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

describe('linesPairsByLine', () => {
  it('sorts lines by Danish collation', () => {
    const data = ['Ø', 'A', 'Æ', 'B', 'Aa'].map((x) => {
      return { sortBy: x };
    });
    const sorted = data.sort(Sorting.linesPairsByLine).map((x) => x.sortBy);
    expect(sorted).toEqual(['A', 'B', 'Æ', 'Ø', 'Aa']);
  });
});

describe('lineSectionTitleForLang', () => {
  it('groups Danish Aa as Å', () => {
    expect(Sorting.lineSectionTitleForLang('Aarets tider', 'da')).toEqual('Å');
  });

  it('groups Danish Ö as Ø', () => {
    expect(Sorting.lineSectionTitleForLang('Örnens flugt', 'da')).toEqual('Ø');
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

describe('title sorters', () => {
  it('sorts keywords by Danish title collation', () => {
    const data = ['Ømhed', 'Almue', 'Ånd'].map((title) => {
      return { title };
    });
    const sorted = data.sort(Sorting.keywordsByTitle).map((x) => x.title);
    expect(sorted).toEqual(['Almue', 'Ømhed', 'Ånd']);
  });

  it('sorts dict items by Danish title collation', () => {
    const data = ['Ørn', 'Aand', 'Æble'].map((title) => {
      return { title };
    });
    const sorted = data.sort(Sorting.dictItemsByTitle).map((x) => x.title);
    expect(sorted).toEqual(['Æble', 'Ørn', 'Aand']);
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

  it('sorts numeric BCE-style negative intervals before CE intervals', () => {
    const data = ['1 - 24', '-50 - -26', '-25 - -1'].map((x) => {
      return { title: x };
    });
    const sorted = data
      .sort(Sorting.poetYearSectionsByTitle)
      .map((x) => x.title);
    expect(sorted).toEqual(['-50 - -26', '-25 - -1', '1 - 24']);
  });
});
