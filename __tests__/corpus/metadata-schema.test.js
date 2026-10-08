import fs from 'fs';
import { execFileSync } from 'child_process';
import { DOMParser } from '@xmldom/xmldom';
import { flagMap, poetFlag } from '../../common/flags.js';

const infoXmlFiles = () =>
  execFileSync('git', ['ls-files', 'fdirs/*/info.xml'], { encoding: 'utf8' })
    .split('\n')
    .filter(filename => filename.length > 0);

describe('info.xml RELAX NG schema', () => {
  const people = () => infoXmlFiles().map(filename => {
    const person = new DOMParser().parseFromString(
      fs.readFileSync(filename, 'utf8'), 'text/xml'
    ).documentElement;
    return {
      filename,
      id: person.getAttribute('id'),
      country: person.getAttribute('country'),
      nationality: person.hasAttribute('nationality')
        ? person.getAttribute('nationality') : null,
    };
  });

  it('requires a non-empty nationality for every country="un" entry', () => {
    const missing = people()
      .filter(person => person.country === 'un' &&
        (person.nationality == null || person.nationality.trim().length === 0))
      .map(person => person.filename);

    expect(missing).toEqual([]);
  });

  it('provides a flag emoji for nationality ?? country for every info.xml entry', () => {
    const failures = [];
    people().forEach(person => {
      const countryCode = person.nationality ?? person.country;
      try {
        if (/^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(poetFlag(person)) === false) {
          failures.push(`${person.filename}: ${countryCode} er ikke en flag-emoji`);
        }
      } catch (error) {
        failures.push(`${person.filename}: ${error.message}`);
      }
    });

    expect(failures).toEqual([]);
  });

  it('contains only regional indicator flag emoji in the shared flag map', () => {
    Object.values(flagMap).forEach(flag => {
      expect(flag).toMatch(/^[\u{1F1E6}-\u{1F1FF}]{2}$/u);
    });
  });

  it('does not contain empty works elements', () => {
    const emptyWorksElements = infoXmlFiles().filter(filename => {
      const xml = fs.readFileSync(filename, 'utf8');

      return /<works\s*\/>|<works>\s*<\/works>/.test(xml);
    });

    expect(emptyWorksElements).toEqual([]);
  });

  it('requires literary periods for every poet', () => {
    const missingLiteraryPeriods = infoXmlFiles().filter(filename => {
      const xml = fs.readFileSync(filename, 'utf8');
      const isPoet = /<person\b[^>]*\btype=["']poet["']/.test(xml);
      const literaryPeriods = xml.match(/<literary-periods>([\s\S]*?)<\/literary-periods>/)?.[1]?.trim();

      return isPoet === true && (literaryPeriods == null || literaryPeriods.length === 0);
    });

    expect(missingLiteraryPeriods).toEqual([]);
  });

  it('validates all tracked info.xml files', () => {
    const files = infoXmlFiles();

    expect(files.length).toBeGreaterThan(0);

    try {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/info-xml.rng', ...files],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
      );
    } catch (error) {
      throw new Error(error.stderr || error.message);
    }
  });
});
