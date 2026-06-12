const {
  poetName,
  workLinkName,
  workName,
} = require('../tools/build-static/formatting.js');

describe('build-static formatting helpers', () => {
  it('formats poet names', () => {
    expect(poetName({ name: { firstname: 'Emil', lastname: 'Aarestrup' } })).toBe(
      'Emil Aarestrup'
    );
    expect(poetName({ name: { lastname: 'Aarestrup' } })).toBe('Aarestrup');
    expect(poetName({ name: { firstname: 'Emil' } })).toBe('Emil');
  });

  it('formats work names', () => {
    expect(workName({ title: 'Digte', year: '1818' })).toBe('Digte (1818)');
    expect(workName({ title: 'Digte', year: '?' })).toBe('Digte');
    expect(workName({ title: 'Digte' })).toBe('Digte');
  });

  it('formats work link names', () => {
    expect(
      workLinkName({ linktitle: 'Digte til venner', year: '1818' })
    ).toBe('Digte til venner (1818)');
    expect(workLinkName({ linktitle: 'Digte til venner', year: '?' })).toBe(
      'Digte til venner'
    );
  });
});
