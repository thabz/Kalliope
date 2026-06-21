import {
  aboutURL,
  allTextsURL,
  bibleURL,
  bioURL,
  dictionaryURL,
  frontPageURL,
  keywordsURL,
  museumURL,
  museumsURL,
  poetURL,
  poetsURL,
  searchURL,
  textURL,
  workURL,
  worksURL,
} from '../components/links.js';

describe('link builders', () => {
  it('builds the top-level urls', () => {
    expect(frontPageURL()).toBe('/da/');
    expect(keywordsURL()).toBe('/da/keywords');
    expect(museumsURL('en')).toBe('/en/museums');
  });

  it('builds poet and work urls', () => {
    expect(poetURL('da', 'aarestrup')).toBe('/da/works/aarestrup');
    expect(worksURL('en', 'baggesen')).toBe('/en/works/baggesen');
    expect(workURL('da', 'aarestrup', '1838')).toBe('/da/work/aarestrup/1838');
    expect(bioURL('da', 'aarestrup')).toBe('/da/bio/aarestrup');
    expect(museumURL('da', 'smk')).toBe('/da/museum/smk');
    expect(aboutURL('en', 'help')).toBe('/en/about/help');
  });

  it('builds search and text urls with highlighting', () => {
    expect(textURL('da', 'aarestrup1838a0')).toBe('/da/text/aarestrup1838a0');
    expect(textURL('da', 'aarestrup1838a18,Blomsteraande')).toBe(
      '/da/text/aarestrup1838a18?highlight=Blomsteraande#h',
    );
    expect(bibleURL('da', 'bibelMatt5,1-3')).toBe(
      '/da/text/bibelMatt5?highlight=1-3#h',
    );
    expect(searchURL('da', 'blomstrende mark', 'dk')).toBe(
      '/da/search/dk?query=blomstrende+mark',
    );
    expect(searchURL('en', 'blomstrende mark', 'dk', 'aarestrup')).toBe(
      '/en/search/dk/aarestrup?query=blomstrende+mark',
    );
  });

  it('builds collection urls', () => {
    expect(allTextsURL('da', 'dk', 'titles', 'A')).toBe(
      '/da/texts/dk/titles/A',
    );
    expect(poetsURL('en', 'looks', 'se')).toBe('/en/poets/se/looks');
    expect(dictionaryURL('da')).toBe('/da/dict');
    expect(dictionaryURL('da', 'sol')).toBe('/da/dict/sol');
  });
});
