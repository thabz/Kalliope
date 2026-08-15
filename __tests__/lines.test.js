import { selectPoetLines } from '../tools/build-static/lines.js';

describe('poet line indexes', () => {
  const collected = {
    variants: new Map([
      ['primary', ['forced-title', 'forced-firstline', 'hidden']],
      ['forced-title', ['primary']],
      ['forced-firstline', ['primary']],
      ['hidden', ['primary']],
    ]),
    texts: new Map([
      ['primary', { poetId: 'poet', workId: '1800' }],
      ['forced-title', { poetId: 'poet', workId: '1810' }],
      ['forced-firstline', { poetId: 'poet', workId: '1820' }],
      ['hidden', { poetId: 'poet', workId: '1830' }],
    ]),
    works: new Map([
      ['poet/1800', { year: '1800' }],
      ['poet/1810', { year: '1810' }],
      ['poet/1820', { year: '1820' }],
      ['poet/1830', { year: '1830' }],
    ]),
  };
  const texts = [
    { id: 'primary', workId: '1800', indexTitle: 'A', firstline: 'A line' },
    {
      id: 'forced-title',
      workId: '1810',
      indexTitle: 'B',
      firstline: 'B line',
      forceTitleIndex: true,
    },
    {
      id: 'forced-firstline',
      workId: '1820',
      indexTitle: 'C',
      firstline: 'C line',
      forceFirstlineIndex: true,
    },
    { id: 'hidden', workId: '1830', indexTitle: 'D', firstline: 'D line' },
  ];

  it('includes forced variants only in their requested indexes', () => {
    expect(selectPoetLines(texts, { lang: 'da' }, collected)).toEqual([
      expect.objectContaining({
        id: 'primary',
        index_title: true,
        index_firstline: true,
      }),
      expect.objectContaining({
        id: 'forced-title',
        index_title: true,
        index_firstline: false,
      }),
      expect.objectContaining({
        id: 'forced-firstline',
        index_title: false,
        index_firstline: true,
      }),
    ]);
  });
});
