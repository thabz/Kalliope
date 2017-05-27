const fs = require('fs');
const xml2js = require('xml2js');
const libxml = require('libxmljs');

const writeJSON = (filename, data) => {
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, json);
};

const loadXMLDoc = filename => {
  const data = fs.readFileSync(filename);
  const doc = libxml.parseXmlString(data);
  return doc;
};

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
    writeJSON(`static/api/poets-${country}.json`, sorted);
  });
  return collected_poets;
};

const handle_work = work => {
  const type = work.attr('type').value();
  const poetId = work.attr('author').value();
  const id = work.attr('id').value();
  let lines = [];

  const handle_section = section => {
    let poems = [];
    let proses = [];
    let toc = [];

    section.childNodes().forEach(part => {
      const partName = part.name();
      if (partName === 'poem') {
        const textId = part.attr('id').value();
        const head = part.get('head');
        const title = head.get('title') ? head.get('title').text() : null;
        const indextitle = head.get('indextitle')
          ? head.get('indextitle').text()
          : null;
        const toctitle = head.get('toctitle')
          ? head.get('toctitle').text()
          : null;
        const firstline = head.get('firstline')
          ? head.get('firstline').text()
          : null;
        const indexTitleToUse = indextitle || title || firstline;
        const tocTitleToUse = toctitle || title;
        if (indexTitleToUse == null) {
          throw `${textId} mangler førstelinje, indextitle og title i ${author}/${id}.xml`;
        }
        if (firstline != null && typeof firstline !== 'string') {
          throw `${textId} har markup i førstelinjen i ${author}/${id}.xml`;
        }
        if (typeof indexTitleToUse !== 'string') {
          throw `${textId} har markup i titlen i ${author}/${id}.xml`;
        }
        lines.push({
          id: textId,
          work_id: id,
          title: indexTitleToUse,
          firstline,
        });
        toc.push({
          type: 'text',
          id: textId,
          title: tocTitleToUse,
        });
      } else if (partName === 'section') {
        const subtoc = handle_section(part.get('content'));
        const title = part.get('head/toctitle').text();
        toc.push({
          type: 'section',
          title: title,
          content: subtoc,
        });
      } else if (partName === 'prose') {
        const textId = part.attr('id').value();
        const head = part.get('head');
        const title = head.get('title') ? head.get('title').text() : null;
        const indextitle = head.get('indextitle')
          ? head.get('indextitle').text()
          : null;
        const toctitle = head.get('toctitle')
          ? head.get('toctitle').text()
          : null;
        const tocTitleToUse = toctitle || title;
        toc.push({
          type: 'text',
          id: textId,
          title: tocTitleToUse,
        });
      }
    });
    return toc;
  };

  if (type !== 'poetry') {
    console.log(`${poetId}/${id}.xml is not poetry`);
    return null;
  }

  const workhead = work.get('workhead');
  const notes = workhead.find('notes/note').map(note => {
    const lang = note.attr('lang') ? note.attr('lang').value() : 'da';
    return {
      lang,
      content_html: note
        .toString()
        .replace('<note>', '')
        .replace('</note>', ''),
    };
  });
  const pictures = workhead.find('pictures/picture').map(picture => {
    const src = picture.attr('src').value();
    const lang = picture.attr('lang') ? picture.attr('lang').value() : 'da';
    const type = picture.attr('type') ? picture.attr('type').value() : null;
    return {
      lang,
      src,
      type,
      content_html: picture
        .toString()
        .replace(/<picture[^>]*>/, '')
        .replace('</picture>', ''),
    };
  });

  const workbody = work.get('workbody');
  if (workbody == null) {
    return null;
  }

  const toc = handle_section(workbody);
  return { lines, toc, notes, pictures };
};

const build_poet_works_json = collected_poets => {
  collected_poets.forEach((poet, poetId) => {
    try {
      fs.mkdirSync(`static/api/${poetId}`);
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
    let collectedHeaders = [];
    let collectedLines = [];
    poet.workIds.forEach(workId => {
      let doc = loadXMLDoc(`fdirs/${poetId}/${workId}.xml`);
      console.log(`fdirs/${poetId}/${workId}.xml`);
      const work = doc.get('//kalliopework');
      const status = work.attr('status').value();
      const type = work.attr('type').value();
      const head = work.get('workhead');
      const title = head.get('title').text();
      const year = head.get('year').text();
      const data = { id: workId, title, year, status, type };
      collectedHeaders.push(data);

      const work_data = handle_work(work);
      if (work_data) {
        collectedLines = collectedLines.concat(work_data.lines);
        const toc_file_data = {
          poet,
          toc: work_data.toc,
          work: data,
          notes: work_data.notes || [],
          pictures: work_data.pictures || [],
        };
        writeJSON(`static/api/${poetId}/${workId}-toc.json`, toc_file_data);
      }
      doc = null;
    });
    const objectToWrite = {
      poet: poet,
      works: collectedHeaders,
    };
    let json = JSON.stringify(objectToWrite, null, 2);
    writeJSON(`static/api/${poetId}/works.json`, objectToWrite);

    const linesToWrite = {
      poet: collected_poets.get(poetId),
      lines: collectedLines,
    };
    writeJSON(`static/api/${poetId}/lines.json`, linesToWrite);
  });
};

try {
  fs.mkdirSync(`static/api`);
} catch (err) {
  if (err.code !== 'EEXIST') throw err;
}

collected_poets = build_poets_json();
build_poet_works_json(collected_poets);
