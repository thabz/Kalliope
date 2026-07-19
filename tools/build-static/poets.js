import fs from 'fs';
import {
  literaryPeriods,
  literaryPeriodIds,
} from '../../common/literary-periods.js';
import {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
  force_reload as globalForceReload,
} from '../libs/caching.js';
import {
  fileExists,
  safeMkdir,
  writeJSON,
  resizeImage,
} from '../libs/helpers.js';
import {
  loadXMLDoc,
  safeGetText,
  safeGetAttr,
  getChildByTagName,
  getElementsByTagName,
} from './xml.js';
import { hasExternalIdentifiers } from './external-identifiers.js';

const knownPoetLanguages = new Set([
  'da',
  'sv',
  'no',
  'en',
  'de',
  'fr',
  'la',
  'grc',
  'fa',
  'es',
  'un',
  'it',
]);

const isKnownPoetLanguage = lang => knownPoetLanguages.has(lang);

const create_poet_square_thumb = (poetId, square_path) => {
  const path = `public/images/${poetId}/${square_path}`;
  const destFolder = `public/generated/images/${poetId}/social`;
  const destPath = `${destFolder}/${poetId}.jpg`;
  if (!fileExists(destPath)) {
    safeMkdir(destFolder);
    resizeImage(path, destPath, 600);
  }
  return `/generated/images/${poetId}/social/${poetId}.jpg`;
};

let _all_poet_ids = null;
const all_poet_ids = () => {
  if (!_all_poet_ids) {
    _all_poet_ids = fs.readdirSync('fdirs').filter(p => p.indexOf('.') === -1);
  }
  return _all_poet_ids;
};

const parseLiteraryPeriods = (id, value) => {
  if (value == null || value.trim() === '') {
    return [];
  }
  const periods = value
    .split(',')
    .map(period => period.trim())
    .filter(period => period !== '');
  periods.forEach(period => {
    if (!literaryPeriodIds.has(period)) {
      throw `${id} har ukendt litterær periode: ${period}`;
    }
  });
  return periods;
};

const build_poets_first_pass = collected => {
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
        has_poems = getElementsByTagName(doc, 'poetry').length > 0;
      }
      if (!has_prose) {
        has_prose = getElementsByTagName(doc, 'prose').length > 0;
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

  let collected_poets = globalForceReload
    ? new Map()
    : new Map(loadCachedJSON('collected.poets') || []);
  const force_reload = collected_poets.size === 0;
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
    if (!force_reload && !isFileModified(...relevantFiles)) {
      return;
    }
    found_changes = true;
    const doc = loadXMLDoc(infoFilename);
    const p = getChildByTagName(doc, 'person');
    const country = safeGetAttr(p, 'country');
    const lang = safeGetAttr(p, 'lang');
    const type = safeGetAttr(p, 'type');
    const nameE = getChildByTagName(p, 'name');
    const periodE = getChildByTagName(p, 'period');
    const works = safeGetText(p, 'works');
    const literary_periods = parseLiteraryPeriods(
      id,
      safeGetText(p, 'literary-periods')
    );
    if (!country.match(/(dk|se|no|gb|de|fr|us|it|un)/)) {
      throw `${id} har ukendt land: ${country}`;
    }
    if (!isKnownPoetLanguage(lang)) {
      throw `${id} har ukendt sprog: ${lang}`;
    }

    let square_portrait = null;
    const has_portraits = fileExists(`fdirs/${id}/portraits.xml`);
    if (has_portraits) {
      const portraitsDoc = loadXMLDoc(`fdirs/${id}/portraits.xml`);
      const squares = getElementsByTagName(portraitsDoc, 'picture')
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

    const firstname = safeGetText(nameE, 'firstname');
    const lastname = safeGetText(nameE, 'lastname');
    const fullname = safeGetText(nameE, 'fullname');
    const pseudonym = safeGetText(nameE, 'pseudonym');
    const christened = safeGetText(nameE, 'christened');
    const realname = safeGetText(nameE, 'realname');
    const sortname = safeGetText(nameE, 'sortname');

    let period = {};
    if (periodE) {
      const bornE = getChildByTagName(periodE, 'born');
      const deadE = getChildByTagName(periodE, 'dead');
      const coronationE = getChildByTagName(periodE, 'coronation');
      if (bornE) {
        period.born = {
          date: safeGetText(bornE, 'date'),
          place: safeGetText(bornE, 'place'),
          inon: safeGetAttr(getChildByTagName(bornE, 'place'), 'inon') || 'in',
        };
      }
      if (deadE) {
        period.dead = {
          date: safeGetText(deadE, 'date'),
          place: safeGetText(deadE, 'place'),
          inon: safeGetAttr(getChildByTagName(deadE, 'place'), 'inon') || 'in',
        };
      }
      if (coronationE) {
        period.coronation = {
          date: safeGetText(coronationE, 'date'),
          place: safeGetText(coronationE, 'place'),
          inon:
            safeGetAttr(getChildByTagName(coronationE, 'place'), 'inon') ||
            'in',
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
      name: {
        firstname,
        lastname,
        fullname,
        pseudonym,
        christened,
        realname,
        sortname,
      },
      period,
      literary_periods,
      has_portraits,
      has_square_portrait,
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
    collected_poets.set(id, poet);
  });
  if (found_changes) {
    writeCachedJSON('collected.poets', Array.from(collected_poets));
  }
  return collected_poets;
};

const build_poets_json = collected => {
  let found_changes = false;
  all_poet_ids().forEach(id => {
    const poet = collected.poets.get(id);

    const mentions = collected.person_or_keyword_refs.get(id);
    const has_mentions =
      (mentions != null &&
        (mentions.mention.length > 0 || mentions.translation.length > 0)) ||
      fileExists(`fdirs/${id}/bibliography-primary.xml`) ||
      fileExists(`fdirs/${id}/bibliography-secondary.xml`) ||
      hasExternalIdentifiers(id, 'reference');
    if (has_mentions !== poet.has_mentions) {
      found_changes = true;
      poet.has_mentions = has_mentions;
      writeJSON(`public/api/${poet.id}.json`, poet);
      collected.poets.set(id, poet);
    }
  });
  if (found_changes) {
    writeCachedJSON('collected.poets', Array.from(collected.poets));
  }
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
    writeJSON(`public/api/poets-${country}.json`, data);
  });
};

const build_literary_periods_json = collected => {
  const poetListItem = poet => {
    return {
      id: poet.id,
      type: poet.type,
      country: poet.country,
      lang: poet.lang,
      name: {
        firstname: poet.name.firstname,
        lastname: poet.name.lastname,
        sortname: poet.name.sortname,
      },
      period:
        poet.period == null
          ? null
          : {
              born:
                poet.period.born == null
                  ? null
                  : { date: poet.period.born.date },
              dead:
                poet.period.dead == null
                  ? null
                  : { date: poet.period.dead.date },
            },
    };
  };
  const periods = literaryPeriods.map(period => {
    const poets = [];
    collected.poets.forEach(poet => {
      if ((poet.literary_periods || []).includes(period.id)) {
        poets.push(poetListItem(poet));
      }
    });
    poets.sort((a, b) => {
      const aName = a.name.sortname || a.name.lastname || a.id;
      const bName = b.name.sortname || b.name.lastname || b.id;
      return aName.localeCompare(bName, 'da');
    });
    return {
      ...period,
      poets,
    };
  });
  writeJSON('public/api/literary-periods.json', { periods });
};

export {
  all_poet_ids,
  build_poets_json,
  build_poets_first_pass,
  build_poets_by_country_json,
  build_literary_periods_json,
  isKnownPoetLanguage,
};
