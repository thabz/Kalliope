const translations = {
  'en*Digtere': 'Poets',
  'en*Personer': 'Persons',
  'en*Kunstnere': 'Artists',
  'en*Nøgleord': 'Keywords',
  'en*Museer': 'Museums',
  'en*Værker': 'Works',
  'en*Digter': 'Poet',
  'en*Værk': 'Work',
  'en*Tekst': 'Text',
  'en*Digttitler': 'Poem titles',
  'en*Titler': 'Titles',
  'en*Førstelinjer': 'First lines',
  'en*Oversættelser': 'Translations',
  'en*Henvisning': 'Reference',
  'en*Henvisninger': 'References',
  'en*Gendigtning': 'Adaptation',
  'en*Gendigtninger': 'Adaptations',
  'en*Note': 'Note',
  'en*Noter': 'Notes',
  'en*Omtaler': 'Mentions',
  'en*Biografi': 'Biography',
  'en*Om': 'About',
  'en*Nyheder': 'News',
  'en*Sidst ændret': 'Last modified',
  'en*digtere': 'poets',
  'en*Efter navn': 'By name',
  'en*Efter år': 'By year',
  'en*Efter titel': 'By title',
  'en*Efter oversætter': 'By translator',
  'en*er oversat af': 'is translated by',
  'en*har oversat': 'translated',
  'en* et ukendt digt ': ' an unknown poem ',
  'en*Et ukendt digt er oversat af': 'An unknown poem is translated by',
  'en*til': 'to',
  'en*og': 'and',
  'en*Ukendt år': 'Unknown birth year',
  'en*Ukendt digter': 'Unknown poet',
  'en*eller': 'or',
  'en*Skift mellem': 'Switch between',
  'en*Primær litteratur': 'Primary literature',
  'en*Sekundær litteratur': 'Secondary literature',
  'en*Andre digte': 'Other poems',
  'en*Navn': 'Name',
  'en*Fulde navn': 'Full name',
  'en*Døbt': 'Christened',
  'en*Pseudonym': 'Pseudonym',
  'en*Født': 'Born',
  'en*Død': 'Dead',
  'en*Tiltrådt': 'Accession',
  'en*(blev {ca}{yearDiff} år)': '(age {ca}{yearDiff} years)',
  'en*ca.': 'c.',
  'en*Søg i Kalliope': 'Search Kalliope',
  'en*Søg i {genetiveLastName} værker': 'Search {genetiveLastName} works',
  'en*{poetName}: »{poemTitle}« fra {workTitle}':
    '{poetName}: “{poemTitle}” from {workTitle}',
  'en*Søg i Kalliopes {adjective} samling':
    "Search Kalliope's {adjective} collection",
  'en*Variant': 'Variation',
  'en*Varianter': 'Variations',
  'en*{varianter} af denne tekst:': '{varianter} of this text:',
  'en*{varianter} af dette digt:': '{varianter} of this poem:',
  'en*{varianter} af denne samling:': '{varianter} of this collection:',
  'en*knytter sig til samme dato.': 'are associated with the same date.',

  'de*og': 'und',
  'de*Henvisning': 'Verweis',
  'de*Henvisninger': 'Verweise',
  'de*Gendigtning': 'Nachdichtung',
  'de*Gendigtninger': 'Nachdichtungen',
  'de*Note': 'Anmerkung',
  'de*Noter': 'Anmerkungen',
  'de*Søg i {genetiveLastName} værker':
    'In den Werken {genetiveLastName} suchen',
  'de*knytter sig til samme dato.': 'beziehen sich auf dasselbe Datum.',

  'fr*og': 'et',
  'fr*Henvisning': 'Référence',
  'fr*Henvisninger': 'Références',
  'fr*Gendigtning': 'Adaptation',
  'fr*Gendigtninger': 'Adaptations',
  'fr*Note': 'Note',
  'fr*Noter': 'Notes',
  'fr*Søg i {genetiveLastName} værker':
    'Rechercher dans les œuvres {genetiveLastName}',
  'fr*knytter sig til samme dato.': 'se rapportent à la même date.',
};

const _ = (danishString, lang, keys) => {
  var translated = translations[lang + '*' + danishString] || danishString;
  if (keys != null) {
    for (var key in keys) {
      if (keys.hasOwnProperty(key)) {
        translated = translated.replace('{' + key + '}', keys[key]);
      }
    }
  }
  return translated;
};

export default _;
