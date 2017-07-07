const fs = require('fs');
const xml2js = require('xml2js');
const libxml = require('libxmljs');
const mkdirp = require('mkdirp');
const Paths = require('../pages/helpers/paths.js');
const entities = require('entities');
const {
  isFileModified,
  refreshFilesModifiedCache,
  loadCachedJSON,
  writeCachedJSON,
} = require('./libs/caching.js');
const {
  safeMkdir,
  writeJSON,
  loadXMLDoc,
  htmlToXml,
  replaceDashes,
} = require('./libs/helpers.js');

let collected = {
  texts: new Map(),
  works: new Map(),
  keywords: new Map(),
  poets: new Map(),
  dict: new Map(),
  timeline: new Array(),
};

// Ready after second pass
let collected_works = new Map();

const normalize_timeline_date = date => {
  if (date.length !== 4 + 1 + 2 + 1 + 2) {
    return `${date.substring(0, 4)}-01-01`;
  } else {
    return date;
  }
};

const sorted_timeline = timeline => {
  return timeline.sort((a, b) => {
    let date_a = normalize_timeline_date(a.date);
    let date_b = normalize_timeline_date(b.date);
    return date_b === date_a ? 0 : date_a < date_b ? -1 : 1;
  });
};

const load_timeline = filename => {
  let doc = loadXMLDoc(filename);
  if (doc == null) {
    return [];
  }
  return doc.find('//events/entry').map(event => {
    const type = event.attr('type').value();
    const date = event.attr('date').value();
    const html = event.get('html');
    let data = {
      date,
      type,
      lang: 'da',
      is_history_item: true,
      content_html: htmlToXml(
        html.toString().replace('<html>', '').replace('</html>', ''),
        collected
      ),
    };
    if (type === 'image') {
      data.src = event.get('src').text();
    }
    return data;
  });
};

const build_global_timeline = collected => {
  // TODO: Cache this file
  return load_timeline('data/events.xml');
};

const build_poet_timeline_json = (poet, collected) => {
  let items = [];
  if (poet.type === 'poet') {
    poet.workIds.forEach(workId => {
      const work = collected.works.get(`${poet.id}/${workId}`);
      if (work.year != '?') {
        // TODO: This der er et titel-blad, så output type image.
        // TODO: Kun output <a> hvis værket har indhold.
        items.push({
          date: work.year,
          type: 'text',
          lang: 'da',
          is_history_item: false,
          content_html: `${poet.name
            .lastname}: <a work="${poet.id}/${workId}">${work.title}</a>.`,
        });
      }
    });
    if (poet.period.born.date !== '?') {
      const place = poet.period.born.place != null
        ? ' i ' + poet.period.born.place
        : '';
      items.push({
        date: poet.period.born.date,
        type: 'text',
        lang: 'da',
        is_history_item: false,
        content_html: `${poet.name.lastname} født${place}`,
      });
    }
    if (poet.period.dead.date !== '?') {
      const place = poet.period.dead.place != null
        ? ' i ' + poet.period.dead.place
        : '';
      items.push({
        date: poet.period.dead.date,
        type: 'text',
        lang: 'da',
        is_history_item: false,
        content_html: `${poet.name.lastname} død${place}`,
      });
    }
    let poet_events = load_timeline(`fdirs/${poet.id}/events.xml`).map(e => {
      e.is_history_item = false;
      return e;
    });
    items = [...items, ...poet_events];
    items = sorted_timeline(items);
  }
  if (items.length >= 2) {
    const start_date = normalize_timeline_date(items[0].date);
    const end_date = normalize_timeline_date(items[items.length - 1].date);
    let globalItems = collected.timeline.filter(item => {
      const d = normalize_timeline_date(item.date);
      return d > start_date && d < end_date;
    });
    items = [...globalItems, ...items];
    items = sorted_timeline(items);
  }
  if (items.length == 1) {
    // We only have a single born or dead event. Not an interesting timeline,
    // so ignore it.
    items = [];
  }
  return items;
};

const build_bio_json = collected => {
  collected.poets.forEach((poet, poetId) => {
    // Skip if all of the participating xml files aren't modified
    if (
      !isFileModified(
        `data/poets.xml:${poet.id}`,
        'data/events.xml',
        ...poet.workIds.map(workId => `fdirs/${poet.id}/${workId}.xml`),
        `fdirs/${poet.id}/events.xml`,
        `fdirs/${poet.id}/bio.xml`
      )
    ) {
      return;
    }

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
    data.timeline = build_poet_timeline_json(poet, collected);
    const destFilename = `static/api/${poet.id}/bio.json`;
    console.log(destFilename);
    writeJSON(destFilename, data);
  });
};

