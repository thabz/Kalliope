import fs from 'node:fs';

const priorities = JSON.parse(
  fs.readFileSync('content/today/portrait-priorities.json', 'utf8')
);

describe('prioriterede portrætter på forsiden', () => {
  test.each([
    ['04-09', 'baudelaire'],
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
