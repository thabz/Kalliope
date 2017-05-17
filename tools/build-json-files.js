const fs = require('fs');
const xml2js = require('xml2js');

const forceArray = a => {
  return a instanceof Array ? a : [a];
};

const build_poets_json = () => {
  const data = fs.readFileSync('data/poets.xml');
  const parser = new xml2js.Parser({ explicitArray: false });
  let byCountry = new Map();
  let collected_poets = new Map();
  parser.parseString(data, (err, result) => {
    const persons = { result };
    result.persons.person.forEach(p => {
      //console.log(p);
      const { id, country, lang, type } = p.$;
      const { name, period, works } = p;
      let list = byCountry.get(country) || [];
      let worksArray = works ? works.split(',') : [];
      const poet = {
        id,
        country,
        lang,
        type,
        name: name,
        period,
        workIds: worksArray,
      };
      list.push(poet);
      byCountry.set(country, list);
      collected_poets.set(id, poet);
    });
    return collected_poets;
  });
  byCountry.forEach((poets, country) => {
    const sorted = poets.sort((a, b) => {
      return a.id < b.id ? -1 : 1;
    });
    const json = JSON.stringify(sorted, null, 2);
    fs.writeFile(`static/api/poets-${country}.json`, json, err => {
      if (err) {
        console.log(err);
      }
    });
  });
  return collected_poets;
};

const build_poet_works_json = collected_poets => {
  collected_poets.forEach((poet, poetId) => {
    let collected = [];
    poet.workIds.forEach(workId => {
      const data = fs.readFileSync(`fdirs/${poetId}/${workId}.xml`);
      const parser = new xml2js.Parser({
        explicitArray: false,
        normalize: true,
      });
      parser.parseString(data, (err, result) => {
        if (!result) {
          console.log(`Error parsing ${poetId}/${workId}: ${err}`);
          return;
        }
        const work = result.kalliopework;
        const { status, type } = work.$;
        const head = work.workhead;
        const { title, year } = head;
        const data = { id: workId, title, year, status, type };
        collected.push(data);
      });
    });
    const objectToWrite = {
      poet: poet,
      works: collected,
    };
    const json = JSON.stringify(objectToWrite, null, 2);
    try {
      fs.mkdirSync(`static/api/${poetId}`);
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
    fs.writeFile(`static/api/${poetId}/works.json`, json, err => {
      if (err) {
        console.log(err);
      }
    });
  });
};

const collected_poets = build_poets_json();
build_poet_works_json(collected_poets);