// TODO: Speed this up
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
        has_bibliography:
          fs.existsSync(`fdirs/${id}/bibliography-primary.xml`) ||
            fs.existsSync(`fdirs/${id}/bibliography-secondary.xml`),
        has_works: worksArray.length > 0,
        has_biography:
          fs.existsSync(`fdirs/${id}/bio.xml`) ||
            fs.existsSync(`fdirs/${id}/events.xml`),
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

const handle_text = (poetId, workId, text, isPoetry) => {
  if (
    !isFileModified(`data/poets.xml:${poetId}`, `fdirs/${poetId}/${workId}.xml`)
  ) {
    return;
  }
  const poet = collected.poets.get(poetId);
  const work = collected_works.get(poetId + '-' + workId);

  const textId = text.attr('id').value();
  const head = text.get('head');
  const body = text.get('body');
  const title = head.get('title') ? head.get('title').text() : null;
  const keywords = head.get('keywords');
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
  let keywordsArray = null;
  if (keywords) {
    keywordsArray = keywords.text().split(',');
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
      keywords: keywordsArray,
      pictures: get_pictures(head),
      content_html: htmlToXml(
        body.toString().replace('<body>', '').replace('</body>', ''),
        collected,
        isPoetry
      ),
    },
  };
  console.log(Paths.textPath(textId));
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
      let toctitle = head.get('toctitle')
        ? head.get('toctitle').toString()
        : null;
      if (toctitle === '<toctitle/>') {
        console.log(
          `${poetId}/${workId}.xml has superfluous empty <toctitle/>`
        );
        toctitle = null;
      }
      const title = head.get('title') ? head.get('title').text() : null;
      let titleToUse = toctitle || title || firstline;
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
        handle_text(poetId, workId, part, true);
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
        handle_text(poetId, workId, part, false);
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
  let texts = new Map(loadCachedJSON('collected.texts') || []);
  let works = new Map(loadCachedJSON('collected.works') || []);
  let found_changes = false;
  const force_reload = texts.size === 0 || works.size === 0;
  poets.forEach(poet => {
    poet.workIds.forEach(workId => {
      const workFilename = `fdirs/${poet.id}/${workId}.xml`;
      if (!force_reload && !isFileModified(workFilename)) {
        return;
      } else {
        found_changes = true;
      }

      let doc = loadXMLDoc(workFilename);
      const work = doc.get('//kalliopework');
      const head = work.get('workhead');
      const title = head.get('title').text();
      const year = head.get('year').text();
      // Sanity check
      if (work.attr('author').value() !== poet.id) {
        throw new Error(
          `fdirs/${poet.id}/${workId}.xml has wrong author-attribute in <kalliopework>`
        );
      }
      works.set(`${poet.id}/${workId}`, {
        title: replaceDashes(title),
        year: year,
      });

      work.find('//poem|//prose').forEach(part => {
        const textId = part.attr('id').value();
        const head = part.get('head');
        const title = head.get('title') ? head.get('title').text() : null;
        const firstline = head.get('firstline')
          ? head.get('firstline').text()
          : null;
        const linkTitle = title || firstline;
        texts.set(textId, {
          title: replaceDashes(linkTitle),
        });
      });
    });
  });
  if (found_changes) {
    writeCachedJSON('collected.texts', Array.from(texts));
    writeCachedJSON('collected.works', Array.from(works));
  }
  return { works, texts };
};

const works_second_pass = collected_poets => {
  collected_poets.forEach((poet, poetId) => {
    safeMkdir(`static/api/${poetId}`);

    poet.workIds.forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!isFileModified(filename)) {
        return;
      }
      let doc = loadXMLDoc(filename);
      const work = doc.get('//kalliopework');
      const status = work.attr('status').value();
      const type = work.attr('type').value();
      const head = work.get('workhead');
      const title = head.get('title').text();
      const year = head.get('year').text();
      const data = { id: workId, title, year, status, type };
      collected_works.set(poetId + '-' + workId, data);

      // TODO: Make handle_work non-recursive by using a simple XPath
      // to select all the poems and prose texts.
      handle_work(work); // Creates texts
      doc = null;
    });
  });
};

