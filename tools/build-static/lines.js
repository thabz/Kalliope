import { isFileModified } from '../libs/caching.js';
import {
  safeMkdir,
  writeJSON,
  fileExists,
} from '../libs/helpers.js';
import { primaryTextVariantId } from './variants.js';
import { poetName, workName } from './formatting.js';
import { sourceFilesForText } from './anthologies.js';

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
  safeMkdir('public/api/alltexts');
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
  if (
    isFileModified(
      'tools/build-static/lines.js',
      'tools/build-static/anthologies.js'
    )
  ) {
    found_changes = true;
  }
  if (found_changes) {
    collected.poets.forEach(poet => {
      changed_langs[poet.country] = true;
    });
    // Collect the lines for the changed countries
    // collected_lines[country][titles|first][letter] is an array of lines
    let collected_lines = new Map();
    collected.texts.forEach((textMeta, textId) => {
      if (textMeta.indexable === false) {
        return;
      }
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
          const filename = `public/api/alltexts/${country}-${linetype}-${letter}.json`;
          //console.log(filename);
          writeJSON(filename, data);
        });
      });
    });
  }
};

const build_poet_lines_json = (collected) => {
  collected.poets.forEach((poet, poetId) => {
    const poetTexts = Array.from(collected.texts.values()).filter(
      text => text.poetId === poetId && text.indexable !== false
    );
    const filenames = Array.from(
      new Set(poetTexts.flatMap(sourceFilesForText))
    );
    if (
      !isFileModified(
        'tools/build-static/lines.js',
        'tools/build-static/anthologies.js',
        `fdirs/${poetId}/info.xml`,
        ...filenames
      )
    ) {
      return;
    }

    safeMkdir(`public/api/${poetId}`);

    let collectedLines = poetTexts
      .filter(text => primaryTextVariantId(text.id, collected) === text.id)
      .filter(text => !text.skipIndex)
      .map(text => ({
        id: text.id,
        work_id: text.workId,
        lang: poet.lang,
        title: text.indexTitle,
        firstline: text.firstline,
      }));
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
    const linesOutFilename = `public/api/${poetId}/texts.json`;
    console.log(linesOutFilename);
    writeJSON(linesOutFilename, data);
  });
};

export {
  build_global_lines_json,
  build_poet_lines_json,
};
