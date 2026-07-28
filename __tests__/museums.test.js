import { museumsByCountry } from '../pages/museums.js';

describe('museum groups', () => {
  it('sorts countries and museums predictably', () => {
    const museums = [
      { id: 'b', sortName: 'Beta', country: 'dk' },
      { id: 'a', sortName: 'Alpha', country: 'dk' },
      { id: 'c', sortName: 'Gamma', country: 'de' },
    ];

    expect(museumsByCountry(museums, 'da')).toEqual([
      {
        title: 'Danmark',
        items: [
          { id: 'a', sortName: 'Alpha', country: 'dk' },
          { id: 'b', sortName: 'Beta', country: 'dk' },
        ],
      },
      {
        title: 'Tyskland',
        items: [{ id: 'c', sortName: 'Gamma', country: 'de' }],
      },
    ]);
  });

  it('places missing metadata in an explicit group', () => {
    const museums = [{ id: 'x', sortName: 'Ukendt museum', country: null }];
    expect(museumsByCountry(museums, 'en')[0].title).toBe('Unknown country');
  });
});
