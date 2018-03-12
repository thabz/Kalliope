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
const regexps = [
  /^,[a-zæøåA-ZÆØÅ]/,
  /^\s[-a-zæøåA-ZÆØÅ]/,
  /^\.[a-zæøåA-ZÆØÅ]/,
  /^-[a-zæøåA-ZÆØÅ]/,
  /mmm/,
  ///iii/, // Problematisk da den rammer lowercase romertal. Fiks fejlere og drop reglen.
  /lll/,
  /aaa/,
  /sss/,
  / ,[^,]/,
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
    it(`Workfile ${filename} is fine`, () => {
      expect(fileExists(fullpath)).toBeTruthy;
      expect(data.length > 0);
      regexps.forEach(regexp => {
        if (regexp.test(data)) {
          const matches = data.match(regexp);
          const m = matches[0].replace('\n', '');
          console.log(matches[0]);
          //fail(`'${matches[0]}' found in xml`);
          fail(`'${regexp.toString()}' found in xml`);
        }
      });
    });
  });
});
