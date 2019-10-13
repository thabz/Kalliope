const fs = require('fs');
const {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
} = require('../libs/caching.js');
const {
  fileExists,
  safeMkdir,
  writeJSON,
  loadXMLDoc,
  resizeImage,
} = require('../libs/helpers.js');
const { safeGetText, safeGetAttr } = require('./xml.js');

const create_poet_square_thumb = (poetId, square_path) => {
  const path = `static/images/${poetId}/${square_path}`;
  const destFolder = `static/images/${poetId}/social`;
  const destPath = `${destFolder}/${poetId}.jpg`;
  if (isFileModified(path) || !fileExists(destPath)) {
    safeMkdir(destFolder);
    resizeImage(path, destPath, 600);
  }
  return `social/${poetId}.jpg`;
};

let _all_poet_ids = null;
const all_poet_ids = () => {
  if (!_all_poet_ids) {
    _all_poet_ids = fs.readdirSync('fdirs').filter(p => p.indexOf('.') === -1);
  }
  return _all_poet_ids;
};

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

  let collected_poets = new Map(loadCachedJSON('collected.poets') || []);
  let found_changes = false;

  all_poet_ids().forEach(id => {
    const infoFilename = `fdirs/${id}/info.xml`;
    if (!fs.existsSync(infoFilename)) {
      throw new Error(`Missing info.xml in fdirs/${poetId}.`);
    }
    const relevantFiles = [
      infoFilename,
      `fdirs/${id}/bibliography-primary.xml`,
      `fdirs/${id}/bibliography-secondary.xml`,
      `fdirs/${id}/artwork.xml`,
      `fdirs/${id}/portraits.xml`,
    ];
    if (!isFileModified(...relevantFiles)) {
      return;
    }
    found_changes = true;
    const doc = loadXMLDoc(infoFilename);
    const p = doc.get('//person');
    const country = p.attr('country').value();
    const lang = p.attr('lang').value();
    const type = p.attr('type').value();
    const nameE = p.get('name');
    const periodE = p.get('period');
    const works = safeGetText(p, 'works');
    if (!country.match(/(dk|se|no|gb|de|fr|us|it|un)/)) {
      throw `${id} har ukendt land: ${country}`;
    }
    if (!lang.match(/(da|sv|no|en|de|fr||un|it)/)) {
      throw `${id} har ukendt sprog: ${country}`;
    }

    let square_portrait = null;
    const has_portraits = fileExists(`fdirs/${id}/portraits.xml`);
    if (has_portraits) {
      const portraitsDoc = loadXMLDoc(`fdirs/${id}/portraits.xml`);
      const squares = portraitsDoc
        .find('//pictures/picture')
        .map(p => safeGetAttr(p, 'square-src'))
        .filter(s => s != null);
      if (squares.length > 0) {
        square_portrait = create_poet_square_thumb(id, squares[0]);
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
    writeJSON(`static/api/${poet.id}.json`, poet);
    collected_poets.set(id, poet);
  });
  if (found_changes) {
    writeCachedJSON('collected.poets', Array.from(collected_poets));
  }
  return collected_poets;
};

const build_poets_by_country_json = collected => {
  let poetsByCountry = new Map();
  let hasChangesByCountry = new Map();
  collected.poets.forEach(poet => {
    let list = poetsByCountry.get(poet.country) || [];
    list.push(poet);
    poetsByCountry.set(poet.country, list);
  });
  poetsByCountry.forEach((poets, country) => {
    const sorted = poets.sort((a, b) => {
      return a.id < b.id ? -1 : 1;
    });
    const data = {
      poets: sorted,
    };
    writeJSON(`static/api/poets-${country}.json`, data);
  });
};

module.exports = {
  all_poet_ids,
  build_poets_json,
  build_poets_by_country_json,
};
