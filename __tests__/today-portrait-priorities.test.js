import fs from 'node:fs';
import { supportedLanguages } from '../common/languages.js';

const priorities = JSON.parse(
  fs.readFileSync('content/today/portrait-priorities.json', 'utf8')
);

describe('prioriterede portrætter på forsiden', () => {
  test.each(supportedLanguages)(
    'Robert Burns prioriteres på sin fødselsdag (%s)',
    lang => {
      const preferredPoet =
        priorities[lang]?.['01-25'] ?? priorities.all['01-25'];

      expect(preferredPoet).toBe('burns');
    }
  );

  test('Robert Burns har fødselsdato og portrætdata til prioriteringen', () => {
    const info = fs.readFileSync('fdirs/burns/info.xml', 'utf8');

    expect(info).toContain('-01-25</date>');
    expect(fs.existsSync('fdirs/burns/portraits.xml')).toBe(true);
  });

  test.each(supportedLanguages)(
    'Baudelaire prioriteres på fransk, tysk, engelsk og dansk (%s)',
    lang => {
      const preferredPoet =
        priorities[lang]?.['04-09'] ?? priorities.all['04-09'];

      expect(preferredPoet).toBe('baudelaire');
    }
  );

  test.each([
    ['09-08', 'grundtvig'],
    ['11-14', 'oehlenschlaeger'],
    ['12-03', 'holberg'],
  ])('%s viser %s', (date, poetId) => {
    const info = fs.readFileSync(`fdirs/${poetId}/info.xml`, 'utf8');

    expect(priorities.da[date]).toBe(poetId);
    expect(info).toContain(`-${date}</date>`);
    expect(fs.existsSync(`fdirs/${poetId}/portraits.xml`)).toBe(true);
  });
});
