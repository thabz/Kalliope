const fs = require('fs');
const xml2js = require('xml2js');

describe('Ingen digtere har samme id', () => {
  const data = fs.readFileSync('data/poets.xml');
  const parser = new xml2js.Parser({ explicitArray: false });
  let counts = new Map();
  parser.parseString(data, (err, result) => {
    const persons = { result };
    result.persons.person.forEach(p => {
      const { id, country, lang, type } = p.$;
      let count = counts.get(id) || 0;
      count++;
      counts.set(id, count);
    });
  });
  counts.forEach((count, id) => {
    it(`Kun en digter har id "${id}"`, () => {
      expect(count).toBe(1);
    });
  });
});
