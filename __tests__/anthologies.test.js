import { DOMParser } from '@xmldom/xmldom';
import {
  buildCollectionIndexes,
  buildVirtualAnthologyWorks,
  isAnthologyText,
  resolveAuthorId,
  textsForWork,
  worksForPoet,
} from '../tools/build-static/anthologies.js';
import { workName } from '../tools/build-static/formatting.js';
import { build_section_toc } from '../tools/build-static/toc.js';
import { sortWorks } from '../common/worksort.js';
import {
  getChildByTagName,
  getElementByTagName,
  loadXMLDoc,
} from '../tools/build-static/xml.js';

describe('antologiplaceringer', () => {
  it('indekserer samme tekstobjekt i både publikationen og digterens virtuelle TOC', () => {
    const text = {
      id: 'one', poetId: 'author', workId: 'book',
      sourcePoetId: 'publisher', sourceWorkId: 'book', sourceOrder: 1,
    };
    const collected = {
      works: new Map([['publisher/book', { id: 'book', title: 'Bog' }]]),
      texts: new Map([['one', text]]),
    };
    buildVirtualAnthologyWorks(collected);
    const authorTexts = textsForWork(collected, 'author', 'antologier');
    const publicationTexts = textsForWork(collected, 'publisher', 'book');
    buildCollectionIndexes(collected);
    expect(textsForWork(collected, 'author', 'antologier')).toEqual(authorTexts);
    expect(textsForWork(collected, 'publisher', 'book')).toEqual(publicationTexts);
    expect(authorTexts[0]).toBe(text);
    expect(publicationTexts[0]).toBe(text);
    expect(collected.texts.size).toBe(1);
    expect(textsForWork(collected, 'missing', 'book')).toEqual([]);
    textsForWork(collected, 'author', 'antologier').pop();
    expect(textsForWork(collected, 'author', 'antologier')).toEqual([text]);
  });

  it('arver forfatter fra den nærmeste sektion', () => {
    const doc = new DOMParser().parseFromString(
      `<kalliopework author="antologierdk">
        <workbody>
          <section author="sektionsdigter">
            <content>
              <text id="arvet" />
              <section author="indre-digter">
                <content>
                  <text id="indre" />
                  <text id="overskrevet" author="tekst-digter" />
                </content>
              </section>
            </content>
          </section>
          <text id="vaerkets" />
        </workbody>
      </kalliopework>`,
      'text/xml'
    );
    const texts = Array.from(doc.getElementsByTagName('text'));
    const author = id => {
      const text = Array.from(doc.getElementsByTagName('text')).find(
        node => node.getAttribute('id') === id
      );
      return resolveAuthorId(text, 'fallback');
    };

    expect(texts).toHaveLength(4);
    expect(author('arvet')).toBe('sektionsdigter');
    expect(author('indre')).toBe('indre-digter');
    expect(author('overskrevet')).toBe('tekst-digter');
    expect(author('vaerkets')).toBe('antologierdk');
  });

  it('bevarer tekst-id for tekster i en forfattersektion', () => {
    const doc = new DOMParser().parseFromString(
      `<workbody>
        <section author="hansenfj">
          <head><title>F. J. Hansen</title></head>
          <content>
            <text id="solnedgang">
              <head><title>Solnedgang</title></head>
            </text>
          </content>
        </section>
      </workbody>`,
      'text/xml'
    );

    const toc = build_section_toc(doc.documentElement, 'antologierdk');

    expect(toc[0].content[0].id).toBe('solnedgang');
  });

  it('viser digternavne i antologier, også med nedarvet sektionsforfatter', () => {
    const doc = new DOMParser().parseFromString(
      `<kalliopework author="hansenfj" type="anthology"><workbody>
        <text id="own"><head><title>Eget bidrag</title></head></text>
        <section author="guest"><head><title>Afsnit</title></head><content>
          <text id="guest"><head><title>Gæstebidrag</title></head></text>
          <text id="missing" author="missing"><head><title>Uafklaret</title></head></text>
          <text id="collection" author="collection"><head><title>Uden digter</title></head></text>
        </content></section>
      </workbody></kalliopework>`, 'text/xml'
    );
    const poets = new Map([
      ['hansenfj', { name: { firstname: 'F. J.', lastname: 'Hansen' } }],
      ['guest', { name: { lastname: 'Gæst' } }],
      ['collection', { type: 'collection', name: { firstname: 'Antologier' } }],
    ]);
    const workbody = getChildByTagName(doc.documentElement, 'workbody');
    const toc = build_section_toc(workbody, 'hansenfj', poets);
    expect(toc[0].authorName).toBe('F. J. Hansen');
    expect(toc[1]).not.toHaveProperty('authorName');
    expect(toc[1].content[0].authorName).toBe('Gæst');
    expect(toc[1].content[1]).not.toHaveProperty('authorName');
    expect(toc[1].content[2]).not.toHaveProperty('authorName');
    expect(build_section_toc(
      doc.getElementsByTagName('content')[0], 'hansenfj', poets
    )[0].authorName).toBe('Gæst');

    doc.documentElement.removeAttribute('type');
    const ordinaryToc = build_section_toc(workbody, 'hansenfj', poets);
    expect(ordinaryToc[0]).not.toHaveProperty('authorName');
    expect(ordinaryToc[1].content[0].authorName).toBe('Gæst');
  });

  it('medtager en prosatekst i værkets indholdsfortegnelse', () => {
    const doc = new DOMParser().parseFromString(
      `<kalliopework author="molbech">
        <workbody>
          <text id="molbech1851indledning">
            <head><title>Indledning</title></head>
            <body><prose>Prosatekst.</prose></body>
          </text>
        </workbody>
      </kalliopework>`,
      'text/xml'
    );

    const workbody = doc.getElementsByTagName('workbody')[0];
    const toc = build_section_toc(workbody, 'molbech');

    expect(toc).toHaveLength(1);
    expect(toc[0]).toMatchObject({
      type: 'text',
      id: 'molbech1851indledning',
    });
    expect(toc[0].title[0][0]).toBe('Indledning');
  });

  it('medtager en utitlet rolleliste med kun linktitle', () => {
    const doc = new DOMParser().parseFromString(
      `<kalliopework author="blicher"><workbody>
        <text id="rolelist" skip-index="true">
          <head><linktitle>Personer</linktitle></head>
          <body><prose>Sigurd Lejrekonge.</prose></body>
        </text>
      </workbody></kalliopework>`,
      'text/xml'
    );

    const toc = build_section_toc(
      getChildByTagName(doc.documentElement, 'workbody'),
      'blicher'
    );

    expect(toc).toHaveLength(1);
    expect(toc[0].id).toBe('rolelist');
    expect(toc[0].title[0][0]).toBe('Personer');
  });

  it('genkender en anden tekstforfatter', () => {
    expect(isAnthologyText('arnesen-kall', 'antologierdk')).toBe(true);
    expect(isAnthologyText('antologierdk', 'antologierdk')).toBe(false);
    expect(isAnthologyText(null, 'antologierdk')).toBe(false);
    expect(isAnthologyText('winther', null)).toBe(false);
  });

  it('opretter et virtuelt værk grupperet efter kildeudgivelsen', () => {
    const sourceWork = {
      id: '1872',
      title: 'Blade fra danske Kvinder',
      toctitle: { title: 'Blade fra danske Kvinder' },
      year: '1872',
      published: '1872',
      sourceFiles: [
        'fdirs/antologierdk/info.xml',
        'fdirs/antologierdk/1872.xml',
      ],
    };
    const collected = {
      works: new Map([['antologierdk/1872', sourceWork]]),
      texts: new Map([
        [
          'text-2',
          {
            id: 'text-2',
            poetId: 'arnesen-kall',
            workId: '1872',
            placement: 'canonical',
            sourcePoetId: 'antologierdk',
            sourceWorkId: '1872',
            sourceOrder: 2,
          },
        ],
        [
          'text-1',
          {
            id: 'text-1',
            poetId: 'arnesen-kall',
            workId: '1872',
            placement: 'canonical',
            sourcePoetId: 'antologierdk',
            sourceWorkId: '1872',
            sourceOrder: 1,
          },
        ],
      ]),
    };

    buildCollectionIndexes(collected);
    expect(worksForPoet(collected, 'arnesen-kall')).toEqual([]);
    buildVirtualAnthologyWorks(collected);

    const work = collected.works.get('arnesen-kall/antologier');
    expect(work).toMatchObject({
      id: 'antologier',
      title: 'Tekster i andre udgivelser',
      virtualType: 'anthology',
      textIds: ['text-1', 'text-2'],
    });
    expect(work.sections).toHaveLength(1);
    expect(work.sections[0].work).toBe(sourceWork);
    expect(work.sourceFiles).toEqual([
      'fdirs/arnesen-kall/info.xml',
      'fdirs/antologierdk/info.xml',
      'fdirs/antologierdk/1872.xml',
    ]);
    expect(worksForPoet(collected, 'arnesen-kall')).toEqual([work]);
    expect(workName(work.sections[0].work)).toBe(
      'Blade fra danske Kvinder (1872)'
    );
  });

  it('sorterer årbøger efter deres årstal, også når næste bind udkom året før', () => {
    const sources = [
      { id: '1846-gaea', title: 'Gæa', year: '1846', published: '1845-12' },
      { id: '1847-gaea', title: 'Gæa', year: '1847', published: '1847' },
      { id: '1845-gaea', title: 'Gæa', year: '1845', published: '1845' },
    ];
    const collected = {
      works: new Map(sources.map(work => [`antologierdk/${work.id}`, work])),
      texts: new Map(sources.map(work => [work.id, {
        id: work.id,
        poetId: 'oehlenschlaeger',
        workId: work.id,
        placement: 'canonical',
        sourcePoetId: 'antologierdk',
        sourceWorkId: work.id,
        sourceOrder: 1,
      }])),
    };
    buildVirtualAnthologyWorks(collected);
    const work = collected.works.get('oehlenschlaeger/antologier');
    expect(work.sections.map(section => section.work.year)).toEqual([
      '1845', '1846', '1847',
    ]);
  });

  it('placerer det virtuelle antologiværk efter Andre digte', () => {
    const works = [
      { id: 'antologier', title: 'Tekster i andre udgivelser' },
      { id: '1818', title: 'Digte', year: '1818' },
      { id: 'andre', title: 'Andre digte' },
    ];

    expect(sortWorks({ id: 'arnesen-kall' }, works).map(work => work.id)).toEqual(
      ['1818', 'andre', 'antologier']
    );
  });

  it('bruger udgivelses-id’er i 1872-antologiens indholdsfortegnelse', () => {
    const doc = loadXMLDoc('fdirs/antologierdk/1872.xml');
    const work = getElementByTagName(doc, 'kalliopework');
    const workbody = getChildByTagName(work, 'workbody');
    const toc = build_section_toc(workbody, 'antologierdk');

    expect(toc.slice(0, 3).map(item => item.id)).toEqual([
      'arnesen-kall2026102301',
      'arnesen-kall2026102302',
      'arnesen-kall2026102303',
    ]);
  });
});
