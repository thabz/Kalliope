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
