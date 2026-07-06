import fs from 'fs';
import { fileExists, loadText } from '../tools/libs/helpers.js';

function flatten(arr) {
  return [].concat(...arr);
}

function fail(message) {
  throw new Error(message);
}

function checkNotesGroups(filename, data) {
  const headRegexp = /<(workhead|head)>[\s\S]*?<\/\1>/g;
  const idRegexp = /<(?:text|section)[^>]*\sid="([^"]+)"/g;
  let currentId = 'workhead';
  const ids = Array.from(data.matchAll(idRegexp));
  let idIndex = 0;
  let headMatch;

  while ((headMatch = headRegexp.exec(data)) != null) {
    while (idIndex < ids.length && ids[idIndex].index < headMatch.index) {
      currentId = ids[idIndex][1];
      idIndex += 1;
    }
    const notesGroups = headMatch[0].match(/<notes>/g) || [];
    if (notesGroups.length > 1) {
      throw new Error(
        `fdirs/${filename} ${currentId} has ${notesGroups.length} <notes> groups.`
      );
    }
  }
}

function stripXmlComments(data) {
  return data.replace(/<!--[\s\S]*?-->/g, '');
}

function textParts(data) {
  const partRegexp = /<(?:text|section)\b[^>]*>/g;
  return Array.from(stripXmlComments(data).matchAll(partRegexp)).map(
    (partMatch) => partMatch[0]
  );
}

function isSkippedIndexPart(part) {
  return /\sskip-index="[^"]*"/.test(part);
}

function textIds(data) {
  return textParts(data)
    .filter((part) => !isSkippedIndexPart(part))
    .map((part) => part.match(/\sid="([^"]+)"/))
    .filter(Boolean)
    .map((match) => match[1]);
}

function textAliases(data) {
  return textParts(data)
    .filter((part) => !isSkippedIndexPart(part))
    .flatMap((part) => {
      const idMatch = part.match(/\sid="([^"]+)"/);
      const aliasesMatch = part.match(/\saliases="([^"]*)"/);

      if (idMatch == null || aliasesMatch == null) {
        return [];
      }

      return aliasesMatch[1]
        .split(',')
        .map((alias) => alias.trim())
        .filter((alias) => alias.length > 0)
        .map((alias) => ({ id: idMatch[1], alias }));
    });
}

function firstYear(text) {
  const match = (text || '').match(/\d{3,4}/);
  return match == null ? null : parseInt(match[0], 10);
}

function firstMatch(text, regexp) {
  const match = text.match(regexp);
  return match == null ? null : match[1];
}

function findMissingModernFrenchSpacing(data) {
  const textData = stripXmlComments(data).replace(
    /<picture\b[\s\S]*?<\/picture>/g,
    ''
  );
  const lines = textData.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i].replace(/<[^>]+>/g, '');
    const match = text.match(/\S([?!;:])/);
    if (match != null) {
      return {
        line: i + 1,
        sign: match[1],
        text: lines[i],
      };
    }
  }
  return null;
}

function ignoredTestsAtLine(data) {
  const partRegexp = /<(?:text|section)\b[^>]*>/g;
  const lineStarts = [0];
  let lineBreakIndex = -1;

  while ((lineBreakIndex = data.indexOf('\n', lineBreakIndex + 1)) !== -1) {
    lineStarts.push(lineBreakIndex + 1);
  }

  const ignoredAtLine = new Map();
  let currentIgnoredTests = [];
  let partIndex = 0;
  const parts = Array.from(data.matchAll(partRegexp));

  lineStarts.forEach((lineStart, lineIndex) => {
    while (partIndex < parts.length && parts[partIndex].index <= lineStart) {
      const ignoreTestsMatch = parts[partIndex][0].match(
        /\signore-tests="([^"]*)"/
      );
      currentIgnoredTests =
        ignoreTestsMatch == null
          ? []
          : ignoreTestsMatch[1]
              .split(',')
              .map((testName) => testName.trim())
              .filter((testName) => testName.length > 0);
      partIndex += 1;
    }
    ignoredAtLine.set(lineIndex, currentIgnoredTests);
  });

  return ignoredAtLine;
}

