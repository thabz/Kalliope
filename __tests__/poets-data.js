const libxml = require('libxmljs');
const { loadXMLDoc } = require('../tools/libs/helpers.js');

describe('Check poets.xml', () => {
  let doc = loadXMLDoc('data/poets.xml');
  let counts = new Map();
  const persons = doc.find('//person');
  persons.forEach(p => {
    const id = p.attr('id').value();
    let count = counts.get(id) || 0;
    count++;
    counts.set(id, count);
  });
  it(`Alle digtere har forskellige id`, () => {
    counts.forEach((count, id) => {
      expect(`Antal digtere med id '${id}' er ${count}`).toBe(
        `Antal digtere med id '${id}' er 1`
      );
    });
  });
});
