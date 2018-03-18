const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const libxml = require('libxmljs');
const mkdirp = require('mkdirp');
const Paths = require('../pages/helpers/paths.js');
const entities = require('entities');
const elasticSearchClient = require('./libs/elasticsearch-client.js');
const CommonData = require('../pages/helpers/commondata.js');

const {
  isFileModified,
  refreshFilesModifiedCache,
  loadCachedJSON,
  writeCachedJSON,
} = require('./libs/caching.js');
const {
  fileExists,
  safeMkdir,
  writeJSON,
  writeText,
  loadXMLDoc,
  htmlToXml,
  safeGetText,
  safeGetAttr,
  replaceDashes,
} = require('./libs/helpers.js');

let collected = {
  texts: new Map(),
  works: new Map(),
  workids: new Map(),
  keywords: new Map(),
  poets: new Map(),
  dict: new Map(),
  timeline: new Array(),
  person_or_keyword_reference: new Map(),
};

// Use poetname.js:poetNameString instead when node.js uses modules
const poetName = poet => {
  const { name } = poet;
  const { firstname, lastname } = name;
  if (lastname) {
    if (firstname) {
      namePart = `${firstname} ${lastname}`;
    } else {
      namePart = lastname;
    }
  } else {
    namePart = firstname;
  }
  return namePart;
};

