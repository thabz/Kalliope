const fs = require('fs');
const xml2js = require('xml2js');
const libxml = require('libxmljs');
const mkdirp = require('mkdirp');
const Paths = require('../pages/helpers/paths.js');
const entities = require('entities');
const {
  safeMkdir,
  writeJSON,
  loadXMLDoc,
  htmlToXml,
  replaceDashes,
} = require('./helpers.js');

let collected = {
  texts: new Map(),
  works: new Map(),
  keywords: new Map(),
  poets: new Map(),
  dict: new Map(),
};
// Ready after second pass
let collected_works = new Map();

const build_bio_json = collected => {
  collected.poets.forEach((poet, poetId) => {
    safeMkdir(`static/api/${poet.id}`);
    const bioXmlPath = `fdirs/${poet.id}/bio.xml`;
    const data = {
      poet,
      content_html: null,
    };
    const doc = loadXMLDoc(bioXmlPath);
    if (doc != null) {
      const bio = doc.get('//bio');
      const head = bio.get('head');
      const body = bio.get('body');
      let author = null;
      if (head && head.get('author')) {
        data.author = head.get('author').text();
      }
      data.content_html = htmlToXml(
        body.toString().replace('<body>', '').replace('</body>', ''),
        collected
      );
    }
    writeJSON(`static/api/${poet.id}/bio.json`, data);
  });
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

const get_notes = head => {
  return head.find('notes/note').map(note => {
    const lang = note.attr('lang') ? note.attr('lang').value() : 'da';
    return {
      lang,
      content_html: htmlToXml(
        note.toString().replace('<note>', '').replace('</note>', ''),
        collected
      ),
    };
  });
};
const get_pictures = head => {
  return head.find('pictures/picture').map(picture => {
    const src = picture.attr('src').value();
    const lang = picture.attr('lang') ? picture.attr('lang').value() : 'da';
    const type = picture.attr('type') ? picture.attr('type').value() : null;
    return {
      lang,
      src,
      type,
      content_html: htmlToXml(
        picture
          .toString()
          .replace(/<picture[^>]*>/, '')
          .replace('</picture>', ''),
        collected
      ),
    };
  });
};

const handle_text = (poetId, workId, text) => {
  const poet = collected.poets.get(poetId);
  const work = collected_works.get(poetId + '-' + workId);

  const textId = text.attr('id').value();
  const head = text.get('head');
  const body = text.get('body');
  const title = head.get('title') ? head.get('title').text() : null;
  let subtitles = null;
  const subtitle = head.get('subtitle');
  if (subtitle && subtitle.find('line').length > 0) {
    subtitles = subtitle
      .find('line')
      .map(s =>
        replaceDashes(
          s
            .toString()
            .replace('<line>', '')
            .replace('</line>', '')
            .replace('<line/>', '')
        )
      );
  } else if (subtitle) {
    subtitles = [
      replaceDashes(
        subtitle.toString().replace('<subtitle>', '').replace('</subtitle>', '')
      ),
    ];
  }

  const foldername = Paths.textFolder(textId);
  mkdirp.sync(foldername);
  const text_data = {
    poet,
    work,
    text: {
      id: textId,
      title: replaceDashes(title),
      subtitles,
      notes: get_notes(head),
      pictures: get_pictures(head),
      content_html: htmlToXml(
        body.toString().replace('<body>', '').replace('</body>', ''),
        collected
      ),
    },
  };
  writeJSON(Paths.textPath(textId), text_data);
};

const handle_work = work => {
  const type = work.attr('type').value();
  const poetId = work.attr('author').value();
  const workId = work.attr('id').value();
  let lines = [];

  const handle_section = section => {
    let poems = [];
    let proses = [];
    let toc = [];

    const extractTocTitle = head => {
      const firstline = head.get('firstline')
        ? head.get('firstline').text()
        : null;
      const toctitle = head.get('toctitle')
        ? head.get('toctitle').toString()
        : null;
      const title = head.get('title') ? head.get('title').text() : null;
      let titleToUse = toctitle || title || firstline;
      if (titleToUse == null) {
        return null;
      }
      titleToUse = entities
        .decodeHTML(titleToUse)
        .replace('<toctitle>', '')
        .replace('</toctitle>', '');
      const parts = titleToUse.match(/<num>([^<]*)<\/num>(.*)$/);
      if (parts != null) {
        return {
          prefix: parts[1],
          title: replaceDashes(parts[2]),
        };
      } else {
        return { title: replaceDashes(titleToUse) };
      }
    };

    section.childNodes().forEach(part => {
      const partName = part.name();
      if (partName === 'poem') {
        const textId = part.attr('id').value();
        const head = part.get('head');
        const title = head.get('title') ? head.get('title').text() : null;
        const indextitle = head.get('indextitle')
          ? head.get('indextitle').text()
          : null;
        const firstline = head.get('firstline')
          ? head.get('firstline').text()
          : null;
        const indexTitleToUse = indextitle || title || firstline;
        if (indexTitleToUse == null) {
          throw `${textId} mangler førstelinje, indextitle og title i ${poetId}/${workId}.xml`;
        }
        if (firstline != null && typeof firstline !== 'string') {
          throw `${textId} har markup i førstelinjen i ${poetId}/${workId}.xml`;
        }
        if (typeof indexTitleToUse !== 'string') {
          throw `${textId} har markup i titlen i ${poetId}/${workId}.xml`;
        }
        const toctitle = extractTocTitle(head);
        if (toctitle == null) {
          throw `${textId} mangler toctitle, firstline og title i ${poetId}/${workId}.xml`;
        }
        lines.push({
          id: textId,
          work_id: workId,
          lang: collected.poets.get(poetId).lang,
          title: replaceDashes(indexTitleToUse),
          firstline: replaceDashes(firstline),
        });
        toc.push({
          type: 'text',
          id: textId,
          title: replaceDashes(toctitle.title),
          prefix: replaceDashes(toctitle.prefix),
        });
        handle_text(poetId, workId, part);
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
        const toctitle = extractTocTitle(head, textId);
        if (toctitle == null) {
          throw `${textId} mangler title og toctitle i ${poetId}/${workId}.xml`;
        }
        toc.push({
          type: 'text',
          id: textId,
          title: replaceDashes(toctitle.title),
          prefix: toctitle.prefix,
        });
        handle_text(poetId, workId, part);
      }
    });
    return toc;
  };

  const workhead = work.get('workhead');
  const notes = get_notes(workhead);
  const pictures = get_pictures(workhead);

  const workbody = work.get('workbody');
  if (workbody == null) {
    return {
      lines: [],
      toc: [],
      notes: [],
      pictures: [],
    };
  }

  const toc = handle_section(workbody);
  return { lines, toc, notes, pictures };
};

// Constructs collected.works and collected.texts to
// be used for resolving <xref poem="">, etc.
const works_first_pass = poets => {
  poets.forEach(poet => {
    poet.workIds.forEach(workId => {
      const handle_section = section => {
        section.childNodes().forEach(part => {
          const partName = part.name();
          if (partName === 'section') {
            handle_section(part.get('content'));
          } else if (partName == 'poem' || partName === 'prose') {
            const textId = part.attr('id').value();
            const head = part.get('head');
            const title = head.get('title') ? head.get('title').text() : null;
            const firstline = head.get('firstline')
              ? head.get('firstline').text()
              : null;
            const linkTitle = title || firstline;
            collected.texts.set(textId, {
              title: replaceDashes(linkTitle),
            });
          }
        });
      };
      let doc = loadXMLDoc(`fdirs/${poet.id}/${workId}.xml`);
      const work = doc.get('//kalliopework');
      const head = work.get('workhead');
      const title = head.get('title').text();
      const year = head.get('year').text();
      collected.works.set(`${poet.id}/${workId}`, {
        title: replaceDashes(title),
        year: year,
      });
      const workbody = work.get('workbody');
      if (workbody != null) {
        handle_section(workbody);
      }
    });
  });
};

const works_second_pass = collected_poets => {
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
      collected_works.set(poetId + '-' + workId, data);

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

const build_keywords = () => {
  console.log('Building keywords');
  safeMkdir('static/api/keywords');
  const collected_keywords = [];
  const folder = 'data/keywords';
  fs.readdirSync(folder).map(filename => {
    if (!filename.endsWith('.xml')) {
      return;
    }
    const path = `${folder}/${filename}`;
    console.log(path);
    const doc = loadXMLDoc(path);
    const keyword = doc.get('//keyword');
    const head = keyword.get('head');
    const body = keyword.get('body');
    const id = keyword.attr('id').value();
    const title = head.get('title').text();
    const author = head.get('author') ? head.get('author').text() : null;
    const data = {
      id,
      title,
      author,
      content_html: htmlToXml(
        body.toString().replace('<body>', '').replace('</body>', ''),
        collected
      ),
    };
    collected_keywords.push({
      id,
      title,
    });
    writeJSON(`static/api/keywords/${id}.json`, data);
    collected.keywords.set(id, { id, title });
  });
  writeJSON(`static/api/keywords.json`, collected_keywords);
};

const build_news = collected => {
  console.log('Building news');
  ['da', 'en'].forEach(lang => {
    const path = `data/news_${lang}.xml`;
    const doc = loadXMLDoc(path);
    const items = doc.get('//items');
    let list = [];
    items.childNodes().forEach(item => {
      if (item.name() !== 'item') {
        return;
      }
      const date = item.get('date').text();
      const body = item.get('body');
      list.push({
        date,
        content_html: htmlToXml(
          body.toString().replace('<body>', '').replace('</body>', ''),
          collected
        ),
      });
    });
    writeJSON(`static/api/news_${lang}.json`, list);
  });
};

const build_dict_first_pass = collected => {
  console.log('Building dict');
  safeMkdir('static/api/dict');
  const path = `data/dict.xml`;
  const doc = loadXMLDoc(path);
  doc.get('//entries').childNodes().forEach(item => {
    if (item.name() !== 'entry') {
      return;
    }
    const id = item.attr('id').value();
    const title = item.get('ord').text();
    const simpleData = {
      id,
      title,
    };
    collected.dict.set(id, simpleData);
  });
};

const build_dict_second_pass = collected => {
  console.log('Building dict');
  safeMkdir('static/api/dict');
  const path = `data/dict.xml`;
  const doc = loadXMLDoc(path);
  let items = new Array();
  doc.get('//entries').childNodes().forEach(item => {
    if (item.name() !== 'entry') {
      return;
    }
    const id = item.attr('id').value();
    const body = item.get('forkl');
    const title = item.get('ord').text();
    let phrase = null;
    if (item.get('frase')) {
      phrase = item.get('frase').text();
    }
    const variants = item.find('var').map(varItem => varItem.text());
    const data = {
      id,
      title,
      phrase,
      variants,
      content_html: htmlToXml(
        body.toString().replace('<forkl>', '').replace('</forkl>', ''),
        collected
      ),
    };
    writeJSON(`static/api/dict/${id}.json`, data);
    const simpleData = {
      id,
      title,
    };
    items.push(simpleData);
  });
  writeJSON(`static/api/dict.json`, items);
};

safeMkdir(`static/api`);
collected.poets = build_poets_json();
works_first_pass(collected.poets);
build_dict_first_pass(collected);
works_second_pass(collected.poets);
build_keywords();
build_bio_json(collected);
build_news(collected);
build_dict_second_pass(collected);
