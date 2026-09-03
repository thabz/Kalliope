import { selectWorkContent } from '../pages/work.js';

describe('værksidens indholdsvalg', () => {
  it('vælger indholdsfortegnelsen og bygger dens beskrivelse', () => {
    const toc = [{ title: 'Første del' }, { title: 'Anden del' }];

    expect(selectWorkContent(toc, [])).toEqual({
      type: 'toc',
      items: toc,
      ogDescription: 'Første del, Anden del',
    });
  });

  it('vælger underværker og bruger deres titel i beskrivelsen', () => {
    const subworks = [
      { toctitle: { title: 'Første samling' } },
      { toctitle: { title: 'Anden samling' } },
    ];

    expect(selectWorkContent([], subworks)).toEqual({
      type: 'subworks',
      items: subworks,
      ogDescription: 'Første samling, Anden samling',
    });
  });

  it.each([
    [null, undefined],
    [[], []],
  ])('vælger den tomme tilstand uden data', (toc, subworks) => {
    expect(selectWorkContent(toc, subworks)).toEqual({
      type: 'empty',
      items: [],
      ogDescription: null,
    });
  });

  it('prioriterer indholdsfortegnelsen, når begge lister har data', () => {
    const toc = [{ title: 'Indholdsfortegnelse' }];
    const subworks = [{ toctitle: { title: 'Underværk' } }];

    expect(selectWorkContent(toc, subworks)).toEqual({
      type: 'toc',
      items: toc,
      ogDescription: 'Indholdsfortegnelse',
    });
  });
});