const build_works_toc = poets => {
  // Returns {toc, notes, pictures}
  const extract_work_data = work => {
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
        let toctitle = head.get('toctitle')
          ? head.get('toctitle').toString()
          : null;
        if (toctitle === '<toctitle/>') {
          console.log(
            `${poetId}/${workId}.xml has superfluous empty <toctitle/>`
          );
          toctitle = null;
        }
        const title = head.get('title') ? head.get('title').text() : null;
        let titleToUse = toctitle || title || firstline;
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
          toc.push({
            type: 'text',
            id: textId,
            title: replaceDashes(toctitle.title),
            prefix: replaceDashes(toctitle.prefix),
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

  poets.forEach((poet, poetId) => {
    safeMkdir(`static/api/${poetId}`);

    poet.workIds.forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!isFileModified(filename)) {
        return;
      }
      let doc = loadXMLDoc(filename);
      const work = doc.get('//kalliopework');
      const status = work.attr('status').value();
      const type = work.attr('type').value();
      const head = work.get('workhead');
      const title = head.get('title').text();
      const year = head.get('year').text();
      const data = { id: workId, title, year, status, type };
      collected_works.set(poetId + '-' + workId, data);

      const work_data = extract_work_data(work);

      if (work_data) {
        const toc_file_data = {
          poet,
          toc: work_data.toc,
          work: data,
          notes: work_data.notes || [],
          pictures: work_data.pictures || [],
        };
        const tocFilename = `static/api/${poetId}/${workId}-toc.json`;
        console.log(tocFilename);
        writeJSON(tocFilename, toc_file_data);
      }
      doc = null;
    });
  });
};

const build_poet_works_json = poets => {
  poets.forEach((poet, poetId) => {
    safeMkdir(`static/api/${poetId}`);

    const filenames = poet.workIds.map(
      workId => `fdirs/${poetId}/${workId}.xml`
    );
    if (!isFileModified(`data/poets.xml:${poetId}`, ...filenames)) {
      return;
    }

    let collectedHeaders = [];
    poet.workIds.forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      let doc = loadXMLDoc(filename);
      const work = doc.get('//kalliopework');
      const status = work.attr('status').value();
      const type = work.attr('type').value();
      const head = work.get('workhead');
      const title = head.get('title').text();
      const year = head.get('year').text();
      const data = { id: workId, title, year, status, type };
      collectedHeaders.push(data);
    });

    const objectToWrite = {
      poet: poet,
      works: collectedHeaders,
    };
    const worksOutFilename = `static/api/${poetId}/works.json`;
    console.log(worksOutFilename);
    writeJSON(worksOutFilename, objectToWrite);
  });
};

const build_poet_lines_json = poets => {
  poets.forEach((poet, poetId) => {
    const filenames = poet.workIds.map(
      workId => `fdirs/${poetId}/${workId}.xml`
    );
    if (!isFileModified(`data/poets.xml:${poetId}`, ...filenames)) {
      return;
    }

    safeMkdir(`static/api/${poetId}`);

    let collectedLines = [];
    poet.workIds.forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      let doc = loadXMLDoc(filename);
      doc.find('//poem').forEach(part => {
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
        collectedLines.push({
          id: textId,
          work_id: workId,
          lang: poet.lang,
          title: replaceDashes(indexTitleToUse),
          firstline: replaceDashes(firstline),
        });
      });
    });
    // Detect firstlines and titles that are shared between multiple
    // poems. Mark these with non_unique_firstline and non_unique_indextitle.
    let counts = {
      firstlines: {},
      titles: {},
    };
    collectedLines.forEach(pair => {
      counts.titles[pair.title] = (counts.titles[pair.title] || 0) + 1;
      counts.firstlines[pair.firstline] =
        (counts.firstlines[pair.firstline] || 0) + 1;
    });
    collectedLines = collectedLines.map(pair => {
      if (pair.title != null && counts.titles[pair.title] > 1) {
        pair.non_unique_indextitle = true;
      }
      if (pair.firstline != null && counts.firstlines[pair.firstline] > 1) {
        pair.non_unique_firstline = true;
      }
      return pair;
    });
    const data = {
      poet: poet,
      lines: collectedLines,
    };
    const linesOutFilename = `static/api/${poetId}/lines.json`;
    console.log(linesOutFilename);
    writeJSON(linesOutFilename, data);
  });
};