// Regulære expressions som fanger typiske fejl i vores XML.
// Disse kan enten være et regexp direkte eller et regexp med en whitelist.
const regexps = [
  /\^/,
  /^,[a-zæøåA-ZÆØÅ]/m, // Enkelt komma først på linjen
  /^\s[-a-zæøåA-ZÆØÅ]/m, // Enkelt mellemrum først på linjen
  /^\.[a-zæøåA-ZÆØÅ]/m, // Enkelt punktum ...
  { regexp: /[a-zæøå] \.[^\.]/, whitelist: [/\. \. \./] }, // Mellemrum foran punktum
  /^-[a-zæøåA-ZÆØÅ]/m, // Enkelt bindestreg ...
  /<firstline><\/firstline>/, // Tom <firstline> ...
  /<source pages="">/,
  /^.*[^\.]\.\s*[a-z;]\s*$/, // Løse bogstaver efter sidste punktum
  { testName: 'loose-letters', regexp: / [a-hj-np-z]\s*$/m, onlylangs: ['da'] }, // Løst bogstav sidst på dansk linje. Tillad i og o.
  { testName: 'loose-letters', regexp: / [b-z]\s*$/m, onlylangs: ['en'] }, // Løst bogstav sidst på engelsk linje. Tillad a.
  { regexp: /[a-zæøå],[a-zæøå]/, whitelist: [/<keywords>/, /<quality>/] },
  { regexp: /mmm/, whitelist: [/<note>.*\]/] },
  ///iii/, // Problematisk da den rammer lowercase romertal. Fiks fejlere og drop reglen.
  /\s,\s*$/m, // luft foran afsluttende komma
  { regexp: /\s!\s*$/m, ignorelangs: ['fr'] }, // luft foran afsluttende udråbstegn (tilladt på fransk)
  { regexp: /\s\?\s*$/m, ignorelangs: ['fr'] }, // luft foran afsluttende spørgsmål (tilladt på fransk)
  { regexp: /\s;\s*$/m, ignorelangs: ['fr'] }, // luft foran afsluttende semikolon (tilladt på fransk)
  //{ regexp: /\s:\s*$/m, ignorelangs: ['fr'] }, // luft foran afsluttende kolon (tilladt på fransk og i versgentagelser :)
  { regexp: /lll/, whitelist: [/Allliebe/] },
  /,;/,
  /,\./,
  {
    regexp: /;,/,
    whitelist: [/&/],
  },
  {
    regexp: /aaa/,
    whitelist: [
      /[Ss]maaalfer/,
      /Smaaarbeider/,
      /<note>.*\]/,
      /[Uu]paaagtet/,
      /Koleraaar/,
      /Græsstraaarme/,
    ],
  },
  /sss/,
  {
    regexp: / ,[^,]/,
    whitelist: [/<metrik>/],
  },
];

