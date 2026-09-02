import {
  obsoleteSourceWorkKeys,
  removeTextsFromSourceWorks,
  sourceFilesForText,
  sourceWorkFilename,
  sourceWorkKey,
} from '../tools/build-static/work-cache.js';

describe('værk-cache', () => {
  it('finder en teksts faktiske kildeværk', () => {
    const directText = { poetId: 'digter', workId: 'foerste' };
    const placedText = {
      poetId: 'bidragyder',
      workId: 'virtuelt-vaerk',
      sourcePoetId: 'udgiver',
      sourceWorkId: 'samling',
    };

    expect(sourceWorkKey(directText)).toBe('digter/foerste');
    expect(sourceWorkKey(placedText)).toBe('udgiver/samling');
    expect(sourceWorkFilename(placedText)).toBe(
      'fdirs/udgiver/samling.xml'
    );
    expect(sourceFilesForText(directText)).toEqual([
      'fdirs/digter/info.xml',
      'fdirs/digter/foerste.xml',
    ]);
  });

  it('rydder gamle cacheplaceringer før tekster flyttes mellem værker', () => {
    const texts = new Map([
      [
        'flyttet',
        { id: 'flyttet', poetId: 'digter', workId: 'foerste' },
      ],
      [
        'anden-tekst',
        { id: 'anden-tekst', poetId: 'digter', workId: 'andet' },
      ],
      [
        'uændret',
        { id: 'uændret', poetId: 'anden-digter', workId: 'samling' },
      ],
    ]);

    removeTextsFromSourceWorks(
      texts,
      new Set(['digter/foerste', 'digter/andet'])
    );

    expect(Array.from(texts.keys())).toEqual(['uændret']);
  });

  it('finder cachede kildeværker, som er slettet fra værklisten', () => {
    const works = new Map([
      ['digter/gammelt', { id: 'gammelt' }],
      ['digter/nyt', { id: 'nyt' }],
      [
        'digter/virtuelt',
        { id: 'virtuelt', virtualType: 'anthology' },
      ],
    ]);

    expect(
      obsoleteSourceWorkKeys(works, new Set(['digter/nyt']))
    ).toEqual(new Set(['digter/gammelt']));
  });
});
