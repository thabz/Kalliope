jest.mock('../tools/libs/caching.js', () => ({
  isFileModified: () => false,
  loadCachedJSON: () => null,
  writeCachedJSON: () => {},
  force_reload: false,
}));

jest.mock('../tools/libs/helpers.js', () => ({
  safeMkdir: () => {},
  writeJSON: () => {},
  htmlToXml: (html) => html,
  fileExists: () => false,
}));

jest.mock('../tools/build-static/xml.js', () => ({
  loadXMLDoc: () => null,
  safeGetText: () => null,
  safeGetAttr: () => null,
  getElementsByTagNames: () => [],
  getElementsByTagName: () => [],
  getChildrenByTagName: () => [],
  getChildByTagName: () => null,
  safeGetOuterXML: () => '',
  safeGetInnerXML: () => '',
}));

const { build_mentions_data } = require('../tools/build-static/mentions.js');

const poet = (id, firstname, lastname) => ({
  id,
  name: {
    firstname,
    lastname,
  },
});

const text = (id, poetId, workId, title = id) => ({
  id,
  title,
  poetId,
  workId,
});

const work = (id, year) => ({
  id,
  year,
  title: id,
});

describe('mentions data', () => {
  const buildCollected = () => {
    const reboul = poet('reboul', 'Jean', 'Reboul');
    const aarestrup = poet('aarestrup', 'Emil', 'Aarestrup');
    const lamartine = poet('lamartine', 'Alphonse de', 'Lamartine');

    return {
      poets: new Map([
        ['reboul', reboul],
        ['aarestrup', aarestrup],
        ['lamartine', lamartine],
      ]),
      texts: new Map([
        [
          'aarestrup2018110521',
          text('aarestrup2018110521', 'aarestrup', '1863', 'En Engel stod'),
        ],
        [
          'aarestrup20190130175',
          text('aarestrup20190130175', 'aarestrup', '1976-5', 'En Engel stod'),
        ],
        [
          'reboul2019013101',
          text('reboul2019013101', 'reboul', 'andre', "L'Ange et l'enfant"),
        ],
      ]),
      works: new Map([
        ['aarestrup/1863', work('1863', '1863')],
        ['aarestrup/1976-5', work('1976-5', '1976')],
        ['reboul/andre', work('andre', '1828')],
      ]),
      variants: new Map([
        ['aarestrup2018110521', ['aarestrup20190130175']],
        ['aarestrup20190130175', ['aarestrup2018110521']],
      ]),
      person_or_keyword_refs: new Map([
        [
          'reboul',
          {
            mention: [],
            translation: [
              {
                translationPoemId: 'aarestrup20190130175',
                translatedPoemId: 'reboul2019013101',
              },
            ],
          },
        ],
        [
          'lamartine',
          {
            mention: ['aarestrup20190130175'],
            translation: [],
          },
        ],
      ]),
    };
  };

  it('viser oversættelser fra den primære variant', () => {
    const collected = buildCollected();
    const data = build_mentions_data(
      collected.poets.get('reboul'),
      'reboul',
      collected,
      (poemId) => [[poemId]]
    );

    expect(data.translations).toHaveLength(1);
    expect(data.translations[0].translation.poem.id).toBe(
      'aarestrup2018110521'
    );
    expect(data.translations[0].translated.poem.id).toBe('reboul2019013101');
  });

  it('viser mentions fra den primære variant', () => {
    const collected = buildCollected();
    const data = build_mentions_data(
      collected.poets.get('lamartine'),
      'lamartine',
      collected,
      (poemId) => [[poemId]]
    );

    expect(data.mentions).toEqual([[['aarestrup2018110521']]]);
  });
});
