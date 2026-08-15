import { DOMParser } from '@xmldom/xmldom';
import {
  ANTHOLOGY_WORK_ID,
  buildVirtualAnthologyWorks,
  isAnthologyText,
  publicationTextId,
  resolveAuthorId,
  sourceWorkFilename,
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

  it('bruger udgivelses-id for tekster i en forfattersektion', () => {
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

    expect(toc[0].content[0].id).toBe('solnedganga');
  });

  it('genkender en anden tekstforfatter og danner udgivelses-id', () => {
    expect(isAnthologyText('arnesen-kall', 'antologierdk')).toBe(true);
    expect(isAnthologyText('antologierdk', 'antologierdk')).toBe(false);
    expect(isAnthologyText(null, 'antologierdk')).toBe(false);
    expect(publicationTextId('antologierdk2026071901')).toBe(
      'antologierdk2026071901a'
    );
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
            workId: ANTHOLOGY_WORK_ID,
            placement: 'author',
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
            workId: ANTHOLOGY_WORK_ID,
            placement: 'author',
            sourcePoetId: 'antologierdk',
            sourceWorkId: '1872',
            sourceOrder: 1,
          },
        ],
      ]),
    };

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
    expect(sourceWorkFilename(work.sections[0].texts[0])).toBe(
      'fdirs/antologierdk/1872.xml'
    );
    expect(workName(work.sections[0].work)).toBe(
      'Blade fra danske Kvinder (1872)'
    );
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
      'antologierdk2026071901a',
      'antologierdk2026071902a',
      'antologierdk2026071903a',
    ]);
  });
});