// Use workname.js: workTitleString instead when node.js uses modules
const workName = work => {
  const { title, year } = work;
  let yearPart = '';
  if (year && year !== '?') {
    yearPart = ` (${year})`;
  }
  return title + yearPart;
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
      content_lang: 'da',
      content_html: htmlToXml(
        html
          .toString()
          .replace('<html>', '')
          .replace('</html>', '')
          .trim(),
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
  const inonToString = (inon, lang) => {
    const translations = {
      'da*in': 'i',
      'da*on': 'på',
      'da*by': 'ved',
      'en*in': 'in',
      'en*on': 'on',
      'en*by': 'by',
    };
    return translations[lang + '*' + inon];
  };

  let items = [];
  if (poet.type !== 'collection') {
    collected.workids.get(poet.id).forEach(workId => {
      const work = collected.works.get(`${poet.id}/${workId}`);
      if (work.year != '?') {
        // TODO: Hvis der er et titel-blad, så output type image.
        const workName = work.has_content
          ? `<a work="${poet.id}/${workId}">${work.title}</a>`
          : work.title;
        items.push({
          date: work.year,
          type: 'text',
          content_lang: 'da',
          is_history_item: false,
          content_html: [
            [`${poet.name.lastname}: ${workName}.`, { html: true }],
          ],
        });
      }
    });
    if (poet.period.born.date !== '?') {
      const place = (poet.period.born.place != null
        ? '  ' +
          inonToString(poet.period.born.inon, 'da') +
          ' ' +
          poet.period.born.place +
          ''
        : ''
      ).replace(/\.*$/, '.'); // Kbh. giver ekstra punktum.
      items.push({
        date: poet.period.born.date,
        type: 'text',
        is_history_item: false,
        content_lang: 'da',
        content_html: [
          [`${poet.name.lastname || poet.name.firstname} født${place}`],
        ],
      });
    }
    if (poet.period.dead.date !== '?') {
      const place = (poet.period.dead.place != null
        ? ' ' +
          inonToString(poet.period.dead.inon, 'da') +
          ' ' +
          poet.period.dead.place
        : ''
      ).replace(/\.*$/, '.'); // Kbh. giver ekstra punktum.;
      items.push({
        date: poet.period.dead.date,
        type: 'text',
        is_history_item: false,
        content_lang: 'da',
        content_html: [
          [`${poet.name.lastname || poet.name.firstname} død${place}`],
        ],
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

const build_museum_link = picture => {
  const invNr = safeGetAttr(picture, 'invnr');
  const objId = safeGetAttr(picture, 'objid');
  const museum = safeGetAttr(picture, 'museum');
  if (museum != null && (invNr != null || objId != null)) {
    let url = null;
    switch (museum) {
      case 'thorvaldsens':
        url = `http://thorvaldsensmuseum.dk/samlingerne/vaerk/${invNr}`;
        break;
      case 'nivaagaard':
        url = `http://www.nivaagaard.dk/samling-da/${objId}`;
        break;
      case 'smk':
        url = `http://collection.smk.dk/#/detail/${invNr}`;
        break;
      case 'smb':
        url = `http://www.smb-digital.de/eMuseumPlus?objectId=${objId}`;
        break;
      case 'npg':
        url = `https://www.npg.org.uk/collections/search/portrait/${objId}`;
        break;
    }
    return url == null ? null : ` <a href="${url}">⌘</a>`;
  }
};

const build_portrait_json = (poet, collected) => {
  if (!poet.has_portraits) {
    return null;
  }
  let data = null;
  const doc = loadXMLDoc(`fdirs/${poet.id}/portraits.xml`);
  if (doc != null) {
    const primaries = doc.find('//pictures/picture').filter(picture => {
      return safeGetAttr(picture, 'primary') == 'true';
    });
    if (primaries.length > 1) {
      throw `fdirs/${poet.id}/portraits.xml har flere primary`;
    }
    if (primaries.length === 0) {
      throw `fdirs/${poet.id}/portraits.xml mangler primary`;
    }
    const primary = primaries[0];
    const museumLink = build_museum_link(primary) || '';
    data = {
      lang: poet.lang,
      src: primary.attr('src').value(),
      content_lang: 'da',
      content_html: htmlToXml(
        primary
          .toString()
          .replace(/<picture[^>]*?>/, '')
          .replace('</picture>', '')
          .trim() + museumLink,
        collected
      ),
    };
  }
  return data;
};

const build_bio_json = collected => {
  collected.poets.forEach((poet, poetId) => {
    // Skip if all of the participating xml files aren't modified
    if (
      !isFileModified(
        `data/poets.xml:${poet.id}`,
        'data/events.xml',
        ...collected.workids
          .get(poetId)
          .map(workId => `fdirs/${poet.id}/${workId}.xml`),
        `fdirs/${poet.id}/events.xml`,
        `fdirs/${poet.id}/portraits.xml`,
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
        body
          .toString()
          .replace('<body>', '')
          .replace('</body>', ''),
        collected
      );
      data.content_lang = 'da';
    }
    data.timeline = build_poet_timeline_json(poet, collected);
    data.portrait = build_portrait_json(poet, collected);
    const destFilename = `static/api/${poet.id}/bio.json`;
    console.log(destFilename);
    writeJSON(destFilename, data);
  });
};

// TODO: Speed this up by caching.
const build_poets_json = () => {
  // Returns {has_poems: bool, has_prose: bool,
  //  has_texts: bool, has_works: bool}
  const hasTexts = (poetId, workIds) => {
    const has_works = workIds.length > 0;
    let has_poems = false;
    let has_prose = false;
    while ((has_poems == false || has_prose == false) && workIds.length > 0) {
      const workId = workIds.pop();
      let doc = loadXMLDoc(`fdirs/${poetId}/${workId}.xml`);
      if (doc == null) {
        throw `fdirs/${poetId}/${workId}.xml kan ikke parses.`;
      }
      if (!has_poems) {
        has_poems = doc.find('//poem').length > 0;
      }
      if (!has_prose) {
        has_prose = doc.find('//prose').length > 0;
      }
    }
    // has_poems = !!has_poems;
    // has_prose = !!has_prose;
    const has_texts = has_poems || has_prose;
    return {
      has_poems,
      has_prose,
      has_texts,
      has_works,
    };
  };

  let doc = loadXMLDoc('data/poets.xml');
  const persons = doc.find('//person');

  let byCountry = new Map();
  let collected_poets = new Map();

  persons.forEach(p => {
    const id = p.attr('id').value();
    const country = p.attr('country').value();
    const lang = p.attr('lang').value();
    const type = p.attr('type').value();
    const nameE = p.get('name');
    const periodE = p.get('period');
    const works = safeGetText(p, 'works');

    let square_portrait = null;
    const has_portraits = fileExists(`fdirs/${id}/portraits.xml`);
    if (has_portraits) {
      const portraitsDoc = loadXMLDoc(`fdirs/${id}/portraits.xml`);
      const squares = portraitsDoc
        .find('//pictures/picture')
        .map(p => safeGetAttr(p, 'square-src'))
        .filter(s => s != null);
      if (squares.length > 0) {
        square_portrait = squares[0];
      }
    }
    const has_square_portrait = square_portrait != null;
    if (has_portraits && !has_square_portrait) {
      throw `${id} har portræt men ikke square-portrait`;
    }

    const mentions = collected.person_or_keyword_refs.get(id);
    const has_mentions =
      mentions != null &&
      (mentions.mention.length > 0 || mentions.translation.length > 0);

    const firstname = safeGetText(nameE, 'firstname');
    const lastname = safeGetText(nameE, 'lastname');
    const fullname = safeGetText(nameE, 'fullname');
    const pseudonym = safeGetText(nameE, 'pseudonym');
    const christened = safeGetText(nameE, 'christened');
    const realname = safeGetText(nameE, 'realname');

    let period = {};
    if (periodE) {
      const bornE = periodE.get('born');
      const deadE = periodE.get('dead');
      const coronationE = periodE.get('coronation');
      if (bornE) {
        period.born = {
          date: safeGetText(bornE, 'date'),
          place: safeGetText(bornE, 'place'),
          inon: safeGetAttr(bornE.get('place'), 'inon') || 'in',
        };
      }
      if (deadE) {
        period.dead = {
          date: safeGetText(deadE, 'date'),
          place: safeGetText(deadE, 'place'),
          inon: safeGetAttr(deadE.get('place'), 'inon') || 'in',
        };
      }
      if (coronationE) {
        period.coronation = {
          date: safeGetText(coronationE, 'date'),
          place: safeGetText(coronationE, 'place'),
          inon: safeGetAttr(coronationE.get('place'), 'inon') || 'in',
        };
      }
    }
    if (period.born == null || period.dead == null) {
      period = null;
    }

    let list = byCountry.get(country) || [];
    let worksArray = works ? works.split(',') : [];
    const has = hasTexts(id, worksArray);
    const poet = {
      id,
      country,
      lang,
      type,
      square_portrait,
      name: { firstname, lastname, fullname, pseudonym, christened, realname },
      period,
      has_portraits,
      has_square_portrait,
      has_mentions,
      has_works: has.has_works,
      has_poems: has.has_poems,
      has_prose: has.has_prose,
      has_texts: has.has_texts,
      has_bibliography:
        fs.existsSync(`fdirs/${id}/bibliography-primary.xml`) ||
        fs.existsSync(`fdirs/${id}/bibliography-secondary.xml`),
      has_biography:
        fs.existsSync(`fdirs/${id}/bio.xml`) ||
        fs.existsSync(`fdirs/${id}/events.xml`) ||
        (period != null &&
          period.born != null &&
          period.dead != null &&
          period.born.date !== '?' &&
          period.dead.date !== '?'),
    };
    list.push(poet);
    byCountry.set(country, list);
    collected_poets.set(id, poet);
  });
  byCountry.forEach((poets, country) => {
    const sorted = poets.sort((a, b) => {
      return a.id < b.id ? -1 : 1;
    });
    const data = {
      poets: sorted,
    };
    writeJSON(`static/api/poets-${country}.json`, data);
    poets.forEach(poet => {
      writeJSON(`static/api/${poet.id}.json`, poet);
    });
  });
  return collected_poets;
};

const build_poet_workids = () => {
  let collected_workids = new Map(loadCachedJSON('collected.workids') || []);
  if (collected_workids.size === 0 || isFileModified('data/poets.xml')) {
    collected_workids = new Map();
    const doc = loadXMLDoc('data/poets.xml');
    doc.find('/persons/person').forEach(person => {
      const poetId = person.attr('id').value();
      const workIds = person.get('works');
      let items = workIds
        ? workIds
            .text()
            .split(',')
            .filter(x => x.length > 0)
        : [];
      collected_workids.set(poetId, items);
    });
    writeCachedJSON('collected.workids', Array.from(collected_workids));
  }
  return collected_workids;
};

// context contains keys for any `${var}` that's to be replaced in the note texts.
const get_notes = (head, context = {}) => {
  return head.find('notes/note').map(note => {
    const lang = note.attr('lang') ? note.attr('lang').value() : 'da';
    const type = note.attr('type') ? note.attr('type').value() : null;
    const replaceContextPlaceholders = s => {
      return s.replace(/\$\{(.*?)\}/g, (_, p1) => {
        return context[p1];
      });
    };
    return {
      type,
      content_lang: lang,
      content_html: htmlToXml(
        replaceContextPlaceholders(note.toString())
          .replace(/<note[^>]*>/, '')
          .replace('</note>', ''),
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
    const invnr = safeGetAttr(picture, 'invnr');
    const museumLink = build_museum_link(picture) || '';

    return {
      src,
      type,
      content_lang: lang,
      content_html: htmlToXml(
        picture
          .toString()
          .replace(/<picture[^>]*>/, '')
          .replace('</picture>', '') + museumLink,
        collected
      ),
    };
  });
};

const handle_text = (
  poetId,
  workId,
  text,
  isPoetry,
  resolve_prev_next,
  section_titles
) => {
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
  const firstline = safeGetText(head, 'firstline');
  let title = safeGetText(head, 'title');
  title = title || firstline;
  let linktitle = safeGetText(head, 'linktitle');
  let indextitle = safeGetText(head, 'indextitle');
  linktitle = linktitle || indextitle || title;

  const keywords = head.get('keywords');
  const isBible = poetId === 'bibel';

  let subtitles = null;
  const subtitle = head.get('subtitle');
  if (subtitle && subtitle.find('line').length > 0) {
    subtitles = subtitle.find('line').map(s => {
      return htmlToXml(
        s
          .toString()
          .replace('<line>', '')
          .replace('</line>', '')
          .replace('<line/>', ''),
        collected,
        true
      );
    });
  } else if (subtitle) {
    const subtitleString = subtitle
      .toString()
      .replace('<subtitle>', '')
      .replace('</subtitle>', '');
    if (subtitleString.indexOf('<subtitle/>') === -1) {
      subtitles = [htmlToXml(subtitleString, collected, true)];
    }
  }
  let keywordsArray = [];
  if (keywords) {
    keywordsArray = keywords
      .text()
      .split(',')
      .map(k => {
        let type = null;
        let title = null;
        if (collected.poets.get(k) != null) {
          type = 'poet';
          title = poetName(collected.poets.get(k));
        } else if (collected.keywords.get(k) != null) {
          type = 'keyword';
          title = collected.keywords.get(k).title;
        } else {
          type = 'subject';
          title = k;
        }
        return {
          id: k,
          type,
          title,
        };
      });
  }

  let refsArray = (collected.textrefs.get(textId) || []).map(id => {
    const meta = collected.texts.get(id);
    const poet = poetName(collected.poets.get(meta.poetId));
    const work = workName(collected.works.get(meta.poetId + '/' + meta.workId));
    return [
      [
        `${poet}: <a poem="${id}">»${meta.title}«</a> – ${work}`,
        { html: true },
      ],
    ];
  });

  const foldername = Paths.textFolder(textId);
  const prev_next = resolve_prev_next(textId);

  const rawBody = body
    .toString()
    .replace('<body>', '')
    .replace('</body>', '');
  const content_html = htmlToXml(rawBody, collected, isPoetry, isBible);
  const has_footnotes =
    rawBody.indexOf('<footnote') !== -1 || rawBody.indexOf('<note') !== -1;
  mkdirp.sync(foldername);
  const text_data = {
    poet,
    work,
    prev: prev_next.prev,
    next: prev_next.next,
    section_titles,
    text: {
      id: textId,
      title: replaceDashes(title),
      linktitle: replaceDashes(linktitle),
      subtitles,
      is_prose: text.name() === 'prose',
      has_footnotes,
      notes: get_notes(head),
      keywords: keywordsArray || [],
      refs: refsArray,
      pictures: get_pictures(head),
      content_lang: poet.lang,
      content_html,
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

  const handle_section = (section, resolve_prev_next, section_titles) => {
    let poems = [];
    let proses = [];
    let toc = [];

    const extractTocTitle = head => {
      const firstline = safeGetText(head, 'firstline');
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
          title: htmlToXml(parts[2]),
        };
      } else {
        return { title: htmlToXml(titleToUse) };
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
          title: toctitle.title,
          prefix: replaceDashes(toctitle.prefix),
        });
        handle_text(
          poetId,
          workId,
          part,
          true,
          resolve_prev_next,
          section_titles
        );
      } else if (partName === 'section') {
        const head = part.get('head');
        const level = parseInt(safeGetAttr(head, 'level') || '1');
        const toctitle = extractTocTitle(head);
        const subtoc = handle_section(part.get('content'), resolve_prev_next, [
          ...section_titles,
          toctitle.title[0][0],
        ]);
        toc.push({
          type: 'section',
          level: level,
          title: toctitle.title,
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
          title: toctitle.title,
          prefix: toctitle.prefix,
        });
        handle_text(
          poetId,
          workId,
          part,
          false,
          resolve_prev_next,
          section_titles
        );
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

  // Create function to resolve prev/next links in texts
  const resolve_prev_next = (function() {
    const items = workbody.find('//poem|//prose').map(part => {
      const textId = part.attr('id').value();
      const head = part.get('head');
      const title = head.get('title') ? head.get('title').text() : null;
      return { id: textId, title: title };
    });
    return textId => {
      const index = items.findIndex(x => {
        return x.id === textId;
      });
      let prev = null,
        next = null;
      if (index < items.length - 1) {
        next = items[index + 1];
      }
      if (index > 0) {
        prev = items[index - 1];
      }
      return { prev, next };
    };
  })();

  const toc = handle_section(workbody, resolve_prev_next, []);
  return { lines, toc, notes, pictures };
};

// Constructs collected.works and collected.texts to
// be used for resolving <xref poem="">, etc.
const works_first_pass = collected => {
  let texts = new Map(loadCachedJSON('collected.texts') || []);
  let works = new Map(loadCachedJSON('collected.works') || []);
  let found_changes = false;
  const force_reload = texts.size === 0 || works.size === 0;
  collected.workids.forEach((workIds, poetId) => {
    workIds.forEach(workId => {
      const workFilename = `fdirs/${poetId}/${workId}.xml`;
      if (!force_reload && !isFileModified(workFilename)) {
        return;
      } else {
        found_changes = true;
      }

      let doc = loadXMLDoc(workFilename);
      const work = doc.get('//kalliopework');
      const attrId = work.attr('id').value();
      if (attrId !== workId) {
        throw new Error(`${workFilename} has wrong id in <kalliopework>`);
      }
      const head = work.get('workhead');
      const title = head.get('title').text();
      const year = head.get('year').text();
      // Sanity check
      if (work.attr('author').value() !== poetId) {
        throw new Error(
          `fdirs/${poetId}/${workId}.xml has wrong author-attribute in <kalliopework>`
        );
      }
      works.set(`${poetId}/${workId}`, {
        title: replaceDashes(title),
        year: year,
        has_content: work.find('//poem|//prose').length > 0,
      });

      work.find('//poem|//prose').forEach(part => {
        const textId = part.attr('id').value();
        const head = part.get('head');
        const title = safeGetText(head, 'title');
        const firstline = safeGetText(head, 'firstline');
        const linktitle = safeGetText(head, 'linktitle');
        const linkTitle = linktitle || title || firstline;
        texts.set(textId, {
          title: replaceDashes(linkTitle),
          type: part.name(),
          poetId: poetId,
          workId: workId,
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

const works_second_pass = collected => {
  collected.poets.forEach((poet, poetId) => {
    safeMkdir(`static/api/${poetId}`);

    collected.workids.get(poetId).forEach(workId => {
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

const build_textrefs = collected => {
  let textrefs = new Map(loadCachedJSON('collected.textrefs') || []);
  const force_reload = textrefs.size == 0;
  let found_changes = false;
  const regexps = [
    /xref\s.*?poem="([^"]*)"/g,
    /a\s.*?poem="([^"]*)"/g,
    /xref bibel="([^",]*)/g,
  ];
  collected.poets.forEach((poet, poetId) => {
    collected.workids.get(poetId).forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!force_reload && !isFileModified(filename)) {
        return;
      } else {
        found_changes = true;
      }
      let doc = loadXMLDoc(filename);
      const texts = doc.find('//poem|//prose');
      texts.forEach(text => {
        const notes = text.find('head/notes/note|body//footnote|body//note');
        notes.forEach(note => {
          regexps.forEach(regexp => {
            while ((match = regexp.exec(note.toString())) != null) {
              const fromId = text.attr('id').value();
              const toId = match[1];
              const array = textrefs.get(toId) || [];
              if (array.indexOf(fromId) === -1) {
                array.push(fromId);
              }
              textrefs.set(toId, array);
            }
          });
        });
      });
    });
  });
  if (found_changes) {
    writeCachedJSON('collected.textrefs', Array.from(textrefs));
  }
  return textrefs;
};

const build_person_or_keyword_refs = collected => {
  let person_or_keyword_refs = new Map(
    loadCachedJSON('collected.person_or_keyword_refs') || []
  );
  const force_reload = person_or_keyword_refs.size == 0;
  let found_changes = false;
  const regexps = [
    /xref ()poem="([^"]*)"/g,
    /a ()poem="([^"]*)"/g,
    /xref type="([^"]*)" poem="([^"]*)"/g,
    /a type="([^"]*)" poem="([^"]*)"/g,
    /xref ()bibel="([^",]*)/g,
  ];
  // toKey is a poet id or a keyword id
  const register = (filename, toKey, fromPoemId, type) => {
    const collection = person_or_keyword_refs.get(toKey) || {
      mention: [],
      translation: [],
    };
    if (type === 'mention') {
      if (
        collection.mention.indexOf(fromPoemId) === -1 &&
        collection.translation.indexOf(fromPoemId) === -1
      ) {
        collection.mention.push(fromPoemId);
      }
    } else if (type === 'translation') {
      const mentionIndex = collection.mention.indexOf(fromPoemId);
      if (mentionIndex > -1) {
        collection.mention.splice(mentionIndex, 1);
      }
      if (collection.translation.indexOf(fromPoemId) === -1) {
        collection.translation.push(fromPoemId);
      }
    } else {
      throw new Error(`${filename} has xref with unknown type ${type}`);
    }
    person_or_keyword_refs.set(toKey, collection);
  };
  collected.workids.forEach((workIds, poetId) => {
    workIds.forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!force_reload && !isFileModified(filename)) {
        return;
      } else {
        found_changes = true;
      }
      let doc = loadXMLDoc(filename);
      const texts = doc.find('//poem|//prose');
      texts.forEach(text => {
        const fromId = text.attr('id').value();
        const notes = text.find('head/notes/note|body//footnote|body//note');
        notes.forEach(note => {
          regexps.forEach(regexp => {
            while ((match = regexp.exec(note.toString())) != null) {
              const refType = match[1] || 'mention';
              const toPoemId = match[2].replace(/,.*$/, '');
              const toText = collected.texts.get(toPoemId);
              if (toText != null) {
                const toPoetId = toText.poetId;
                if (toPoetId !== poetId) {
                  // Skip self-refs
                  register(filename, toPoetId, fromId, refType);
                }
              } else {
                throw new Error(
                  `${filename} points to unknown text ${toPoemId}`
                );
              }
            }
          });
        });
        const head = text.get('head');
        const keywords = safeGetText(head, 'keywords') || '';
        if (keywords.trim().length > 0) {
          keywords.split(',').forEach(keyword => {
            register(filename, keyword, fromId, 'mention');
          });
        }
      });
    });
  });
  if (found_changes) {
    writeCachedJSON(
      'collected.person_or_keyword_refs',
      Array.from(person_or_keyword_refs)
    );
  }
  collected.person_or_keyword_refs = person_or_keyword_refs;
};

const build_works_toc = collected => {
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
            title: parts[2],
          };
        } else {
          return { title: titleToUse };
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
            title: htmlToXml(toctitle.title),
            prefix: replaceDashes(toctitle.prefix),
          });
        } else if (partName === 'section') {
          const subtoc = handle_section(part.get('content'));
          const head = part.get('head');
          const level = parseInt(safeGetAttr(part, 'level') || '1');
          const toctitle = extractTocTitle(head);
          toc.push({
            type: 'section',
            level: level,
            title: htmlToXml(toctitle.title),
            content: subtoc,
          });
        } else if (partName === 'prose') {
          const textId = part.attr('id').value();
          const head = part.get('head');
          const toctitle = extractTocTitle(head);
          if (toctitle == null) {
            throw `${textId} mangler title og toctitle i ${poetId}/${workId}.xml`;
          }
          toc.push({
            type: 'text',
            id: textId,
            title: htmlToXml(toctitle.title),
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

  collected.poets.forEach((poet, poetId) => {
    safeMkdir(`static/api/${poetId}`);

    collected.workids.get(poetId).forEach(workId => {
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

const build_poet_works_json = collected => {
  collected.poets.forEach((poet, poetId) => {
    safeMkdir(`static/api/${poetId}`);

    const filenames = collected.workids
      .get(poetId)
      .map(workId => `fdirs/${poetId}/${workId}.xml`);
    if (!isFileModified(`data/poets.xml:${poetId}`, ...filenames)) {
      return;
    }

    let collectedHeaders = [];
    collected.workids.get(poetId).forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;

      // Copy the xml-file into static to allow for xml download.
      fs
        .createReadStream(filename)
        .pipe(fs.createWriteStream(`static/api/${poetId}/${workId}.xml`));
      let doc = loadXMLDoc(filename);
      const work = doc.get('//kalliopework');
      const head = work.get('workhead');
      const body = work.get('workbody');
      const data = {
        id: workId,
        title: head.get('title').text(),
        year: head.get('year').text(),
        has_content: body != null && body.find('//poem|//prose').length > 0,
        status: work.attr('status').value(),
        type: work.attr('type').value(),
      };
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

const build_poet_lines_json = collected => {
  collected.poets.forEach((poet, poetId) => {
    const filenames = collected.workids
      .get(poetId)
      .map(workId => `fdirs/${poetId}/${workId}.xml`);
    if (!isFileModified(`data/poets.xml:${poetId}`, ...filenames)) {
      return;
    }

    safeMkdir(`static/api/${poetId}`);

    let collectedLines = [];
    collected.workids.get(poetId).forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      let doc = loadXMLDoc(filename);
      if (doc == null) {
        console.log("Couldn't load", filename);
      }
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
    const linesOutFilename = `static/api/${poetId}/texts.json`;
    console.log(linesOutFilename);
    writeJSON(linesOutFilename, data);
  });
};

const build_keywords = () => {
  safeMkdir('static/api/keywords');
  let collected_keywords = new Map(loadCachedJSON('collected.keywords') || []);
  const folder = 'data/keywords';
  const filenames = fs
    .readdirSync(folder)
    .filter(x => x.endsWith('.xml'))
    .map(x => `${folder}/${x}`);
  if (collected_keywords.size === 0 || isFileModified(...filenames)) {
    collected_keywords = new Map();
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
      const is_draft =
        keyword.attr('draft') != null
          ? keyword.attr('draft').value() === 'true'
          : false;
      const title = head.get('title').text();
      const pictures = get_pictures(head);
      const author = safeGetText(head, 'author');
      const rawBody = body
        .toString()
        .replace('<body>', '')
        .replace('</body>', '');
      const content_html = htmlToXml(rawBody, collected);
      const has_footnotes =
        rawBody.indexOf('<footnote') !== -1 || rawBody.indexOf('<note') !== -1;
      const data = {
        id,
        title,
        is_draft,
        author,
        pictures,
        has_footnotes,
        content_lang: 'da',
        content_html,
      };
      keywords_toc.push({
        id,
        title,
        is_draft,
      });
      const outFilename = `static/api/keywords/${id}.json`;
      console.log(outFilename);
      writeJSON(outFilename, data);
      collected_keywords.set(id, { id, title });
    });
    writeCachedJSON('collected.keywords', Array.from(collected_keywords));
    const outFilename = `static/api/keywords.json`;
    console.log(outFilename);
    writeJSON(outFilename, keywords_toc);
  }
  return collected_keywords;
};

const build_news = collected => {
  ['da', 'en'].forEach(lang => {
    const path = `data/news_${lang}.xml`;
    if (!isFileModified(path)) {
      return;
    }
    const doc = loadXMLDoc(path);
    const items = doc.get('//items');
    let list = [];
    items.childNodes().forEach(item => {
      if (item.name() !== 'item') {
        return;
      }
      const date = item.get('date').text();
      const body = item.get('body');
      const title = safeGetText(item, 'title');
      list.push({
        date,
        title,
        content_lang: lang,
        content_html: htmlToXml(
          body
            .toString()
            .replace('<body>', '')
            .replace('</body>', '')
            .trim(),
          collected
        ),
      });
    });
    const outfile = `static/api/news_${lang}.json`;
    writeJSON(outfile, list);
    console.log(outfile);
  });
};

const build_dict_first_pass = collected => {
  const path = `data/dict.xml`;
  if (!isFileModified(path)) {
    collected.dict = new Map(loadCachedJSON('collected.dict'));
    return;
  }

  safeMkdir('static/api/dict');
  const doc = loadXMLDoc(path);
  doc
    .get('//entries')
    .childNodes()
    .forEach(item => {
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
    const content_html = htmlToXml(
      body
        .toString()
        .replace('<forkl>', '')
        .replace('</forkl>', ''),
      collected
    );
    const has_footnotes =
      content_html.indexOf('<footnote') !== -1 ||
      content_html.indexOf('<note') !== -1;
    const data = {
      item: {
        id,
        title,
        phrase,
        variants,
        has_footnotes,
        content_html,
      },
    };
    writeJSON(`static/api/dict/${id}.json`, data);
    const simpleData = {
      id,
      title,
    };
    items.push(simpleData);
  };

  const doc = loadXMLDoc(path);
  doc
    .get('//entries')
    .childNodes()
    .forEach(item => {
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

const build_mentions_json = collected => {
  const build_html = poemId => {
    const meta = collected.texts.get(poemId);
    const poet = poetName(collected.poets.get(meta.poetId));
    const work = workName(collected.works.get(meta.poetId + '/' + meta.workId));
    return [
      [
        `${poet}: <a poem="${poemId}">»${meta.title}«</a> – ${work}`,
        { html: true },
      ],
    ];
  };
  collected.poets.forEach((poet, poetId) => {
    if (!poet.has_mentions) {
      return;
    }
    safeMkdir(`static/api/${poet.id}`);
    let data = { poet, mentions: [], translations: [] };
    const refs = collected.person_or_keyword_refs.get(poetId);
    data.mentions = refs.mention.map(build_html);
    data.translations = refs.translation.map(build_html);
    const outFilename = `static/api/${poet.id}/mentions.json`;
    console.log(outFilename);
    writeJSON(outFilename, data);
  });
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
            line
              .toString()
              .replace('<item>', '')
              .replace('</item>', ''),
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

const build_about_pages = collected => {
  safeMkdir(`static/api/about`);
  // Regenerate all about-pages if any work-file is modified, since our poem-counts then might be off
  const areAnyWorkModified = Array.from(collected.works.keys())
    .filter(key => {
      return isFileModified(`fdirs/${key}.xml`);
    })
    .reduce((result, b) => b || result, false);
  const arePoetsModified = isFileModified('data/poets.xml');
  const folder = 'data/about';
  const filenames = fs
    .readdirSync(folder)
    .filter(x => x.endsWith('.xml'))
    .map(x => {
      return {
        xml: `${folder}/${x}`,
        json: `static/api/about/${x.replace(/.xml$/, '.json')}`,
      };
    })
    .filter(
      paths =>
        isFileModified(paths.xml) || arePoetsModified || areAnyWorkModified
    )
    .forEach(paths => {
      let lang = 'da';
      const m = paths.xml.match(/_(..)\.xml$/);
      if (m) {
        lang = m[1];
      }
      const doc = loadXMLDoc(paths.xml);
      const about = doc.get('//about');
      const head = about.get('head');
      const body = about.get('body');
      const title = head.get('title').text();
      const pictures = get_pictures(head);
      const author = safeGetText(head, 'author');
      const poemsNum = Array.from(collected.texts.values())
        .map(t => (t.type === 'poem' ? 1 : 0))
        .reduce((sum, v) => sum + v, 0);
      const poetsNum = Array.from(collected.poets.values())
        .map(t => (t.type === 'poet' ? 1 : 0))
        .reduce((sum, v) => sum + v, 0);
      const notes = get_notes(head, {
        poemsNum: poemsNum.toLocaleString(lang),
        poetsNum: poetsNum.toLocaleString(lang),
        worksNum: collected.works.size.toLocaleString(lang),
        langsNum: 8 - 1, // gb og us er begge engelsk.
      });
      // Data er samme format som keywords
      const data = {
        id: paths.xml,
        title,
        author,
        has_footnotes: false,
        pictures,
        notes,
        content_lang: 'da',
        content_html: htmlToXml(
          body
            .toString()
            .replace('<body>', '')
            .replace('</body>', ''),
          collected
        ),
      };
      console.log(paths.json);
      writeJSON(paths.json, data);
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

const build_redirects_json = collected => {
  if (!isFileModified('data/poets.xml')) {
    return;
  }
  let redirects = {};
  collected.poets.forEach((poet, poetId) => {
    if (!poet.has_works) {
      redirects[`/en/works/${poetId}`] = `/en/bio/${poetId}`;
      redirects[`/da/works/${poetId}`] = `/da/bio/${poetId}`;
    }
  });
  writeJSON('static/api/redirects.json', redirects);
};

const build_todays_events_json = collected => {
  const portrait_descriptions = Array.from(collected.poets.values()).map(
    poet => {
      return `fdirs/${poet.id}/portraits.xml`;
    }
  );
  if (!isFileModified(`data/poets.xml`, ...portrait_descriptions)) {
    return;
  }

  const langs = ['da', 'en'];

  safeMkdir('static/api/today');
  langs.forEach(lang => {
    safeMkdir(`static/api/today/${lang}`);
  });

  const collected_events = new Map();

  const add_event = (lang, monthAndDay, event) => {
    const key = `${lang}-${monthAndDay}`;
    let items = collected_events.get(key) || [];
    items.push(event);
    collected_events.set(key, items);
  };

  collected.poets.forEach((poet, poetId) => {
    if (poet.period != null) {
      const born = poet.period.born;
      const dead = poet.period.dead;
      if (born != null && born.date != null) {
        const m = born.date.match(/(\d\d\d\d)-(\d\d-\d\d)/);
        if (m != null) {
          const year = m[1];
          const monthAndDay = m[2];
          langs.forEach(lang => {
            content_html = `<a poet="${poetId}">${poetName(poet)}</a>`;
            content_html += lang === 'da' ? ' født' : ' born';
            if (born.place != null) {
              content_html += `, ${born.place}.`;
            } else {
              content_html += '.';
            }
            content_html = content_html.replace(/\.+$/, '.');
            add_event(lang, monthAndDay, {
              type: 'text',
              content_html: [[content_html, { html: true }]],
              content_lang: lang,
              date: born.date,
              context: { event_type: 'born', year, poet },
            });
          });
        }
      }
      if (dead != null && dead.date != null) {
        const m = dead.date.match(/(\d\d\d\d)-(\d\d-\d\d)/);
        if (m != null) {
          const year = m[1];
          const monthAndDay = m[2];
          langs.forEach(lang => {
            content_html = `<a poet="${poetId}">${poetName(poet)}</a>`;
            content_html += lang === 'da' ? ' død' : ' dead';
            if (dead.place != null) {
              content_html += `, ${dead.place}.`;
            } else {
              content_html += '.';
            }
            content_html = content_html.replace(/\.+$/, '.');
            add_event(lang, monthAndDay, {
              type: 'text',
              content_html: [[content_html, { html: true }]],
              date: dead.date,
              content_lang: lang,
              context: { event_type: 'dead', year, poet },
            });
          });
        }
      }
    }
  });

  langs.forEach(lang => {
    const preferredCountries =
      lang === 'da' ? ['se', 'de', 'dk'] : ['us', 'gb']; // Større index er større vægt
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? '0' + d : d;
        const mm = m < 10 ? '0' + m : m;
        const events = collected_events.get(`${lang}-${mm}-${dd}`) || [];
        if (events.filter(e => e.type === 'image').length === 0) {
          // There are no images from events in today.xml. Find the most relevant poet portrait.
          const weighted = events
            .filter(e => e.context.poet.has_portraits)
            .map(event => {
              const poet = event.context.poet;
              let weight = 0;
              weight += poet.has_portraits ? 12 : 6; // TODO: Find the one with a portrait description
              weight += poet.has_texts ? 10 : 5;
              weight += poet.has_works ? 6 : 3;
              weight += preferredCountries.indexOf(poet.country);
              weight += event.context.event_type === 'born' ? 3 : 0; // Foretræk fødselsdage
              return {
                weight,
                event,
              };
            })
            .sort((a, b) => (a.weight < b.weight ? 1 : -1));
          if (weighted.length > 0) {
            const event = weighted[0].event;
            const poet = event.context.poet;
            let content_html = null;
            const primary_portrait = build_portrait_json(poet, collected);
            if (
              primary_portrait != null &&
              primary_portrait.content_html[0][0].length > 0
            ) {
              content_html = primary_portrait.content_html;
            } else {
              content_html = [[poetName(poet)]];
            }
            if (primary_portrait != null) {
              const data = {
                type: 'image',
                src: `images/${poet.id}/${primary_portrait.src}`,
                content_html,
                content_lang: lang,
                date: event.date,
              };
              add_event(lang, `${mm}-${dd}`, data);
            }
          }
        }
      }
    }
  });

  langs.forEach(lang => {
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? '0' + d : d;
        const mm = m < 10 ? '0' + m : m;
        const events = collected_events.get(`${lang}-${mm}-${dd}`) || [];
        const path = `static/api/today/${lang}/${mm}-${dd}.json`;
        console.log(path);
        writeJSON(path, events);
      }
    }
  });
};

const build_image_thumbnails = () => {
  const resize = (inputfile, outputfile, maxWidth) => {
    sharp(inputfile)
      .resize(maxWidth, 10000)
      .max()
      .withoutEnlargement()
      .toFile(outputfile, function(err) {
        if (err != null) {
          console.log(err);
        }
        console.log(outputfile);
      });
  };

  const pipeJoinedExts = CommonData.availableImageFormats.join('|');
  const skipRegExps = new RegExp(`-w\\d+\\.(${pipeJoinedExts})$`);

  const handleDirRecursive = dirname => {
    fs.readdirSync(dirname).forEach(filename => {
      const fullFilename = path.join(dirname, filename);
      const stats = fs.statSync(fullFilename);
      if (stats.isDirectory()) {
        handleDirRecursive(fullFilename);
      } else if (
        stats.isFile() &&
        filename.endsWith('.jpg') &&
        !skipRegExps.test(filename)
      ) {
        CommonData.availableImageFormats.forEach((ext, i) => {
          CommonData.availableImageWidths.forEach(width => {
            const outputfile = fullFilename
              .replace(/\.jpg$/, `-w${width}.${ext}`)
              .replace(/\/([^\/]+)$/, '/t/$1');
            safeMkdir(outputfile.replace(/\/[^\/]+?$/, ''));
            if (isFileModified(fullFilename) || !fileExists(outputfile)) {
              resize(fullFilename, outputfile, width);
            }
          });
        });
      }
    });
  };

  handleDirRecursive('static/images');
  handleDirRecursive('static/kunst');
};

const build_sitemap_xml = collected => {
  safeMkdir(`static/sitemaps`);

  const write_sitemap = (filename, urls) => {
    let xmlUrls = urls.map(url => {
      return `  <url><loc>${url}</loc></url>`;
    });
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += xmlUrls.join('\n');
    xml += '\n</urlset>\n';
    writeText(filename, xml);
  };

  let urls = [];
  ['da', 'en'].forEach(lang => {
    urls.push(`https://kalliope.org/${lang}/`);
    urls.push(`https://kalliope.org/${lang}/keywords`);
    collected.keywords.forEach((keyword, keywordId) => {
      urls.push(`https://kalliope.org/${lang}/keyword/${keywordId}`);
    });
    collected.poets.forEach((poet, poetId) => {
      urls.push(`https://kalliope.org/${lang}/bio/${poetId}`);
      if (poet.has_bibliography) {
        urls.push(`https://kalliope.org/${lang}/bibliography/${poetId}`);
      }
    });
  });
  write_sitemap('static/sitemaps/global.xml', urls);

  collected.poets.forEach((poet, poetId) => {
    const filenames = collected.workids
      .get(poetId)
      .map(workId => `fdirs/${poetId}/${workId}.xml`);
    if (!isFileModified(...filenames)) {
      return;
    }
    const poet_text_urls = [];
    ['da', 'en'].forEach(lang => {
      if (poet.has_works) {
        poet_text_urls.push(`https://kalliope.org/${lang}/works/${poetId}`);
      }
      if (poet.has_poems) {
        poet_text_urls.push(
          `https://kalliope.org/${lang}/texts/${poetId}/titles`
        );
        poet_text_urls.push(
          `https://kalliope.org/${lang}/texts/${poetId}/first`
        );
      }
      collected.workids.get(poetId).forEach(workId => {
        const work = collected.works.get(`${poetId}/${workId}`);
        if (work.has_content) {
          poet_text_urls.push(
            `https://kalliope.org/${lang}/work/${poetId}/${workId}`
          );
          const filename = `fdirs/${poetId}/${workId}.xml`;
          let doc = loadXMLDoc(filename);
          if (doc == null) {
            console.log("Couldn't load", filename);
          }
          doc.find('//poem|//prose').forEach(part => {
            const textId = part.attr('id').value();
            poet_text_urls.push(`https://kalliope.org/${lang}/text/${textId}`);
          });
        }
      });
    });
    write_sitemap(`static/sitemaps/${poetId}.xml`, poet_text_urls);
  });

  const sitemaps_urls_xml = Array.from(collected.poets.values())
    .filter(poet => poet.has_works)
    .map(poet => {
      return `https://kalliope.org/static/sitemaps/${poet.id}.xml`;
    })
    .map(url => {
      return `  <sitemap><loc>${url}</loc></sitemap>`;
    });
  sitemaps_urls_xml.push(
    `  <sitemap><loc>https://kalliope.org/static/sitemaps/global.xml</loc></sitemap>`
  );
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml +=
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">>\n';
  xml += sitemaps_urls_xml.join('\n');
  xml += '\n</sitemapindex>\n';
  writeText('static/sitemap.xml', xml);
};

const update_elasticsearch = collected => {
  const inner_update_elasticsearch = () => {
    collected.poets.forEach((poet, poetId) => {
      collected.workids.get(poetId).forEach(workId => {
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
        const workData = {
          id: workId,
          title,
          year,
          status,
          type,
        };
        const data = {
          poet,
          work: workData,
        };

        elasticSearchClient.create(
          'kalliope',
          'work',
          `${poetId}-${workId}`,
          data
        );
        doc.find('//poem|//prose').forEach(text => {
          const textId = text.attr('id').value();
          const head = text.get('head');
          const body = text.get('body');
          const title =
            safeGetText(head, 'linktitle') ||
            safeGetText(head, 'title') ||
            safeGetText(head, 'firstline');
          const keywords = head.get('keywords');
          let subtitles = null;
          const subtitle = head.get('subtitle');
          if (subtitle && subtitle.find('line').length > 0) {
            subtitles = subtitle.find('line').map(s =>
              replaceDashes(
                s
                  .toString()
                  .replace('<line>', '')
                  .replace('</line>', '')
                  .replace('<line/>', '')
              )
            );
          } else if (subtitle) {
            const subtitleString = subtitle
              .toString()
              .replace('<subtitle>', '')
              .replace('</subtitle>', '');
            if (subtitleString.indexOf('<subtitle/>') === -1) {
              subtitles = [replaceDashes(subtitleString)];
            }
          }
          let keywordsArray = null;
          if (keywords) {
            keywordsArray = keywords.text().split(',');
          }

          const textData = {
            id: textId,
            title: replaceDashes(title),
            subtitles,
            is_prose: text.name() === 'prose',
            keywords: keywordsArray,
            content_html: htmlToXml(
              body
                .toString()
                .replace('<body>', '')
                .replace('</body>', '')
                .replace(/<note>.*?<\/note>/g, '')
                .replace(/<footnote>.*?<\/footnote>/g, '')
                .replace(/<.*?>/g, ' '),
              collected,
              text.name() === 'poem'
            )
              .map(line => line[0])
              .join(' ')
              .replace(/<.*?>/g, ' '),
          };
          const data = {
            poet,
            work: workData,
            text: textData,
          };
          elasticSearchClient.create('kalliope', 'text', textId, data);
        });
      });
    });
  };

  elasticSearchClient
    .createIndex('kalliope')
    .then(() => {
      try {
        inner_update_elasticsearch();
      } catch (error) {
        console.log(error);
      }
    })
    .catch(error => {
      console.log('Elasticsearch server not found on localhost:9200.');
      //console.log(error);
    });
};

safeMkdir(`static/api`);
collected.workids = b('build_poet_workids', build_poet_workids);
// Build collected.works and collected.texts
Object.assign(collected, b('works_first_pass', works_first_pass, collected));
b('build_person_or_keyword_refs', build_person_or_keyword_refs, collected);
collected.poets = b('build_poets_json', build_poets_json);
b('build_mentions_json', build_mentions_json, collected);
b('build_bibliography_json', build_bibliography_json, collected);
collected.textrefs = b('build_textrefs', build_textrefs, collected);
build_dict_first_pass(collected);
collected.keywords = b('build_keywords', build_keywords);
b('build_poet_lines_json', build_poet_lines_json, collected);
b('build_poet_works_json', build_poet_works_json, collected);
b('works_second_pass', works_second_pass, collected);
b('build_works_toc', build_works_toc, collected);
collected.timeline = build_global_timeline(collected);
b('build_bio_json', build_bio_json, collected);
b('build_news', build_news, collected);
b('build_about_pages', build_about_pages, collected);
b('build_dict_second_pass', build_dict_second_pass, collected);
b('build_todays_events_json', build_todays_events_json, collected);
b('build_redirects_json', build_redirects_json, collected);
b('build_sitemap_xml', build_sitemap_xml, collected);

b('build_image_thumbnails', build_image_thumbnails);
b('update_elasticsearch', update_elasticsearch, collected);

refreshFilesModifiedCache();
print_benchmarking_results();
