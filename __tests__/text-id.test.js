import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  copenhagenDateStamp,
  isValidDateStamp,
  nextTextId,
  normalizeDateStamp,
  parseWorkTextIds,
  textIdError,
} from '../tools/libs/text-id.js';
import { generateTextId } from '../tools/new-text-id.js';
import { newTextIdErrors } from '../tools/validate-new-text-ids.js';

describe('text ids', () => {
  it('uses the Copenhagen calendar date', () => {
    expect(copenhagenDateStamp(new Date('2026-08-14T22:30:00Z'))).toBe('20260815');
  });

  it('normalizes and validates calendar dates', () => {
    expect(normalizeDateStamp('2026-08-15')).toBe('20260815');
    expect(isValidDateStamp('20240229')).toBe(true);
    expect(isValidDateStamp('20230229')).toBe(false);
    expect(() => normalizeDateStamp('2026-02-30')).toThrow('Ugyldig dato');
  });

  it('validates the effective poet prefix, date, and sequence', () => {
    expect(textIdError({ id: 'oersted2026081501', poetId: 'oersted' })).toBeNull();
    expect(textIdError({ id: 'oersted2026023001', poetId: 'oersted' }))
      .toContain('ugyldige dato');
    expect(textIdError({ id: 'oersted2026081500', poetId: 'oersted' }))
      .toContain('positivt løbenummer');
    expect(textIdError({ id: 'anden2026081501', poetId: 'oersted' }))
      .toContain('oersted');
  });

  it('does not reuse a gap in the daily sequence', () => {
    expect(nextTextId({
      poetId: 'oersted',
      dateStamp: '20260815',
      existingIds: ['oersted2026081501', 'oersted2026081503'],
    })).toBe('oersted2026081504');
  });

  it('uses text author before work author', () => {
    const parsed = parseWorkTextIds(`
      <kalliopework author="antologierdk">
        <workbody>
          <text id="antologierdk2026081501"/>
          <text id="aarestrup2026081501" author="aarestrup"/>
        </workbody>
      </kalliopework>
    `, 'fdirs/antologierdk/test.xml');

    expect(parsed.texts).toEqual([
      {
        filename: 'fdirs/antologierdk/test.xml',
        id: 'antologierdk2026081501',
        poetId: 'antologierdk',
      },
      {
        filename: 'fdirs/antologierdk/test.xml',
        id: 'aarestrup2026081501',
        poetId: 'aarestrup',
      },
    ]);
  });

  it('rejects the section ids used in roerdam/1904a', () => {
    const parsed = parseWorkTextIds(`
      <kalliopework author="roerdam">
        <workbody>
          <section id="doedens-skygger"><content/></section>
          <section id="blandede-digte"><content/></section>
        </workbody>
      </kalliopework>
    `, 'fdirs/roerdam/1904a.xml');

    expect(newTextIdErrors([], parsed.texts)).toEqual([
      expect.stringContaining('doedens-skygger skal begynde med det effektive digter-id roerdam'),
      expect.stringContaining('blandede-digte skal begynde med det effektive digter-id roerdam'),
    ]);
  });

  it('inherits section authors and allows a nested author override', () => {
    const parsed = parseWorkTextIds(`
      <kalliopework author="antologierdk">
        <workbody>
          <section id="antologierdk2026081501">
            <content>
              <section id="aarestrup2026081501" author="aarestrup">
                <content>
                  <section><content><text id="aarestrup2026081502"/></content></section>
                  <section id="winther2026081501" author="winther"><content/></section>
                  <text id="oersted2026081501" author="oersted"/>
                </content>
              </section>
            </content>
          </section>
        </workbody>
      </kalliopework>
    `);

    expect(parsed.texts.map(({ id, poetId }) => ({ id, poetId }))).toEqual([
      { id: 'antologierdk2026081501', poetId: 'antologierdk' },
      { id: 'aarestrup2026081501', poetId: 'aarestrup' },
      { id: 'aarestrup2026081502', poetId: 'aarestrup' },
      { id: 'winther2026081501', poetId: 'winther' },
      { id: 'oersted2026081501', poetId: 'oersted' },
    ]);
    expect(newTextIdErrors([], parsed.texts)).toEqual([]);
  });

  it.each([
    ['anden2026081501', 'skal begynde'],
    ['roerdam1904a1', 'YYYYMMDD'],
    ['roerdam2026023001', 'ugyldige dato'],
    ['roerdam2026081500', 'positivt løbenummer'],
  ])('applies the text id rule to section id %s', (id, message) => {
    const parsed = parseWorkTextIds(`
      <kalliopework author="roerdam"><workbody><section id="${id}"/></workbody></kalliopework>
    `);

    expect(newTextIdErrors([], parsed.texts)).toEqual([
      expect.stringContaining(message),
    ]);
  });

  it('checks sections and texts in the same id namespace', () => {
    const parsed = parseWorkTextIds(`
      <kalliopework author="roerdam">
        <workbody>
          <section id="roerdam2026081501"><content><text id="roerdam2026081501"/></content></section>
        </workbody>
      </kalliopework>
    `);

    expect(newTextIdErrors([], parsed.texts)).toEqual([
      expect.stringContaining('forekommer flere gange'),
    ]);
  });

  it('preserves existing section ids when validating a revision', () => {
    const parsed = parseWorkTextIds(`
      <kalliopework author="roerdam"><workbody><section id="gammelt-id"/></workbody></kalliopework>
    `);

    expect(parsed.texts).toHaveLength(1);
    expect(newTextIdErrors(parsed.texts, parsed.texts)).toEqual([]);
  });

  it('generates an anthology id from the work author', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-text-id-'));
    const corpusDirectory = path.join(directory, 'fdirs');
    const anthologyDirectory = path.join(corpusDirectory, 'antologierdk');
    try {
      fs.mkdirSync(anthologyDirectory, { recursive: true });
      const filename = path.join(anthologyDirectory, 'test.xml');
      fs.writeFileSync(filename, `
        <kalliopework author="antologierdk">
          <workbody>
            <text id="antologierdk2026081501"/>
            <section id="antologierdk2026081503"/>
          </workbody>
        </kalliopework>
      `);

      expect(generateTextId({
        corpusDirectory,
        dateStamp: '20260815',
        filename,
      })).toBe('antologierdk2026081504');
      expect(generateTextId({
        author: 'aarestrup',
        corpusDirectory,
        dateStamp: '20260815',
        filename,
      })).toBe('aarestrup2026081501');
    } finally {
      fs.rmSync(directory, { recursive: true });
    }
  });

  it('validates only ids absent from the base revision', () => {
    const baseTexts = [
      { filename: 'fdirs/oersted/1836.xml', id: 'oersted1836a5', poetId: 'oersted' },
    ];
    const validHeadTexts = [
      ...baseTexts,
      { filename: 'fdirs/oersted/1836.xml', id: 'oersted2026081501', poetId: 'oersted' },
    ];
    const invalidHeadTexts = [
      ...baseTexts,
      { filename: 'fdirs/oersted/1836.xml', id: 'oersted1836a6', poetId: 'oersted' },
    ];

    expect(newTextIdErrors(baseTexts, validHeadTexts)).toEqual([]);
    expect(newTextIdErrors(baseTexts, invalidHeadTexts)[0]).toContain('oersted1836a6');
  });

  it('rejects duplicate ids in the head revision', () => {
    const duplicate = {
      filename: 'fdirs/oersted/andre.xml',
      id: 'oersted2026081501',
      poetId: 'oersted',
    };
    expect(newTextIdErrors([], [
      duplicate,
      { ...duplicate, filename: 'fdirs/oersted/1836.xml' },
    ])[0]).toContain('forekommer flere gange');
  });

  it('rejects reuse of a gap below the previous maximum sequence', () => {
    const baseTexts = [
      { filename: 'one.xml', id: 'oersted2026081501', poetId: 'oersted' },
      { filename: 'three.xml', id: 'oersted2026081503', poetId: 'oersted' },
    ];
    const headTexts = [
      ...baseTexts,
      { filename: 'two.xml', id: 'oersted2026081502', poetId: 'oersted' },
    ];

    expect(newTextIdErrors(baseTexts, headTexts)[0]).toContain('genbruger et løbenummer');
  });

  it('allows an unchanged legacy duplicate', () => {
    const duplicates = [
      {
        filename: 'fdirs/kaalund/1845.xml',
        id: 'kaalund2003010401',
        poetId: 'kaalund',
      },
      {
        filename: 'fdirs/kaalund/1898.xml',
        id: 'kaalund2003010401',
        poetId: 'kaalund',
      },
    ];

    expect(newTextIdErrors(duplicates, duplicates)).toEqual([]);
  });
});
