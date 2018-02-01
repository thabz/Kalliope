// @flow

import type { Lang } from './types.js';

const translations: { [string]: string } = {
  'en*Digtere': 'Poets',
  'en*Nøgleord': 'Keywords',
  'en*Værker': 'Works',
  'en*Digttitler': 'Poem titles',
  'en*Titler': 'Titles',
  'en*Førstelinjer': 'First lines',
  'en*Bibliografi': 'Bibliography',
  'en*Biografi': 'Biography',
  'en*Om': 'About',
  'en*Nyheder': 'News',
  'en*digtere': 'poets',
  'en*Efter navn': 'By name',
  'en*Efter år': 'By year',
  'en*Ukendt år': 'Unknown birth year',
  'en*Ukendt digter': 'Unknown poet',
  'en*eller': 'or',
  'en*Skift mellem': 'Switch between',
  'en*Primær litteratur': 'Primary literature',
  'en*Sekundær litteratur': 'Secondary literature',
  'en*Andre digte': 'Other poems',
  'en*Søg i Kalliope': 'Search Kalliope',
  'en*Søg i {genetiveLastName} værker': 'Search {genetiveLastName} works',
  'en*Søg i Kalliopes {adjective} samling':
    "Search Kalliope's {adjective} collection",
};

const _ = (
  danishString: string,
  lang: Lang,
  keys?: { [string]: string }
): string => {
  var translated: string =
    translations[lang + '*' + danishString] || danishString;
  if (keys != null) {
    for (var key: string in keys) {
      if (keys.hasOwnProperty(key)) {
        translated = translated.replace('{' + key + '}', keys[key]);
      }
    }
  }
  return translated;
};

export default _;
