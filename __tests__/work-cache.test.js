import fs from 'fs';
import os from 'os';
import path from 'path';
import * as Paths from '../common/paths.js';
import {
  obsoleteSourceWorkKeys,
  removeObsoleteTextFiles,
  removeTextsFromSourceWorks,
  sourceFilesForText,
  sourceWorkFilename,
  sourceWorkKey,
} from '../tools/build-static/work-cache.js';

describe('værk-cache', () => {
  it('fjerner cachede publikationsdubletter uden at slette rigtige a-id’er', () => {
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-migration-'));
    const previousDirectory = process.cwd();
    try {
      process.chdir(temporary);
      const previous = new Map(['one', 'onea', 'historicala'].map(id => [id, { id }]));
      previous.forEach((text, id) => {
        fs.mkdirSync(Paths.textFolder(id), { recursive: true });
        fs.writeFileSync(Paths.textPath(id), '{}');
      });
      removeObsoleteTextFiles(previous, new Map([
        ['one', { id: 'one' }], ['historicala', { id: 'historicala' }],
      ]));
      expect(fs.existsSync(Paths.textPath('onea'))).toBe(false);
      expect(fs.existsSync(Paths.textPath('one'))).toBe(true);
      expect(fs.existsSync(Paths.textPath('historicala'))).toBe(true);
    } finally {
      process.chdir(previousDirectory);
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  });

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
