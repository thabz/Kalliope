const translations = {
  'en*Digtere': 'Poets',
  'en*digtere': 'poets',
  'en*Efter navn': 'By name',
  'en*Efter år': 'By year',
  'en*Ukendt år': 'Unknown birth year',
  'en*Ukendt digter': 'Unknown poet',
  'en*eller': 'or',
  'en*Skift mellem {items} digtere.': 'Switch between {items} poets.',
};

const _ = (danishString, lang, keys) => {
  var translated = translations[lang + '*' + danishString];
  if (keys != null) {
    for (var key in keys) {
      if (keys.hasOwnProperty(key)) {
        translated = translated.replace('{' + key + '}', keys[key]);
      }
    }
  }
  return translated || danishString;
};

export default _;
