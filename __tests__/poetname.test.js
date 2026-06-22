import {
  poetGenetiveLastName,
  poetLastNameString,
  poetNameParts,
  poetNameString,
} from '../components/poetname-helpers.js';

describe('String method', () => {
  it('outputs correctly when having full name and period', () => {
    const poet = {
      name: {
        firstname: 'Emil',
        lastname: 'Aarestrup',
      },
      period: {
        born: {
          date: '1800-12-04',
        },
        dead: {
          date: '1856-07-21',
        },
      },
    };
    expect(poetNameString(poet, false, false)).toEqual('Emil Aarestrup');
    expect(poetNameString(poet, true, false)).toEqual('Aarestrup, Emil');
    expect(poetNameString(poet, false, true)).toEqual(
      'Emil Aarestrup (1800–56)'
    );
    expect(poetNameString(poet, true, true)).toEqual(
      'Aarestrup, Emil (1800–56)'
    );
  });
  it('outputs correctly when having full name and unknown birthday', () => {
    const poet = {
      name: {
        firstname: 'Emil',
        lastname: 'Aarestrup',
      },
      period: {
        born: {
          date: '?',
        },
        dead: {
          date: '1856-07-21',
        },
      },
    };
    expect(poetNameString(poet, false, true)).toEqual(
      'Emil Aarestrup (Ukendt år–1856)'
    );
  });
  it('outputs correctly when having full name and unknown lifespan', () => {
    const poet = {
      name: {
        firstname: 'Emil',
        lastname: 'Aarestrup',
      },
      period: {
        born: {
          date: '?',
        },
        dead: {
          date: '?',
        },
      },
    };
    expect(poetNameString(poet, false, true)).toEqual(
      'Emil Aarestrup (Ukendt levetid)'
    );
  });

  it('handles missing name parts', () => {
    expect(
      poetNameString({
        name: {
          firstname: 'Emil',
        },
      })
    ).toEqual('Emil');
    expect(
      poetNameString({
        name: {
          lastname: 'Aarestrup',
        },
      })
    ).toEqual('Aarestrup');
    expect(
      poetNameString({
        name: {},
      })
    ).toEqual('');
  });

  it('returns name parts and last names consistently', () => {
    const poet = {
      name: {
        firstname: 'Emil',
        lastname: 'Aarestrup',
      },
      period: {
        born: {
          date: '1800-12-04',
        },
        dead: {
          date: '1856-07-21',
        },
      },
    };

    expect(poetNameParts(poet, false, true)).toEqual([
      'Emil Aarestrup',
      '(1800–56)',
    ]);
    expect(poetLastNameString(poet)).toEqual('Aarestrup');
    expect(poetLastNameString({ name: { firstname: 'Emil' } })).toEqual('Emil');
    expect(poetLastNameString({ name: {} })).toEqual('Ukendt');
  });

  it('formats genitive last names in Danish and English', () => {
    expect(poetGenetiveLastName({ name: { lastname: 'Petersen' } }, 'da')).toBe(
      'Petersens'
    );
    expect(poetGenetiveLastName({ name: { lastname: 'Sax' } }, 'da')).toBe(
      'Sax’'
    );
    expect(poetGenetiveLastName({ name: { lastname: 'Petersen' } }, 'en')).toBe(
      'Petersen’s'
    );
    expect(poetGenetiveLastName({ name: { lastname: 'S' } }, 'en')).toBe(
      'S’s'
    );
    expect(() => poetGenetiveLastName({ name: {} }, 'fr')).toThrow(
      'Ukendt sprog: fr'
    );
  });
});
