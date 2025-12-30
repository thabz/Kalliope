const { isFileModified } = require('../libs/caching.js');
const {
  safeMkdir,
  writeJSON,
  replaceDashes,
  fileExists,
} = require('../libs/helpers.js');
const { primaryTextVariantId } = require('./variants.js');
const { extractTitle } = require('./parsing.js');
const { poetName, workName } = require('./formatting.js');
const {
  getChildByTagName,
  getElementsByTagNames,
  loadXMLDoc,
  safeGetAttr,
  tagName,
} = require('./xml.js');

function stripDiacriticsGreek(str) {
  return (
    str
      // normaliser til basebogstav + kombinerende tegn
      .normalize('NFD')
      // fjern alle kombinerende diakritiske tegn
      .replace(/[\u0300-\u036f]/g, '')
      // normaliser tilbage
      .normalize('NFC')
  );
}
const build_global_lines_json = (collected) => {
  safeMkdir('static/api/alltexts');
  let changed_langs = {};
  let found_changes = false;
  collected.workids.forEach((workIds, poetId) => {
    workIds.forEach((workId) => {
      const workFilename = `fdirs/${poetId}/${workId}.xml`;
      if (!fileExists(workFilename)) {
        return;
      }
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
      if (poet == null) {
        // Ignorer. Dette kan ske når vi skifter mellem branches og digtere
        // kommer og går.
        return;
      }
      if (changed_langs[poet.country]) {
        let per_country = collected_lines.get(poet.country) || new Map();
        collected_lines.set(poet.country, per_country);
        ['titles', 'first'].forEach((linetype) => {
          let per_linetype = per_country.get(linetype) || new Map();
          per_country.set(linetype, per_linetype);
          let line =
            linetype == 'titles' ? textMeta.indexTitle : textMeta.firstline;
          if (line != null) {
            // firstline is null for prose texts
            let indexableLine = line
              .trim()
              .replace(',', '')
              .replace('!', '')
              .replace('?', '')
              .replace('᾿', '')
              .replace('῾', '')
              .replace(/^\[/, '')
              .replace(/^\(/, '')
              .toUpperCase()
              .replace(/^À/, 'A')
              .replace(/^Á/, 'A')
              .replace(/^É/, 'E')
              .replace(/^È/, 'E')
              .replace(/^Ô/, 'O')
              // Oldgræsk.
              .normalize('NFD') // splitter prækomponerede tegn
              .replace(/[\u0300-\u036f]/g, '') // fjern kombinerende diakritika
              .normalize('NFC'); // normaliser tilbage
            if (poet.country === 'dk') {
              indexableLine = indexableLine
                .replace(/^Ö/, 'Ø')
                .replace(/^AA/, 'Å');
            }
            let firstletter = (indexableLine || '_')[0];
            if (!firstletter.match(/^[A-ZÆØÅÄÖÜ_]$/)) {
              firstletter = '_';
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
      no: 'da-DK' /* no-NO locale virker ikke, men sortering er ligesom 'da-DK' */,
    };
    collected_lines.forEach((per_country, country) => {
      per_country.forEach((per_linetype, linetype) => {
        const locale = compareLocales[country] || 'da-DK';
        const collator = new Intl.Collator(locale, {
          numeric: true,
          sensitivity: 'base',
        });
        const linesComparator = (a, b) => {
          if (a.line === b.line) {
            return collator.compare(a.poet.name, b.poet.name);
          } else {
            return collator.compare(a.line, b.line);
          }
        };
        const lettersComparator = (a, b) => {
          return collator.compare(a, b);
        };

        const letters = Array.from(per_linetype.keys()).sort(lettersComparator);
        per_linetype.forEach((lines, letter) => {
          const data = {
            letters,
            lines: lines.sort(linesComparator),
          };
          const filename = `static/api/alltexts/${country}-${linetype}-${letter}.json`;
          //console.log(filename);
          writeJSON(filename, data);
        });
      });
    });
  }
};

const build_poet_lines_json = (collected) => {
  collected.poets.forEach((poet, poetId) => {
    const filenames = collected.workids
      .get(poetId)
      .map((workId) => `fdirs/${poetId}/${workId}.xml`);
    if (!isFileModified(`fdirs/${poetId}/info.xml`, ...filenames)) {
      return;
    }

    safeMkdir(`static/api/${poetId}`);

    let collectedLines = [];
    collected.workids.get(poetId).forEach((workId) => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!fileExists(filename)) {
        return;
      }
      let doc = loadXMLDoc(filename);
      if (doc == null) {
        console.log("Couldn't load", filename);
      }
      getElementsByTagNames(doc, ['text', 'section'])
        .filter((part) => safeGetAttr(part, 'id') != null)
        .forEach((part) => {
          const textId = safeGetAttr(part, 'id');
          // Skip digte som ikke er ældste variant
          if (primaryTextVariantId(textId, collected) !== textId) {
            return;
          }
          // Skip tekster markeret med skip-index
          const skipIndex = safeGetAttr(part, 'skip-index');
          if (skipIndex != null) {
            return;
          }

          const head = getChildByTagName(part, 'head');
          const firstline = extractTitle(head, 'firstline');
          const title = extractTitle(head, 'title') || firstline;
          const indextitle = extractTitle(head, 'indextitle') || title;
          if (indextitle == null) {
            throw `${textId} mangler førstelinje, indextitle og title i ${poetId}/${workId}.xml`;
          }
          // Vi tillader manglende firstline, men så skal det markeres med et <nofirstline/> tag.
          // Dette bruges f.eks. til mottoer af andre forfattere.
          /*
          if (
            tagName(part) === 'poem' &&
            firstline == null &&
            getChildByTagName(head, 'nofirstline') == null
          ) {
            throw `${textId} mangler firstline i ${poetId}/${workId}.xml`;
          }
          */
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
            firstline:
              firstline == null ? null : replaceDashes(firstline.title),
          });
        });
    });
    // Detect firstlines and titles that are shared between multiple
    // poems. Mark these with non_unique_firstline and non_unique_indextitle.
    let counts = {
      firstlines: {},
      titles: {},
    };
    collectedLines.forEach((pair) => {
      counts.titles[pair.title] = (counts.titles[pair.title] || 0) + 1;
      counts.firstlines[pair.firstline] =
        (counts.firstlines[pair.firstline] || 0) + 1;
    });
    collectedLines = collectedLines.map((pair) => {
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

module.exports = {
  build_global_lines_json,
  build_poet_lines_json,
};
