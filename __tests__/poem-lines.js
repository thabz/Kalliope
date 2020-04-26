import fs from 'fs';
import { loadText, fileExists } from '../tools/libs/helpers.js';
import {
  loadXMLDoc,
  safeGetText,
  safeGetAttr,
  getElementByTagName,
  getElementsByTagName,
  tagName,
} from '../tools/build-static/xml.js';

function flatten(arr) {
  return [].concat(...arr);
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
      /upaaagtet/,
      /Koleraaar/,
    ],
  },
  /sss/,
  {
    regexp: / ,[^,]/,
    whitelist: [/<metrik>/],
  },
];

describe('Check workfiles', () => {
  const allPoetIds = fs.readdirSync('fdirs').filter(p => p.indexOf('.') === -1);

  let filenameLangs = {};

  let filenames = allPoetIds.map(poetId => {
    const infoFilename = `fdirs/${poetId}/info.xml`;
    if (!fs.existsSync(infoFilename)) {
      throw new Error(`Missing info.xml in fdirs/${poetId}.`);
    }
    const doc = loadXMLDoc(infoFilename);
    const person = getElementByTagName(doc, 'person');
    if (person == null) {
      throw new Error(`${infoFilename} is malformed.`);
    }
    const lang = safeGetAttr(person, 'lang');
    const workIds = safeGetText(person, 'works');
    let items = workIds
      ? workIds
          .toString()
          .replace('<works>', '')
          .replace('</works>', '')
          .replace('<works/>', '')
          .trim()
          .split(',')
          .filter(x => x.length > 0)
      : [];
    return items.map(w => {
      const filename = `${poetId}/${w}.xml`;
      filenameLangs[filename] = lang;
      return filename;
    });
  });

  filenames = flatten(filenames);

  filenames.forEach(filename => {
    const fullpath = `fdirs/${filename}`;
    const lang = filenameLangs[filename];
    const data = loadText(fullpath);
    it(`Workfile fdirs/${filename} is fine`, () => {
      expect(fileExists(fullpath)).toBeTruthy;
      expect(data.length > 0);
      regexps.forEach(rule => {
        let regexp = rule.regexp || rule;
        let whitelist = rule.whitelist || [];
        let ignorelangs = rule.ignorelangs || [];

        if (ignorelangs.indexOf(lang) > -1) {
          return;
        }
        if (!regexp) {
          console.log('Regexp is missing from rule');
        }

        if (regexp.test(data)) {
          data.split('\n').forEach(line => {
            if (
              regexp.test(line) &&
              !whitelist.find(w => {
                return w.test(line);
              })
            ) {
              fail(`'${regexp.toString()}' found in xml [${line}]`);
            }
          });
        }
      });
    });
  });
});