const build_keywords = () => {
  safeMkdir('static/api/keywords');
  collected.keywords = new Map(loadCachedJSON('collected.keywords') || []);
  const folder = 'data/keywords';
  const filenames = fs
    .readdirSync(folder)
    .filter(x => x.endsWith('.xml'))
    .map(x => `${folder}/${x}`);
  if (collected.keywords.size === 0 || isFileModified(...filenames)) {
    collected.keywords = new Map();
    let keywords_toc = new Array();
    filenames.map(path => {
      if (!path.endsWith('.xml')) {
        return;
      }
      const doc = loadXMLDoc(path);
      const keyword = doc.get('//keyword');
      const head = keyword.get('head');
      const body = keyword.get('body');
      const id = keyword.attr('id').value();
      const title = head.get('title').text();
      const pictures = get_pictures(head);
      const author = head.get('author') ? head.get('author').text() : null;
      const data = {
        id,
        title,
        author,
        pictures,
        content_html: htmlToXml(
          body.toString().replace('<body>', '').replace('</body>', ''),
          collected
        ),
      };
      keywords_toc.push({
        id,
        title,
      });
      const outFilename = `static/api/keywords/${id}.json`;
      console.log(outFilename);
      writeJSON(outFilename, data);
      collected.keywords.set(id, { id, title });
    });
    writeCachedJSON('collected.keywords', Array.from(collected.keywords));
    const outFilename = `static/api/keywords.json`;
    console.log(outFilename);
    writeJSON(outFilename, keywords_toc);
  }
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
  const path = `data/dict.xml`;
  if (!isFileModified(path)) {
    collected.dict = new Map(loadCachedJSON('collected.dict'));
    return;
  }

  console.log('Building dict');
  safeMkdir('static/api/dict');
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
  writeCachedJSON('collected.dict', Array.from(collected.dict));
};

const build_dict_second_pass = collected => {
  const path = `data/dict.xml`;
  if (!isFileModified(path)) {
    return;
  }
  console.log('Building dict');
  safeMkdir('static/api/dict');

  let items = new Array();

  const createItem = (id, title, phrase, variants, body, collected) => {
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
  };

  const doc = loadXMLDoc(path);
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
    variants.forEach(variant => {
      createItem(
        variant,
        variant,
        null,
        null,
        `<b>${variant}</b>: se <a dict="${id}">${title}</a>.`,
        collected
      );
    });
    createItem(id, title, phrase, variants, body, collected);
  });
  writeJSON(`static/api/dict.json`, items);
};

const build_bibliography_json = collected => {
  collected.poets.forEach((poet, poetId) => {
    if (
      !isFileModified(
        `data/poets.xml:${poet.id}`,
        `fdirs/${poet.id}/bibliography-primary.xml`,
        `fdirs/${poet.id}/bibliography-secondary.xml`
      )
    ) {
      return;
    }

    safeMkdir(`static/api/${poet.id}`);
    let data = { poet, primary: [], secondary: [] };
    ['primary', 'secondary'].forEach(filename => {
      const bioXmlPath = `fdirs/${poet.id}/bibliography-${filename}.xml`;
      const doc = loadXMLDoc(bioXmlPath);
      if (doc != null) {
        data[filename] = doc.find('//items/item').map(line => {
          return htmlToXml(
            line.toString().replace('<item>', '').replace('</item>', ''),
            collected
          );
        });
      }
    });
    const outFilename = `static/api/${poet.id}/bibliography.json`;
    console.log(outFilename);
    writeJSON(outFilename, data);
  });
};

let b_results = [];
// Benchmarking
const b = (name, f, args) => {
  const beforeMillis = Date.now();
  const result = f(args);
  const afterMillis = Date.now();
  b_results.push({ name, millis: afterMillis - beforeMillis });
  return result;
};
const print_benchmarking_results = () => {
  b_results.forEach(r => {
    console.log(`${r.name}: ${r.millis}ms`);
  });
};

safeMkdir(`static/api`);
collected.poets = b('build_poets_json', build_poets_json);
b('build_bibliography_json', build_bibliography_json, collected);
// Build collected.works and collected.texts
Object.assign(
  collected,
  b('works_first_pass', works_first_pass, collected.poets)
);
build_dict_first_pass(collected);
b('build_keywords', build_keywords);
b('build_poet_lines_json', build_poet_lines_json, collected.poets);
b('build_poet_works_json', build_poet_works_json, collected.poets);
b('works_second_pass', works_second_pass, collected.poets);
b('build_works_toc', build_works_toc, collected.poets);
collected.timeline = build_global_timeline(collected);
build_bio_json(collected);
build_news(collected);
build_dict_second_pass(collected);

refreshFilesModifiedCache();
print_benchmarking_results();
