import {
  loadXMLDoc,
  safeGetText,
  loadText,
  fileExists,
} from '../tools/libs/helpers.js';

function flatten(arr) {
  return [].concat(...arr);
}
// Regulære expressions som fanger typiske fejl i vores XML.
// Disse kan enten være et regexp direkte eller et regexp med en whitelist.
const regexps = [
  /^,[a-zæøåA-ZÆØÅ]/m,  // Enkelt komma først på linjen
  /^\s[-a-zæøåA-ZÆØÅ]/m, // Enkelt mellemrum først på linjen
  /^\.[a-zæøåA-ZÆØÅ]/m, // Enkelt punktum ...
  /^-[a-zæøåA-ZÆØÅ]/m,   // Enkelt bindestreg ...
  /<firstline><\/firstline>/,   // Tom <firstline> ...
  {regexp: /[a-zæøå],[a-zæøå]/,
  whitelist: [/<keywords>/,/<quality>/]},
  { regexp: /mmm/, whitelist: [/<note>.*\]/] },
  ///iii/, // Problematisk da den rammer lowercase romertal. Fiks fejlere og drop reglen.
  /lll/,
  /,;/,
  {
    regexp: /;,/,
    whitelist: [/&/],
  },
  {
    regexp: /aaa/,
    whitelist: [/[Ss]maaalfer/, /Smaaarbeider/, /<note>.*\]/],
  },
  /sss/,
  {
    regexp: / ,[^,]/,
    whitelist: [/<metrik>/],
  },
];
// TODO: Hver regel kunne have nogle white-list regexps, som angiver undtagelser. F.eks. reglen /aaa/ kunne undtagelsen /Smaaalfer/

describe('Check workfiles', () => {
  const doc = loadXMLDoc('data/poets.xml');
  let filenames = doc.find('/persons/person').map(person => {
    const poetId = person.attr('id').value();
    const workIds = person.get('works');
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
    return items.map(w => `${poetId}/${w}.xml`);
  });
  filenames = flatten(filenames);
  filenames.forEach(filename => {
    const fullpath = `fdirs/${filename}`;
    const data = loadText(fullpath);
    it(`Workfile fdirs/${filename} is fine`, () => {
      expect(fileExists(fullpath)).toBeTruthy;
      expect(data.length > 0);
      regexps.forEach(rule => {
        let regexp;
        let whitelist;
        if (rule.regexp && rule.whitelist) {
          regexp = rule.regexp;
          whitelist = rule.whitelist;
        } else {
          regexp = rule;
          whitelist = [];
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
