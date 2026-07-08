import {
  poetName,
  workLinkName,
  workName,
} from '../tools/build-static/formatting.js';

describe('build-static formatting helpers', () => {
  it('formats poet names for static output', () => {
    expect(poetName({ name: { firstname: 'Emil', lastname: 'Aarestrup' } })).toBe(
      'Emil Aarestrup'
    );
    expect(poetName({ name: { lastname: 'Aarestrup' } })).toBe('Aarestrup');
    expect(poetName({ name: { firstname: 'Emil' } })).toBe('Emil');
  });

  it('maps static work title fields to the shared year formatter', () => {
    expect(workName({ title: 'Digte', year: '1818' })).toBe('Digte (1818)');
    expect(workLinkName({ linktitle: 'Digte til venner', year: '1818' })).toBe(
      'Digte til venner (1818)'
    );
  });
});
