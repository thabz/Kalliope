import * as Sorting from './sorting.js';

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
});
