const fs = require('fs');
const xml2js = require('xml2js');

let collected_poets = null;

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

const build_lines_json = work => {
  const { type, author, id } = work.$;
  let lines = [];

  const handle_section = section => {
    //console.log('Handling section', section);
    let poems = null;
    if (section.poem) {
      poems = forceArray(section.poem);
    } else if (section.section) {
      forceArray(section.section).forEach(s => {
        handle_section(s.content);
      });
      return;
    } else {
      return;
    }
    poems.forEach(item => {
      if (item.$ == null) {
        return;
      }
      let textId = item.$.id;
      let { head } = item;
      if (head == null) {
        return;
      }
      let { title, indextitle, firstline } = head;
      const titleToUse = indextitle || title || firstline;
      if (titleToUse == null) {
        throw `${textId} mangler førstelinje, indextitle og title i ${author}/${id}.xml`;
      }
      if (firstline != null && typeof firstline !== 'string') {
        throw `${textId} har markup i førstelinjen i ${author}/${id}.xml`;
      }
      if (typeof titleToUse !== 'string') {
        throw `${textId} har markup i titlen i ${author}/${id}.xml`;
      }
      lines.push({
        id: textId,
        work_id: id,
        title: titleToUse,
        firstline,
      });
    });
  };

  if (type !== 'poetry') {
    console.log(`${author}/${id}.xml is not poetry`);
    return lines;
  }
  let { workbody } = work;
  if (workbody == null) {
    return lines;
  }
  console.log(`${author}/${id}.xml`);
  handle_section(workbody);
  return lines;
};

const build_poet_works_json = collected_poets => {
  collected_poets.forEach((poet, poetId) => {
    let collectedHeaders = [];
    let collectedLines = [];
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
        collectedHeaders.push(data);

        collectedLines = collectedLines.concat(build_lines_json(work));
      });
    });
    const objectToWrite = {
      poet: poet,
      works: collectedHeaders,
    };
    let json = JSON.stringify(objectToWrite, null, 2);
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

    const linesToWrite = {
      poet: collected_poets.get(poetId),
      lines: collectedLines,
    };
    json = JSON.stringify(linesToWrite, null, 2);
    fs.writeFile(`static/api/${poetId}/lines.json`, json, err => {
      if (err) {
        console.log(err);
      }
    });
  });
};

try {
  fs.mkdirSync(`static/api`);
} catch (err) {
  if (err.code !== 'EEXIST') throw err;
}

collected_poets = build_poets_json();
build_poet_works_json(collected_poets);
