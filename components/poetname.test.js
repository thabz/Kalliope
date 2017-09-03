import { poetNameString } from './poetname.js';

describe('String method', () => {
  it('outputs correctly when having full name and period', () => {
    const poet: Poet = {
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
    const poet: Poet = {
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
    const poet: Poet = {
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
});
