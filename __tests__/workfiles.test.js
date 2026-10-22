import fs from 'fs';
import os from 'os';
import path from 'path';
import { classifyPoetXml, discoverPoetFiles } from '../tools/libs/poet-files.js';
import { sortWorks } from '../common/worksort.js';

describe('automatic work discovery', () => {
  let rootDir;
  const write = (name, xml) => fs.writeFileSync(path.join(rootDir, 'fdirs/poet', name), xml);
  const work = (id, attributes = '') => `<kalliopework id="${id}" author="poet" ${attributes}><workhead><title>Test</title></workhead></kalliopework>`;
  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-workfiles-'));
    fs.mkdirSync(path.join(rootDir, 'fdirs/poet'), { recursive: true });
    write('info.xml', '<person id="poet"/>');
  });
  afterEach(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  it('discovers incomplete works, subworks and anthologies without a works list', () => {
    write('one.xml', work('one', 'status="incomplete"'));
    write('two.xml', work('two', 'parent="one"'));
    write('anthology.xml', work('anthology', 'type="anthology"'));
    write('bio.xml', '<bio/>');
    expect(discoverPoetFiles(['poet'], { rootDir }).workids.get('poet'))
      .toEqual(['anthology', 'one', 'two']);
  });

  it('reuses classifications without reading unchanged XML and detects additions, edits and deletions', () => {
    write('one.xml', work('one'));
    const first = discoverPoetFiles(['poet'], { rootDir });
    const readFile = jest.fn(fs.readFileSync);
    const second = discoverPoetFiles(['poet'], { rootDir, previous: first.cache, readFile });
    expect(readFile).not.toHaveBeenCalled();
    expect([...second.changedPoetIds]).toEqual([]);
    write('two.xml', work('two'));
    const added = discoverPoetFiles(['poet'], { rootDir, previous: second.cache });
    expect([...added.changedPoetIds]).toEqual(['poet']);
    expect(added.workids.get('poet')).toEqual(['one', 'two']);
    write('one.xml', work('one', 'sort-order="10"'));
    const edited = discoverPoetFiles(['poet'], { rootDir, previous: added.cache });
    expect([...edited.changedPoetIds]).toEqual(['poet']);
    fs.unlinkSync(path.join(rootDir, 'fdirs/poet/one.xml'));
    const deleted = discoverPoetFiles(['poet'], { rootDir, previous: edited.cache });
    expect([...deleted.changedPoetIds]).toEqual(['poet']);
    expect(deleted.workids.get('poet')).toEqual(['two']);
    fs.unlinkSync(path.join(rootDir, 'fdirs/poet/two.xml'));
    const empty = discoverPoetFiles(['poet'], { rootDir, previous: deleted.cache });
    expect(empty.workids.get('poet')).toEqual([]);
    expect([...empty.changedPoetIds]).toEqual(['poet']);
  });

  it('keeps work output cached when only file timestamps change', () => {
    write('one.xml', work('one'));
    const first = discoverPoetFiles(['poet'], { rootDir });
    const filename = path.join(rootDir, 'fdirs/poet/one.xml');
    const date = new Date(Date.now() + 10000);
    fs.utimesSync(filename, date, date);
    const second = discoverPoetFiles(['poet'], { rootDir, previous: first.cache });
    expect([...second.changedPoetIds]).toEqual([]);
  });

  it('rebuilds the registry when the discovery cache is missing or obsolete', () => {
    write('one.xml', work('one'));
    expect([...discoverPoetFiles(['poet'], { rootDir, previous: { version: 0 } }).changedPoetIds])
      .toEqual(['poet']);
  });

  it.each([
    ['leftover.xml', '<links/>', 'ukendt XML-fil'],
    ['links.xml', '<links/>', 'ukendt XML-fil'],
    ['bio.xml', '<pictures/>', 'forventede <bio>'],
    ['one.xml', work('wrong'), 'id og author'],
    ['one.xml', '<kalliopework id="one" author="other"/>', 'id og author'],
  ])('rejects unusable XML: %s', (filename, xml, message) => {
    expect(() => classifyPoetXml(`fdirs/poet/${filename}`, xml)).toThrow(message);
  });

  it.each(['0', '-1', '1.5', 'abc', '9007199254740992'])('rejects invalid sort-order %s', value => {
    expect(() => classifyPoetXml('fdirs/poet/one.xml', work('one', `sort-order="${value}"`)))
      .toThrow('sort-order');
  });

  it('rejects duplicate sort orders and names both files', () => {
    write('one.xml', work('one', 'sort-order="10"'));
    write('two.xml', work('two', 'sort-order="10"'));
    expect(() => discoverPoetFiles(['poet'], { rootDir })).toThrow(/one.xml.*two.xml|two.xml.*one.xml/);
  });

  it('uses explicit order ahead of year sorting and preserves trailing collections', () => {
    const works = [
      { id: 'antologier', virtualType: 'anthology' },
      { id: 'andre' },
      { id: 'later', year: '1900' },
      { id: 'second', sort_order: 20 },
      { id: 'first', sort_order: 10 },
      { id: 'earlier', year: '1800' },
    ];
    expect(sortWorks({ id: 'poet' }, works).map(item => item.id))
      .toEqual(['first', 'second', 'earlier', 'later', 'andre', 'antologier']);
    expect(works[0].id).toBe('antologier');
  });
});
