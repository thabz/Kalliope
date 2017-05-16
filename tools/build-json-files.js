const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser({
  explicitArray: false
});

const forceArray = (a) => {
  return a instanceof Array ? a : [a];
}

fs.readFile('data/poets.xml', (err, data) => {
  let byCountry = new Map();
  parser.parseString(data, (err, result) => {
    const persons = { result };
    result.persons.person.forEach(p => {
      //console.log(p);
      const { id, country, lang, type } = p.$;
      const { name, period, works } = p;
      let list = byCountry.get(country) || [];
      let worksArray = works ? works.split(",") : [];
      list.push({ id, country, lang, type, name,
         period, works: worksArray });
      byCountry.set(country, list);
    });
  });
  byCountry.forEach( (poets, country) => {
    const sorted = poets.sort((a,b) => {
      return a.id < b.id ? -1 : 1;
    });
    const json = JSON.stringify(sorted, null, 2);
    fs.writeFile(`static/api/poets-${country}.json`, json, (err) => {
      if (err) {
        console.log(err);
      }
    });
  });
});