describe('Check workfiles', () => {
  const allPoetIds = fs
    .readdirSync('fdirs')
    .filter((p) => p.indexOf('.') === -1);

  let filenameLangs = {};
  let filenameBornYears = {};
  let filenameWorkYears = {};

  let filenames = allPoetIds.map((poetId) => {
    const infoFilename = `fdirs/${poetId}/info.xml`;
    if (!fs.existsSync(infoFilename)) {
      throw new Error(`Missing info.xml in fdirs/${poetId}.`);
    }
    const infoData = loadText(infoFilename);
    const person = firstMatch(infoData, /(<person\b[^>]*>)/);
    if (person == null) {
      throw new Error(`${infoFilename} is malformed.`);
    }
    const lang = firstMatch(person, /\slang="([^"]+)"/);
    const bornYear = firstYear(firstMatch(infoData, /<born>([\s\S]*?)<\/born>/));
    const workIds = firstMatch(infoData, /<works>([\s\S]*?)<\/works>/);
    let items = workIds
      ? workIds
          .toString()
          .replace('<works>', '')
          .replace('</works>', '')
          .replace('<works/>', '')
          .trim()
          .split(',')
          .filter((x) => x.length > 0)
      : [];
    return items.map((w) => {
      const filename = `${poetId}/${w}.xml`;
      filenameLangs[filename] = lang;
      filenameBornYears[filename] = bornYear;
      filenameWorkYears[filename] = firstYear(w);
      return filename;
    });
  });

  filenames = flatten(filenames);

  let seenTextIds = new Map();
  let duplicateTextIds = [];
  let seenTextAliases = new Map();
  let duplicateTextAliases = [];

  filenames.forEach((filename) => {
    const data = loadText(`fdirs/${filename}`);
    textIds(data).forEach((textId) => {
      if (seenTextIds.has(textId)) {
        duplicateTextIds.push(
          `Text id "${textId}" is used in both ${seenTextIds.get(
            textId
          )} and ${filename}.`
        );
      }
      seenTextIds.set(textId, filename);
    });
    textAliases(data).forEach(({ id, alias }) => {
      if (seenTextAliases.has(alias)) {
        duplicateTextAliases.push(
          `Text alias "${alias}" is used by both ${seenTextAliases.get(
            alias
          )} and ${filename}:${id}.`
        );
      }
      seenTextAliases.set(alias, `${filename}:${id}`);
    });
  });

  it('Text ids are unique across workfiles', () => {
    if (duplicateTextIds.length > 0) {
      fail(duplicateTextIds.join('\n'));
    }
  });

  it('Text aliases do not conflict with text ids', () => {
    if (duplicateTextAliases.length > 0) {
      fail(duplicateTextAliases.join('\n'));
    }
    seenTextAliases.forEach((textId, alias) => {
      if (seenTextIds.has(alias)) {
        fail(
          `Text alias "${alias}" in ${textId} conflicts with text id in ${seenTextIds.get(
            alias
          )}.`
        );
      }
    });
  });

  filenames.forEach((filename) => {
    const fullpath = `fdirs/${filename}`;
    const lang = filenameLangs[filename];
    it(`Workfile fdirs/${filename} is fine`, () => {
      const data = loadText(fullpath);
      const ignoredTests = ignoredTestsAtLine(data);
      expect(fileExists(fullpath)).toBeTruthy;
      expect(data.length > 0);
      checkNotesGroups(filename, data);
      regexps.forEach((rule) => {
        let regexp = rule.regexp || rule;
        let whitelist = rule.whitelist || [];
        let ignorelangs = rule.ignorelangs || [];
        let onlylangs = rule.onlylangs || [];

        if (ignorelangs.indexOf(lang) > -1) {
          return;
        }
        if (onlylangs.length > 0 && onlylangs.indexOf(lang) === -1) {
          return;
        }
        if (!regexp) {
          console.log('Regexp is missing from rule');
        }

        if (regexp.test(data)) {
          data.split('\n').forEach((line, lineIndex) => {
            if (
              regexp.test(line) &&
              (rule.testName == null ||
                ignoredTests.get(lineIndex).indexOf(rule.testName) === -1) &&
              !whitelist.find((w) => {
                return w.test(line);
              })
            ) {
              fail(`'${regexp.toString()}' found in xml [${line}]`);
            }
          });
        }
      });

      const shouldUseModernFrenchPunctuationSpacing =
        lang === 'fr' &&
        ((filenameBornYears[filename] != null &&
          filenameBornYears[filename] >= 1800) ||
          (filenameWorkYears[filename] != null &&
            filenameWorkYears[filename] >= 1800));
      if (shouldUseModernFrenchPunctuationSpacing) {
        const missingFrenchSpacing = findMissingModernFrenchSpacing(data);
        if (missingFrenchSpacing != null) {
          fail(
            `French spacing missing before '${missingFrenchSpacing.sign}' in ${filename}:${missingFrenchSpacing.line} [${missingFrenchSpacing.text}]`
          );
        }
      }
    });
  });
});
