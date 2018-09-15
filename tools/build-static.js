const fs = require('fs');
const path = require('path');
const libxml = require('libxmljs');
const mkdirp = require('mkdirp');
const Paths = require('../pages/helpers/paths.js');
const entities = require('entities');
const elasticSearchClient = require('./libs/elasticsearch-client.js');
const CommonData = require('../pages/helpers/commondata.js');
const ics = require('ics');

const {
  isFileModified,
  markFileDirty,
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
  imageSizeSync,
  buildThumbnails,
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
  if (poet == null) {
    throw 'poetName called with null poet';
  }
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
    let data = {
      date,
      type,
      is_history_item: true,
    };
    if (type === 'image') {
      const onError = message => {
        throw `${filename}: ${message}`;
      };
      const pictureNode = event.get('picture');
      if (pictureNode == null) {
        onError('indeholder event med type image uden <picture>');
      }
      const picture = get_picture(pictureNode, '/static', collected, onError);
      data.src = picture.src;
      data.content_lang = picture.content_lang;
      data.lang = picture.lang;
      data.content_html = picture.content_html;
    } else {
      data.content_lang = 'da';
      data.lang = 'da';
      const html = event.get('html');
      data.content_html = htmlToXml(
        html
          .toString()
          .replace('<html>', '')
          .replace('</html>', '')
          .trim(),
        collected
      );
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

const museums = {
  hirschsprungske: {
    name: 'Den Hirschsprungske Samling',
  },
  skagen: {
    name: 'Skagens Museum',
  },
  thorvaldsens: {
    url: 'http://thorvaldsensmuseum.dk/samlingerne/vaerk/$invNr',
    name: 'Thorvaldsens Museum',
  },
  nivaagaard: {
    url: 'http://www.nivaagaard.dk/samling-da/$objId',
    name: 'Nivaagaards Malerisamling',
  },
  kb: {
    url: 'http://www.kb.dk/images/billed/2010/okt/billeder/object$objId/da/',
    name: 'Det kongelige Bibliotek',
  },
  smk: {
    url: 'http://collection.smk.dk/#/detail/$invNr',
    name: 'Statens Museum for Kunst',
  },
  gleimhaus: {
    url: 'https://www.museum-digital.de/nat/index.php?t=objekt&oges=$objId',
    name: 'Gleimhaus, Halberstadt',
  },
  ribe: {
    url: `https://ribekunstmuseum.dk/samling/$invNr`,
    name: 'Ribe Kunstmuseum',
  },
  smb: {
    url: `http://www.smb-digital.de/eMuseumPlus?objectId=$objId`,
  },
  md: {
    url: `https://www.museum-digital.de/nat/index.php?t=objekt&oges=$objId`,
  },
  npg: {
    url: `https://www.npg.org.uk/collections/search/portrait/$objId`,
    name: 'National Portrait Gallery, London',
  },
  'natmus.se': {
    url: `http://collection.nationalmuseum.se/eMP/eMuseumPlus?service=ExternalInterface&module=collection&objectId=$objId&viewType=detailView`,
  },
  'digitalmuseum.no': {
    url: `https://digitaltmuseum.no/$objId/maleri`,
  },
  'digitalmuseum.se': {
    url: `https://digitaltmuseum.se/$objId/maleri`,
  },
};

const get_museum_json = museumId => {
  if (museumId != null && museums[museumId] != null) {
    return {
      id: museumId,
      name: museums[museumId].name,
    };
  } else {
    return null;
  }
};

const build_museum_url = picture => {
  if (picture == null) {
    return null;
  }
  const invNr = safeGetAttr(picture, 'invnr');
  const objId = safeGetAttr(picture, 'objid');
  const museum = safeGetAttr(picture, 'museum');
  if (museum != null && (invNr != null || objId != null)) {
    const museumObject = museums[museum];
    if (museumObject != null && museumObject.url != null) {
      return museumObject.url.replace('$objId', objId).replace('$invNr', invNr);
    }
  }
  return null;
};

const build_museum_link = picture => {
  const url = build_museum_url(picture);
  return url == null ? null : ` <a href="${url}">⌘</a>`;
};

const get_picture = (picture, srcPrefix, collected, onError) => {
  const primary = safeGetAttr(picture, 'primary') == 'true';
  let src = safeGetAttr(picture, 'src');
  const ref = safeGetAttr(picture, 'ref');
  const year = safeGetAttr(picture, 'year');
  const museumId = safeGetAttr(picture, 'museum');
  const remoteUrl = build_museum_url(picture);
  const museumLink = build_museum_link(picture) || '';
  if (src != null) {
    const lang = safeGetAttr(picture, 'lang') || 'da';
    if (src.charAt(0) !== '/') {
      src = srcPrefix + '/' + src;
    }
    return {
      lang,
      src,
      year,
      size: imageSizeSync(src.replace(/^\//, '')),
      remoteUrl,
      museum: get_museum_json(museumId),
      content_lang: 'da',
      content_html: htmlToXml(
        picture
          .toString()
          .replace(/<picture[^>]*?>/, '')
          .replace('</picture>', '')
          .trim() + museumLink,
        collected
      ),
      primary,
    };
  } else if (ref != null) {
    if (ref.indexOf('/') === -1) {
      onError(`fandt en ulovlig ref "${ref}" uden mappe-angivelse`);
    }
    const artwork = collected.artwork.get(ref);
    if (artwork == null) {
      onError(`fandt en ref "${ref}" som ikke matcher noget kendt billede.`);
    }
    const artist = collected.poets.get(artwork.artistId);
    const museumId = safeGetAttr(picture, 'museum');
    const remoteUrl = build_museum_url(picture);
    const description = `<a poet="${artist.id}">${poetName(artist)}</a>: ${
      artwork.content_raw
    }`;
    const extraDescription = picture
      .toString()
      .replace(/<picture[^>]*?>/, '')
      .replace('</picture>', '')
      .trim();
    if (extraDescription.length > 0) {
      description = extraDescription + '\n\n' + description;
    }
    return {
      artist,
      lang: artwork.lang,
      src: artwork.src,
      year,
      size: imageSizeSync(artwork.src.replace(/^\//, '')),
      remoteUrl,
      museum: get_museum_json(museumId),
      content_lang: artwork.content_lang,
      content_html: htmlToXml(description, collected),
      primary,
    };
  }
};

const build_portraits_json = (poet, collected) => {
  let result = [];
  if (!poet.has_portraits) {
    return result;
  }
  const doc = loadXMLDoc(`fdirs/${poet.id}/portraits.xml`);
  if (doc != null) {
    onError = message => {
      throw `fdirs/${poet.id}/portraits.xml: ${message}`;
    };
    result = doc.find('//pictures/picture').map(picture => {
      picture = get_picture(
        picture,
        `/static/images/${poet.id}`,
        collected,
        onError
      );
      if (picture == null) {
        onError('har et billede uden src- eller ref-attribut.');
      }
      return picture;
    });
    const primaries = result.filter(p => p.primary);
    if (primaries.length > 1) {
      onError('har flere primary');
    }
    if (primaries.length == 0) {
      onError('mangler primary');
    }
  }
  return result;
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
    data.portraits = build_portraits_json(poet, collected);
    const destFilename = `static/api/${poet.id}/bio.json`;
    console.log(destFilename);
    writeJSON(destFilename, data);
  });
};

// TODO: Speed this up by caching.
const build_poets_json = collected => {
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
      (mentions != null &&
        (mentions.mention.length > 0 || mentions.translation.length > 0)) ||
      fileExists(`fdirs/${id}/bibliography-primary.xml`) ||
      fileExists(`fdirs/${id}/bibliography-secondary.xml`);

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
      has_artwork: fs.existsSync(`fdirs/${id}/artwork.xml`),
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

const get_pictures = (head, srcPrefix, xmlFilename, collected) => {
  const onError = message => {
    throw `${xmlFilename}: ${message}`;
  };
  return head.find('pictures/picture').map(p => {
    return get_picture(p, srcPrefix, collected, onError);
  });
};

const resolve_variants_cache = {};
const resolve_variants = poemId => {
  const variantIds = collected.variants.get(poemId);
  if (variantIds == null || variantIds.length == 0) {
    return null;
  }
  let result = resolve_variants_cache[poemId];
  if (result != null) {
    return result;
  }

  // Deep dive through variants-graph
  let seen_variants = new Set();
  const recurse = variantId => {
    if (seen_variants.has(variantId)) {
      return;
    } else {
      seen_variants.add(variantId);
      const variantIds = collected.variants.get(variantId);
      variantIds.forEach(variantId => {
        recurse(variantId);
      });
    }
  };
  recurse(poemId);

  // Cache and return sorted poemIds
  result = Array.from(seen_variants).sort((a, b) => {
    const metaA = collected.texts.get(a);
    const metaB = collected.texts.get(b);
    const workA = collected.works.get(metaA.poetId + '/' + metaA.workId);
    const workB = collected.works.get(metaB.poetId + '/' + metaB.workId);
    return workA.year > workB.year ? 1 : -1;
  });
  resolve_variants_cache[poemId] = result;
  return result;
};

const handle_text = (
  poetId,
  workId,
  text,
  textType, // poem, prose, section
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
  const firstline = extractTitle(head, 'firstline');
  let title = extractTitle(head, 'title') || firstline; // {title: xxx, prefix: xxx}
  let indextitle = extractTitle(head, 'indextitle') || title;
  let linktitle = extractTitle(head, 'linktitle') || indextitle || title;

  const keywords = head.get('keywords');
  const isBible = poetId === 'bibel';
  const isFolkevise = poetId === 'folkeviser' || (poetId === 'tasso' && workId === '1581');

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

  const variantsArray = (resolve_variants(textId) || [])
    .filter(id => {
      // Skip self
      return id !== textId;
    })
    .map(id => {
      const meta = collected.texts.get(id);
      const poet = poetName(collected.poets.get(meta.poetId));
      const work = workName(
        collected.works.get(meta.poetId + '/' + meta.workId)
      );
      return [
        [
          `${poet}: <a poem="${id}">»${meta.title}«</a> – ${work}`,
          { html: true },
        ],
      ];
    });

  const foldername = Paths.textFolder(textId);
  const prev_next = resolve_prev_next(textId);

  const sourceNode = head.get('source');
  let source = null;
  let workSource = null;
  if (sourceNode != null) {
    const sourceId = safeGetAttr(sourceNode, 'in') || 'default';
    workSource = work.sources[sourceId];
    if (workSource == null) {
      throw new Error(
        `fdirs/${poetId}/${workId}.xml ${textId} references undefined source.`
      );
    }
    let pages = null;
    const pagesAttr = safeGetAttr(sourceNode, 'pages');
    let sourceBookRef = workSource ? workSource.source : null;
    if (sourceNode.text().trim().length > 0) {
      sourceBookRef = sourceNode
        .toString()
        .replace(/<source[^>]*>/, '')
        .replace(/<\/source>/, '');
    }
    const facsimile =
      safeGetAttr(sourceNode, 'facsimile') ||
      (workSource ? workSource.facsimile : null);
    let facsimilePages = safeGetAttr(sourceNode, 'facsimile-pages');
    if (
      facsimilePages == null &&
      workSource != null &&
      workSource.facsimilePagesOffset != null &&
      pagesAttr != null
    ) {
      // Deduce facsimilePages from pages and facsimilePagesOffset.
      const pagesParts = pagesAttr.split(/-/).map(n => parseInt(n));
      const pFrom = pagesParts[0] + workSource.facsimilePagesOffset;
      const pTo = (pagesParts[1] || pFrom) + workSource.facsimilePagesOffset;
      facsimilePages = [pFrom, pTo];
    } else if (facsimilePages != null) {
      const pagesParts = facsimilePages.split(/-/).map(n => parseInt(n));
      const pFrom = pagesParts[0];
      const pTo = pagesParts[1] || pFrom;
      facsimilePages = [pFrom, pTo];
    }
    source = {
      source: sourceBookRef,
      pages: pagesAttr,
      facsimilePageCount: workSource.facsimilePageCount,
      facsimile,
      facsimilePages,
    };
  } else if (workSource != null) {
    // Dette er ikke nødvendigvis en fejl.
    console.log(`fdirs/${poetId}/${workId}: teksten ${textId} mangler source.`);
  }
  let content_html = null;
  let has_footnotes = false;
  let toc = null;
  if (textType === 'section') {
    // A linkable section with id
    if (title == null) {
      throw `fdirs/${poetId}/${workId}: section ${textId} mangler title.`;
    }
    const content = text.get('content');
    toc = build_section_toc(content);
  } else {
    // prose or poem
    const body = text.get('body');
    const rawBody = body
      .toString()
      .replace('<body>', '')
      .replace('</body>', '');
    content_html = htmlToXml(
      rawBody,
      collected,
      textType === 'poem',
      isBible,
      isFolkevise
    );
    has_footnotes =
      rawBody.indexOf('<footnote') !== -1 || rawBody.indexOf('<note') !== -1;
  }
  mkdirp.sync(foldername);
  const text_data = {
    poet,
    work,
    prev: prev_next.prev,
    next: prev_next.next,
    section_titles,
    text: {
      id: textId,
      title: replaceDashes(title.title),
      title_prefix: title.prefix,
      linktitle: replaceDashes(linktitle.title),
      subtitles,
      is_prose: text.name() === 'prose',
      text_type: textType,
      has_footnotes,
      notes: get_notes(head),
      source,
      keywords: keywordsArray || [],
      refs: refsArray,
      variants: variantsArray,
      pictures: get_pictures(
        head,
        `/static/images/${poetId}`,
        `fdirs/${poetId}/${workId}.xml:${textId}`,
        collected
      ),
      content_lang: poet.lang,
      content_html,
      toc,
    },
  };
  console.log(Paths.textPath(textId));
  writeJSON(Paths.textPath(textId), text_data);
};

// Returns raw {title: string, prefix?: string}
// Both can be converted to xml using htmlToXml(...)
const extractTitle = (head, type) => {
  const element = head.get(type);
  if (element == null) {
    return null;
  }
  let title = element.toString();
  title = entities
    .decodeHTML(title)
    .replace('<' + type + '>', '')
    .replace('</' + type + '>', '')
    .replace('<' + type + '/>', '');
  if (title.length == 0) {
    return null;
  }
  const parts = title.match(/<num>([^<]*)<\/num>(.*)$/);
  if (parts != null) {
    return {
      prefix: parts[1],
      title: parts[2],
    };
  } else {
    return { title: title };
  }
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

    section.childNodes().forEach(part => {
      const partName = part.name();
      if (partName === 'poem') {
        const textId = part.attr('id').value();
        const head = part.get('head');
        const firstline = extractTitle(head, 'firstline');
        const title = extractTitle(head, 'title') || firstline;
        const indextitle = extractTitle(head, 'indextitle') || title;
        const toctitle = extractTitle(head, 'toctitle') || title;
        if (indextitle == null) {
          throw `${textId} mangler førstelinje, indextitle og title i ${poetId}/${workId}.xml`;
        }
        if (firstline != null && firstline.title.indexOf('<') > -1) {
          throw `${textId} har markup i førstelinjen i ${poetId}/${workId}.xml`;
        }
        if (indextitle.title.indexOf('>') > -1) {
          throw `${textId} har markup i titlen i ${poetId}/${workId}.xml`;
        }
        if (toctitle == null) {
          throw `${textId} mangler toctitle, firstline og title i ${poetId}/${workId}.xml`;
        }
        lines.push({
          id: textId,
          work_id: workId,
          lang: collected.poets.get(poetId).lang,
          title: replaceDashes(indextitle.title),
          firstline: firstline == null ? null : replaceDashes(firstline.title),
        });
        toc.push({
          type: 'text',
          id: textId,
          title: htmlToXml(toctitle.title),
          prefix: replaceDashes(toctitle.prefix),
        });
        handle_text(
          poetId,
          workId,
          part,
          partName,
          resolve_prev_next,
          section_titles
        );
      } else if (partName === 'section') {
        const head = part.get('head');
        const level = parseInt(safeGetAttr(head, 'level') || '1');
        const sectionId = safeGetAttr(part, 'id');
        const title = extractTitle(head, 'title');
        const toctitle = extractTitle(head, 'toctitle') || title;
        const linktitle = extractTitle(head, 'linktitle') || toctitle || title;
        const breadcrumb = { title: linktitle.title, id: sectionId };
        const subtoc = handle_section(part.get('content'), resolve_prev_next, [
          ...section_titles,
          breadcrumb,
        ]);
        toc.push({
          type: 'section',
          id: sectionId,
          level: level,
          title: htmlToXml(toctitle.title),
          content: subtoc,
        });
        if (sectionId != null) {
          handle_text(
            poetId,
            workId,
            part,
            partName,
            resolve_prev_next,
            section_titles
          );
        }
      } else if (partName === 'prose') {
        const textId = part.attr('id').value();
        const head = part.get('head');
        const title = extractTitle(head, 'title');
        const toctitle = extractTitle(head, 'toctitle') || title;
        if (toctitle == null) {
          throw `${textId} mangler title og toctitle i ${poetId}/${workId}.xml`;
        }
        toc.push({
          type: 'text',
          id: textId,
          title: htmlToXml(toctitle.title),
          prefix: toctitle.prefix,
        });
        handle_text(
          poetId,
          workId,
          part,
          partName,
          resolve_prev_next,
          section_titles
        );
      }
    });
    return toc;
  };

  const workhead = work.get('workhead');
  const notes = get_notes(workhead);
  const pictures = get_pictures(
    workhead,
    `/static/images/${poetId}`,
    `fdirs/${poetId}/${workId}`,
    collected
  );

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
    const items = workbody.find('//poem|//prose|//section[@id]').map(part => {
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

const build_global_lines_json = collected => {
  safeMkdir('static/api/alltexts');
  let changed_langs = {};
  let found_changes = false;
  collected.workids.forEach((workIds, poetId) => {
    workIds.forEach(workId => {
      const workFilename = `fdirs/${poetId}/${workId}.xml`;
      if (!isFileModified(workFilename)) {
        return;
      } else {
        const poet = collected.poets.get(poetId);
        changed_langs[poet.country] = true;
        found_changes = true;
      }
    });
  });
  if (found_changes) {
    // Collect the lines for the changed countries
    // collected_lines[country][titles|first][letter] is an array of lines
    let collected_lines = new Map();
    collected.texts.forEach((textMeta, textId) => {
      const poet = collected.poets.get(textMeta.poetId);
      if (changed_langs[poet.country]) {
        let per_country = collected_lines.get(poet.country) || new Map();
        collected_lines.set(poet.country, per_country);
        ['titles', 'first'].forEach(linetype => {
          let per_linetype = per_country.get(linetype) || new Map();
          per_country.set(linetype, per_linetype);
          let line =
            linetype == 'titles' ? textMeta.indexTitle : textMeta.firstline;
          if (line != null) {
            // firstline is null for prose texts
            let indexableLine = line
              .replace(/^\[/, '')
              .replace(/^\(/, '')
              .toUpperCase()
              .replace(/^À/, 'A')
              .replace(/^Á/, 'A')
              .replace(/^É/, 'E')
              .replace(/^È/, 'E')
              .replace(/^Ô/, 'O');
            if (poet.country === 'dk') {
              indexableLine = indexableLine
                .replace(/^Ö/, 'Ø')
                .replace(/^AA/, 'Å');
            }
            let firstletter = indexableLine[0];
            if (firstletter >= '0' && firstletter <= '9') {
              firstletter = '_'; // Vises som "Tegn"
            }
            const work = collected.works.get(
              textMeta.poetId + '/' + textMeta.workId
            );
            let per_letter = per_linetype.get(firstletter) || [];
            per_letter.push({
              poet: {
                id: textMeta.poetId,
                name: poetName(poet),
              },
              work: {
                id: work.id,
                title: workName(work),
              },
              line,
              textId,
            });
            per_linetype.set(firstletter, per_letter);
          }
        });
      }
    });
    // Write the json files
    const compareLocales = {
      dk: 'da-DK',
      de: 'de',
      fr: 'fr-FR',
      gb: 'en-GB',
      us: 'en-US',
      it: 'it-IT',
      se: 'se',
      no:
        'da-DK' /* no-NO locale virker ikke, men sortering er ligesom 'da-DK' */,
    };
    collected_lines.forEach((per_country, country) => {
      per_country.forEach((per_linetype, linetype) => {
        const locale = compareLocales[country] || 'da-DK';
        const linesComparator = (a, b) => {
          if (a.line === b.line) {
            return a.poet.name.localeCompare(b.poet.name, locale);
          } else {
            return a.line.localeCompare(b.line, locale);
          }
        };
        const lettersComparator = (a, b) => a.localeCompare(b, locale);
        const letters = Array.from(per_linetype.keys()).sort(lettersComparator);
        per_linetype.forEach((lines, letter) => {
          const data = {
            letters,
            lines: lines.sort(linesComparator),
          };
          const filename = `static/api/alltexts/${country}-${linetype}-${letter}.json`;
          console.log(filename);
          writeJSON(filename, data);
        });
      });
    });
  }
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

      work.find('//poem|//prose|//section[@id]').forEach(part => {
        const textId = part.attr('id').value();
        const head = part.get('head');
        const title = extractTitle(head, 'title');
        const firstline = extractTitle(head, 'firstline');
        const linktitle = extractTitle(head, 'linktitle');
        const indextitle = extractTitle(head, 'indextitle');

        const linkTitle = linktitle || title || firstline;
        const indexTitle = indextitle || title || firstline;

        texts.set(textId, {
          title: replaceDashes(linkTitle.title),
          firstline: replaceDashes(firstline == null ? null : firstline.title),
          indexTitle: replaceDashes(indexTitle.title),
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
      let sources = {};
      head.find('source').forEach(sourceNode => {
        let source = null;
        if (sourceNode.text().trim().length > 0) {
          const title = sourceNode
            .toString()
            .replace(/<source[^>]*>/, '')
            .replace(/<\/source>/, '');
          source = { source: title };
        }
        const sourceId = safeGetAttr(sourceNode, 'id') || 'default';
        if (source == null || source.source == null) {
          throw new Error(
            `fdirs/${poetId}/${workId}.xml has source with no title.`
          );
        }
        let facsimile = safeGetAttr(sourceNode, 'facsimile');
        if (facsimile != null) {
          facsimile = facsimile.replace(/.pdf$/, '');
          let facsimilePagesOffset = safeGetAttr(
            sourceNode,
            'facsimile-pages-offset'
          );
          if (facsimilePagesOffset != null) {
            facsimilePagesOffset = parseInt(facsimilePagesOffset, 10);
          }

          const facsimilePageCount = safeGetAttr(
            sourceNode,
            'facsimile-pages-num'
          );
          if (facsimilePageCount == null) {
            throw new Error(
              `fdirs/${poetId}/${workId}.xml is missing facsimile-pages-num in source.`
            );
          }
          source = {
            ...source,
            facsimile,
            facsimilePageCount: parseInt(facsimilePageCount, 10),
            facsimilePagesOffset,
          };
        }
        sources[sourceId] = source;
      });
      data.sources = sources;
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
    /xref\s.*?poem="([^",]*)/g,
    /a\s.*?poem="([^",]*)/g,
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
    { regexp: /xref ()poem="([^"]*)"/g, type: 'text' },
    { regexp: /a ()poem="([^"]*)"/g, type: 'text' },
    { regexp: /xref type="([^"]*)" poem="([^"]*)"/g, type: 'text' },
    { regexp: /a type="([^"]*)" poem="([^"]*)"/g, type: 'text' },
    { regexp: /xref ()bibel="([^",]*)/g, type: 'text' },
    { regexp: /a ()person="([^"]*)"/g, type: 'person' },
    { regexp: /a ()poet="([^"]*)"/g, type: 'person' },
  ];
  // TODO: Led også efter <a person="">xxx</a> og <a poet="">xxxx</a>
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
        const notes = text.find(
          'head/notes/note|body//footnote|body//note|body'
        );
        notes.forEach(note => {
          regexps.forEach(rule => {
            while ((match = rule.regexp.exec(note.toString())) != null) {
              const refType = match[1] || 'mention';
              if (rule.type === 'text') {
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
              } else if (rule.type === 'person') {
                const toPoetId = match[2];
                register(filename, toPoetId, fromId, 'mention');
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

// Rekursiv function som bruges til at bygge værkers indholdsfortegnelse,
// men også del-indholdstegnelser til de linkbare sektioner som har en id.
const build_section_toc = section => {
  let poems = [];
  let proses = [];
  let toc = [];

  section.childNodes().forEach(part => {
    const partName = part.name();
    if (partName === 'poem') {
      const textId = part.attr('id').value();
      const head = part.get('head');
      const firstline = extractTitle(head, 'firstline');
      const title = extractTitle(head, 'title') || firstline;
      const toctitle = extractTitle(head, 'toctitle') || title;
      toc.push({
        type: 'text',
        id: textId,
        title: htmlToXml(toctitle.title),
        prefix: replaceDashes(toctitle.prefix),
      });
    } else if (partName === 'section') {
      const subtoc = build_section_toc(part.get('content'));
      const head = part.get('head');
      const level = parseInt(safeGetAttr(part, 'level') || '1');
      const sectionId = safeGetAttr(part, 'id');
      const title = extractTitle(head, 'title');
      const toctitle = extractTitle(head, 'toctitle') || title;
      toc.push({
        type: 'section',
        id: sectionId,
        level: level,
        title: htmlToXml(toctitle.title),
        content: subtoc,
      });
    } else if (partName === 'prose') {
      const textId = part.attr('id').value();
      const head = part.get('head');
      const title = extractTitle(head, 'title');
      const toctitle = extractTitle(head, 'toctitle') || title;
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

const build_works_toc = collected => {
  // Returns {toc, notes, pictures}
  const extract_work_data = work => {
    const type = work.attr('type').value();
    const poetId = work.attr('author').value();
    const workId = work.attr('id').value();
    let lines = [];

    const workhead = work.get('workhead');
    const notes = get_notes(workhead);
    const pictures = get_pictures(
      workhead,
      `/static/images/${poetId}`,
      `fdirs/${poetId}/${workId}`,
      collected
    );

    const workbody = work.get('workbody');
    if (workbody == null) {
      return {
        lines: [],
        toc: [],
        notes: [],
        pictures: [],
      };
    }

    const toc = build_section_toc(workbody);
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

    const workFilenames = collected.workids
      .get(poetId)
      .map(workId => `fdirs/${poetId}/${workId}.xml`);
    if (
      !isFileModified(
        `data/poets.xml:${poetId}`,
        `fdirs/${poetId}/artwork.xml`,
        ...workFilenames
      )
    ) {
      return;
    }

    let works = [];
    collected.workids.get(poetId).forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;

      // Copy the xml-file into static to allow for xml download.
      fs.createReadStream(filename).pipe(
        fs.createWriteStream(`static/api/${poetId}/${workId}.xml`)
      );
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
      works.push(data);
    });

    let artwork = [];
    if (poet.has_artwork) {
      artwork = Array.from(collected.artwork.values())
        .filter(a => a.artistId === poetId)
        .map(picture => {
          return {
            lang: picture.lang,
            src: picture.src,
            size: picture.size,
            content_lang: picture.content_lang,
            content_html: picture.content_html,
            subjects: picture.subjects,
            year: picture.year,
          };
        });
    }

    const objectToWrite = {
      poet,
      works,
      artwork,
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
      doc.find('//poem|//section[@id]').forEach(part => {
        const textId = part.attr('id').value();
        // Skip digte som ikke er ældste variant
        const variants = resolve_variants(textId);
        if (variants != null && variants.length > 0 && variants[0] != textId) {
          return;
        }

        const head = part.get('head');
        const firstline = extractTitle(head, 'firstline');
        const title = extractTitle(head, 'title') || firstline;
        const indextitle = extractTitle(head, 'indextitle') || title;
        if (indextitle == null) {
          throw `${textId} mangler førstelinje, indextitle og title i ${poetId}/${workId}.xml`;
        }
        // Vi tillader manglende firstline, men så skal det markeres med et <nofirstline/> tag.
        // Dette bruges f.eks. til mottoer af andre forfattere.
        if (
          part.name() === 'poem' &&
          firstline == null &&
          head.get('nofirstline') == null
        ) {
          throw `${textId} mangler firstline i ${poetId}/${workId}.xml`;
        }
        if (firstline != null && firstline.title.indexOf('<') > -1) {
          throw `${textId} har markup i førstelinjen i ${poetId}/${workId}.xml`;
        }
        if (indextitle.title.indexOf('>') > -1) {
          throw `${textId} har markup i titlen i ${poetId}/${workId}.xml`;
        }
        collectedLines.push({
          id: textId,
          work_id: workId,
          lang: poet.lang,
          title: replaceDashes(indextitle.title),
          firstline: firstline == null ? null : replaceDashes(firstline.title),
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
      const pictures = get_pictures(
        head,
        '/static/images/keywords',
        path,
        collected
      );
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
    if (meta == null) {
      throw `Unknown poem ${poemId}`;
    }
    const poetObj = collected.poets.get(meta.poetId);
    if (poetObj == null) {
      throw `Unknown poet ${meta.poetId}`;
    }
    const poet = poetName(poetObj);
    const work = collected.works.get(meta.poetId + '/' + meta.workId);
    if (work == null) {
      throw `${poemId} references unknown work ${meta.poetId +
        '/' +
        meta.workId}`;
    }
    const workNameFormattet = workName(work);
    return [
      [
        `${poet}: <a poem="${poemId}">»${
          meta.title
        }«</a> – ${workNameFormattet}`,
        { html: true },
      ],
    ];
  };
  collected.poets.forEach((poet, poetId) => {
    if (!poet.has_mentions) {
      return;
    }
    safeMkdir(`static/api/${poet.id}`);
    let data = {
      poet,
      mentions: [],
      translations: [],
      primary: [],
      secondary: [],
    };
    const refs = collected.person_or_keyword_refs.get(poetId);
    if (refs != null) {
      data.mentions = refs.mention.map(build_html);
      data.translations = refs.translation.map(build_html);
    }

    ['primary', 'secondary'].forEach(filename => {
      const biblioXmlPath = `fdirs/${poet.id}/bibliography-${filename}.xml`;
      const doc = loadXMLDoc(biblioXmlPath);
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
      } else {
        data[filename] = [];
      }
    });

    const outFilename = `static/api/${poet.id}/mentions.json`;
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
      const pictures = get_pictures(
        head,
        '/static/images/about',
        paths.xml,
        collected
      );
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
    if (!poet.has_works && !poet.has_artwork) {
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
            const primary_portrait = build_portraits_json(
              poet,
              collected
            ).filter(p => p.primary)[0];
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
                src: primary_portrait.src,
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
  buildThumbnails('static/images', isFileModified);
  buildThumbnails('static/kunst', isFileModified);
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
      if (poet.has_mentions) {
        urls.push(`https://kalliope.org/${lang}/mentions/${poetId}`);
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
      if (poet.has_works || poet.has_artwork) {
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
    .filter(poet => poet.has_works || poet.has_artwork)
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

const build_variants = collected => {
  let variants_map = new Map(loadCachedJSON('collected.variants') || []);

  register_variant = (from, to) => {
    let array = variants_map.get(from) || [];
    if (array.indexOf(to) === -1) {
      array.push(to);
    }
    variants_map.set(from, array);
  };

  collected.poets.forEach((poet, poetId) => {
    collected.workids.get(poetId).forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!isFileModified(filename)) {
        return;
      }
      let doc = loadXMLDoc(filename);
      doc
        .find('//poem[@variant]|//prose[@variant]//@section[@variant]')
        .forEach(text => {
          const textId = safeGetAttr(text, 'id');
          const variantId = safeGetAttr(text, 'variant');
          register_variant(textId, variantId);
          register_variant(variantId, textId);
          // Mark work containing variantId dirty
          const variantData = collected.texts.get(variantId);
          if (variantData != null) {
            markFileDirty(
              `fdirs/${variantData.poetId}/${variantData.workId}.xml`
            );
          }
        });
    });
  });
  writeCachedJSON('collected.variants', Array.from(variants_map));
  return variants_map;
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

const build_anniversaries_ical = collected => {
  let events = [];
  let [nowYear, nowMonth, nowDay] = new Date()
    .toISOString()
    .split('T')[0]
    .split('-')
    .map(s => parseInt(s, 10));

  const handleDate = (poet, eventType, date) => {
    var [year, month, day] = date.split('-').map(s => parseInt(s, 10));
    if (month == null || day == null || year == null) {
      // Ignorer datoer som ikke er fulde datoer, såsom "1300?" og "1240 ca."
      return;
    }
    for (let eventYear = nowYear - 1; eventYear < nowYear + 3; eventYear++) {
      let eventDate = new Date();
      eventDate.setDate(day);
      eventDate.setMonth(month - 1);
      eventDate.setYear(eventYear);
      if ((eventYear - year) % 100 === 0 || (eventYear - year) % 250 === 0) {
        const eventTitle = eventType === 'born' ? 'født' : 'død';
        events.push({
          start: [eventYear, month, day],
          duration: { days: 1 },
          title: `${poetName(poet)} ${eventTitle} for ${eventYear -
            year} år siden`,
          description: `${poetName(poet)} ${eventTitle} ${parseInt(
            day,
            10
          )}/${parseInt(month, 10)} ${year}.`,
          url: `https://kalliope.org/da/bio/${poet.id}`,
          uid: `${poet.id}-${eventType}-${eventYear}@kalliope.org`,
        });
      }
    }
  };
  collected.poets.forEach((poet, poetId) => {
    if (
      poet.period != null &&
      poet.period.born != null &&
      poet.period.born.date !== '?'
    ) {
      handleDate(poet, 'born', poet.period.born.date);
    }
    if (
      poet.period != null &&
      poet.period.dead != null &&
      poet.period.dead.date !== '?'
    ) {
      handleDate(poet, 'dead', poet.period.dead.date);
    }
  });
  const { error, value } = ics.createEvents(events);
  if (error != null) {
    throw error;
  }
  writeText('static/Kalliope.ics', value);
};

const build_artwork = collected => {
  let collected_artwork = new Map(loadCachedJSON('collected.artwork') || []);
  const force_reload = collected_artwork.size == 0;

  const doc = loadXMLDoc('data/poets.xml');
  doc.find('/persons/person').forEach(person => {
    const personId = person.attr('id').value();
    const personType = person.attr('type').value();
    const artworkFilename = `fdirs/${personId}/artwork.xml`;
    const portraitsFile = `fdirs/${personId}/portraits.xml`;

    if (
      personType === 'artist' &&
      (force_reload || isFileModified(artworkFilename))
    ) {
      // Fjern eksisterende fra cache (i tilfælde af id er slettet)
      Array.from(collected_artwork.keys())
        .filter(k => k.indexOf(`${personId}/`) === 0)
        .forEach(k => {
          collected_artwork.delete(k);
        });

      const artworksDoc = loadXMLDoc(artworkFilename);
      if (artworksDoc != null) {
        artworksDoc.find('//pictures/picture').forEach(picture => {
          const pictureId = safeGetAttr(picture, 'id');
          const subjectAttr = safeGetAttr(picture, 'subject');
          let subjects = subjectAttr != null ? subjectAttr.split(',') : [];
          const year = safeGetAttr(picture, 'year');
          if (pictureId == null) {
            throw `fdirs/${personId}/artwork.xml har et billede uden id-attribut.`;
          }
          subjects.forEach(subjectId => {
            // Make sure we rebuild the affected bio page.
            markFileDirty(`fdirs/${subjectId}/portraits.xml`);
          });

          const src = `/static/images/${personId}/${pictureId}.jpg`;
          const size = imageSizeSync(src.replace(/^\//, ''));
          const remoteUrl = build_museum_url(picture);
          const museumLink = build_museum_link(picture) || '';
          const museumId = safeGetAttr(picture, 'museum');
          const artworkId = `${personId}/${pictureId}`;
          const artist = collected.poets.get(personId);
          const content_raw =
            picture
              .toString()
              .replace(/<picture[^>]*?>/, '')
              .replace('</picture>', '')
              .trim() + museumLink;
          const artworkJson = {
            id: `${personId}/${pictureId}`,
            artistId: personId,
            artist,
            museum: get_museum_json(museumId),
            remoteUrl,
            lang: person.lang,
            src,
            size,
            content_lang: 'da',
            subjects,
            year,
            content_raw,
            content_html: htmlToXml(content_raw, collected),
          };
          collected_artwork.set(artworkId, artworkJson);
        });
      }
    }
    if (force_reload || isFileModified(portraitsFile)) {
      // Fjern eksisterende portraits fra cache (i tilfælde af id er slettet)
      Array.from(collected_artwork.keys())
        .filter(k => k.indexOf(`portrait/${personId}/`) === 0)
        .forEach(k => {
          collected_artwork.delete(k);
        });

      // From portraits.xml
      const doc = loadXMLDoc(`fdirs/${personId}/portraits.xml`);
      if (doc != null) {
        onError = message => {
          throw `fdirs/${personId}/portraits.xml: ${message}`;
        };
        doc
          .find('//pictures/picture')
          .filter(picture => {
            return safeGetAttr(picture, 'ref') == null;
          })
          .forEach(pictureNode => {
            const src = safeGetAttr(pictureNode, 'src');
            const picture = get_picture(
              pictureNode,
              `/static/images/${personId}`,
              collected,
              onError
            );
            if (picture == null) {
              onError('har et billede uden src- eller ref-attribut.');
            }
            const key = `portrait/${personId}/${src}`;
            collected_artwork.set(key, picture);
          });
      }
    }

    // From works
    collected.workids.get(personId).forEach(workId => {
      const workFilename = `fdirs/${personId}/${workId}.xml`;
      if (force_reload || isFileModified(workFilename)) {
        // Fjern eksisterende work pictures fra cache
        Array.from(collected_artwork.keys())
          .filter(k => k.indexOf(`work/${personId}/${workId}`) === 0)
          .forEach(k => {
            collected_artwork.delete(k);
          });

        const doc = loadXMLDoc(workFilename);
        if (doc != null) {
          onError = message => {
            throw `${workFilename}: ${message}`;
          };
          doc
            .find('//pictures/picture')
            .filter(picture => {
              return safeGetAttr(picture, 'ref') == null;
            })
            .forEach(pictureNode => {
              const src = safeGetAttr(pictureNode, 'src');
              const picture = get_picture(
                pictureNode,
                `/static/images/${personId}`,
                collected,
                onError
              );
              if (picture == null) {
                onError('har et billede uden src- eller ref-attribut.');
              }
              const key = `work/${personId}/${workId}/${src}`;
              collected_artwork.set(key, picture);
            });
        }
      }
    });
  });
  writeCachedJSON('collected.artwork', Array.from(collected_artwork));
  return collected_artwork;
};

const build_museums = collected => {
  safeMkdir('static/api/museums');

  let found_changes = false;

  collected.poets.forEach((poet, poetId) => {
    const portraitsFile = `fdirs/${poet.id}/portraits.xml`;
    if (isFileModified(portraitsFile)) {
      found_changes = true;
    }
    const artworkFile = `fdirs/${poet.id}/artwork.xml`;
    if (poet.has_artwork) {
      found_changes |= isFileModified(artworkFile);
    }
    collected.workids.get(poet.id).forEach(workId => {
      const workFilename = `fdirs/${poetId}/${workId}.xml`;
      found_changes |= isFileModified(workFilename);
    });
  });
  if (!found_changes) {
    return;
  }

  let allArtwork = Array.from(collected.artwork.values());
  // Find portrætter som ikke har en ref og dermed inkluderet i collected.artwork
  collected.poets.forEach((poet, poetId) => {
    // From works
    collected.workids.get(poet.id).forEach(workId => {
      const doc = loadXMLDoc(`fdirs/${poetId}/${workId}.xml`);
    });
  });
  Object.keys(museums).forEach(museumId => {
    const museum = museums[museumId];
    if (museum.name == null) {
      // Vi tager kun museer med navne
      return;
    }

    const artwork = allArtwork
      .filter(a => a.museum != null && a.museum.id === museumId)
      .map(picture => {
        return {
          artist: picture.artist,
          lang: picture.lang,
          src: picture.src,
          size: picture.size,
          remoteUrl: picture.remoteUrl,
          content_lang: picture.content_lang,
          content_html: picture.content_html,
          subjects: picture.subjects,
          year: picture.year,
        };
      });

    const json = {
      museum: {
        id: museumId,
        name: museum.name,
      },
      artwork,
    };
    const path = `static/api/museums/${museumId}.json`;
    console.log(path);
    writeJSON(path, json);
  });
};

safeMkdir(`static/api`);
collected.workids = b('build_poet_workids', build_poet_workids);
// Build collected.works and collected.texts
Object.assign(collected, b('works_first_pass', works_first_pass, collected));
b('build_person_or_keyword_refs', build_person_or_keyword_refs, collected);
collected.poets = b('build_poets_json', build_poets_json, collected);
collected.artwork = b('build_artwork', build_artwork, collected);
b('build_museums', build_museums, collected);
b('build_mentions_json', build_mentions_json, collected);
collected.textrefs = b('build_textrefs', build_textrefs, collected);
collected.variants = b('build_variants', build_variants, collected);
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
b('build_global_lines_json', build_global_lines_json, collected);
b('build_dict_second_pass', build_dict_second_pass, collected);
b('build_todays_events_json', build_todays_events_json, collected);
b('build_redirects_json', build_redirects_json, collected);
b('build_sitemap_xml', build_sitemap_xml, collected);
b('build_anniversaries_ical', build_anniversaries_ical, collected);
b('build_image_thumbnails', build_image_thumbnails);
b('update_elasticsearch', update_elasticsearch, collected);

refreshFilesModifiedCache();
print_benchmarking_results();
