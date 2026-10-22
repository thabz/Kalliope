import {
  validateFirstlineMarkup,
  validateIndexTitleMarkup,
} from '../tools/build-static/validation.js';

describe('build-static validation', () => {
  it('explains how to remove markup from a firstline', () => {
    expect(() =>
      validateFirstlineMarkup(
        { title: 'Til unge Herr’ <w>Rosenstok</w>' },
        'antologierdk2026072110',
        'fdirs/antologierdk/1868.xml'
      )
    ).toThrow(
      'Teksten "antologierdk2026072110" i fdirs/antologierdk/1868.xml har markup i <firstline>.\n' +
        'Fjern markup fra F:-linjen i txt2xml-kilden eller fra <firstline> i XML-filen.'
    );
  });

  it('accepts a plain firstline', () => {
    expect(() =>
      validateFirstlineMarkup(
        { title: 'Til unge Herr’ Rosenstok' },
        'antologierdk2026072110',
        'fdirs/antologierdk/1868.xml'
      )
    ).not.toThrow();
  });

  it('accepts abbreviation overlines when indexing the printed title', () => {
    expect(() => validateIndexTitleMarkup(
      'Dan k<o>o</o>ning', 'dan', '1495.xml', { allowOverlines: true },
    )).not.toThrow();
  });

  it.each([
    ['Dan k<o>o</o>ning', false],
    ['Dan k<o><i>o</i></o>ning', true],
  ])('rejects unsupported index markup: %s', (title, allowOverlines) => {
    expect(() => validateIndexTitleMarkup(
      title, 'dan', '1495.xml', { allowOverlines },
    )).toThrow('har markup i titlen');
  });

});
