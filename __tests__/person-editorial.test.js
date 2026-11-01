import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadTrackedWorkFiles } from '../tools/libs/work-files.js';
import { resolveAuthorId } from '../tools/build-static/anthologies.js';
import { getChildByTagName } from '../tools/build-static/xml.js';
import { parseXml, hasBiography, checkCoverage, checkWishes, reconcileWishes, stripWishMarkers, loadPeople } from '../tools/person-editorial.js';
const person = (body = '<span data-wish="p-song"><i>Song</i></span>') => ({
  id: 'p', filename: 'fdirs/p/bio.xml',
  info: parseXml('<person type="poet"/>'),
  bio: parseXml(`<bio><biographies><biography><body>${body}</body></biography></biographies></bio>`),
});
const registry = () => ({version: 1, entries: [{id:'p-song', poetId:'p', title:'Song', source:'Printed biography, p. 3', status:'open', mentions:[{file:'fdirs/p/bio.xml',text:'Song'}]}]});
const texts = [{id:'song1',poet_id:'p',title:'Song'},{id:'song2',poet_id:'p',title:'Song'}];

describe('person editorial coverage', () => {
  it('requires biography or evidence for new people, with a shrinking legacy exception', () => {
    const p=person();p.bio=null;
    expect(checkCoverage([p],[]).errors).toHaveLength(1);
    expect(checkCoverage([p],['p']).remaining).toEqual(['p']);
    p.bio=person().bio;
    expect(checkCoverage([p],['p']).errors).toHaveLength(1);
    expect(checkCoverage([p],[]).errors).toEqual([]);
  });
  it('accepts documented negative research but rejects impossible dates and conflicts', () => {
    const p=person();p.bio=null;
    p.info=parseXml('<person type="artist"><biography-status status="not-found" checked-on="2026-10-31"><checked-source id="dbl1"/><note>No entry</note></biography-status></person>');
    expect(checkCoverage([p],[]).errors).toEqual([]);
    p.bio=person().bio;
    expect(checkCoverage([p],[]).errors.join()).toMatch(/samtidig/);
    p.bio=null;p.info.documentElement.firstChild.setAttribute('checked-on','2026-02-30');
    expect(checkCoverage([p],[]).errors).toHaveLength(1);
  });
  it('exempts collections but not artists or other people; hidden and empty biographies do not suffice', () => {
    const p=person('');expect(hasBiography(p.bio)).toBe(false);
    p.bio=person().bio;p.bio.getElementsByTagName('biography')[0].setAttribute('hidden','true');
    expect(hasBiography(p.bio)).toBe(false);
    for (const type of ['artist','person']) {
      p.info.documentElement.setAttribute('type',type);expect(checkCoverage([p],[]).errors).toHaveLength(1);
    }
    p.info.documentElement.setAttribute('type','collection');expect(checkCoverage([p],[]).errors).toEqual([]);
  });
  it.each(['erslew', 'ehrencron-mueller'])('accepts a documented unsuccessful search in reserve source %s', sourceId => {
    const p = person();
    p.bio = null;
    const info = `<person id="p" country="dk" lang="da" type="poet"><name><lastname>P</lastname></name><biography-status status="not-found" checked-on="2026-11-01"><checked-source id="${sourceId}">No matching entry</checked-source><note>Preferred sources searched first</note></biography-status></person>`;
    p.info = parseXml(info);
    expect(checkCoverage([p], []).errors).toEqual([]);
    expect(() => execFileSync('xmllint', ['--noout', '--relaxng', 'schemas/info-xml.rng', '-'], { input: info, stdio: ['pipe', 'pipe', 'pipe'] })).not.toThrow();
    p.info.getElementsByTagName('checked-source')[0].setAttribute('id', 'unapproved-source');
    expect(checkCoverage([p], []).errors).toHaveLength(1);
  });
});

describe('wanted texts', () => {
  it('suggests ambiguous matches without automatically fulfilling them', () => {
    const r=registry();const people=[person()];
    expect(checkWishes(people,r,texts).candidates[0].candidates).toEqual(['song1','song2']);
    expect(reconcileWishes(people,r).size).toBe(0);
    expect(r.entries[0].status).toBe('open');
  });
  it('preserves words and nested typography, fulfills all mentions, and is idempotent', () => {
    const p=person('<span data-wish="p-song"><i>Song</i></span> and <span data-wish="p-song">Song</span>');
    const r=registry();r.entries[0].targetId='song1';
    expect(checkWishes([p],r,texts).errors).toEqual([]);
    const changes=reconcileWishes([p],r);
    expect(changes.get(p.filename)).toContain('<a poem="song1"><i>Song</i></a>');
    expect(p.bio.documentElement.textContent).toBe('Song and Song');
    expect(r.entries[0].status).toBe('fulfilled');
    expect(checkWishes([p],r,texts).errors).toEqual([]);
    expect(reconcileWishes([p],r).size).toBe(0);
    expect(checkWishes([p],r,[]).errors.join()).toMatch(/manglende mål/);
  });
  it('rejects unknown markers, missing mentions and wrong authors', () => {
    expect(checkWishes([person()],{version:1,entries:[]},texts).errors).toHaveLength(1);
    const r=registry();r.entries[0].targetId='other';
    expect(checkWishes([person()],r,[{id:'other',poet_id:'else'}]).errors.join()).toMatch(/forkert forfatter/);
    expect(checkWishes([person('Different')],registry(),texts).errors.join()).toMatch(/omtalen findes ikke/);
  });
  it('removes editorial wrappers from rendering without changing inner content', () => {
    expect(stripWishMarkers('A <span data-wish="p-song"><i>Song</i></span>.')).toBe('A <i>Song</i>.');
  });
});

it('validates the corpus and editorial registers without generated datasets, including untracked new people', () => {
  const people=loadPeople(process.cwd());
  const baseline=JSON.parse(fs.readFileSync('tools/data/biography-backlog.json','utf8'));
  const r=JSON.parse(fs.readFileSync('tools/data/wanted-texts.json','utf8'));
  expect(checkCoverage(people,baseline).errors).toEqual([]);
  // CI runs before build-static. Validate confirmed targets from source XML;
  // candidate discovery is tested with fixtures and remains a PR preparation step.
  const targetIds = new Set(r.entries.map(wish => wish.targetId).filter(id => id != null));
  const targets = targetIds.size === 0 ? [] : loadTrackedWorkFiles().flatMap(({ content }) => {
    const work = parseXml(content).documentElement;
    return Array.from(work.getElementsByTagName('text'))
      .filter(text => targetIds.has(text.getAttribute('id')) === true &&
        text.getAttribute('skip-index') !== 'true' &&
        getChildByTagName(text, 'body')?.textContent.trim().length > 0)
      .map(text => ({
        id: text.getAttribute('id'),
        poet_id: resolveAuthorId(text, work.getAttribute('author')),
      }));
  });
  expect(checkWishes(people,r,targets).errors).toEqual([]);
  let previous;
  try { previous=JSON.parse(execFileSync('git',['show','HEAD:tools/data/biography-backlog.json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})); } catch { previous=null; }
  if (previous != null) expect(baseline.filter(id=>previous.includes(id) === false)).toEqual([]);
});

it('validates negative-status metadata and blank works against the actual schemas', () => {
  const info='<person id="p" country="dk" lang="da" type="poet"><name><lastname>P</lastname></name><biography-status status="not-found" checked-on="2026-10-31"><checked-source id="dbl1"/><note>Nothing found</note></biography-status></person>';
  expect(() => execFileSync('xmllint',['--noout','--relaxng','schemas/info-xml.rng','-'],{input:info,stdio:['pipe','pipe','pipe']})).not.toThrow();
  expect(() => execFileSync('xmllint',['--noout','--relaxng','schemas/kalliopework.rng','-'],{input:'<kalliopework id="w" author="p" status="incomplete" type="poetry"><workhead><title>Collected Works</title><year>1900</year></workhead><workbody/></kalliopework>',stdio:['pipe','pipe','pipe']})).not.toThrow();
});

it('reconciles through the CLI only after validation, and rejects a later deleted target', async () => {
  const { default: os } = await import('node:os');
  const { default: path } = await import('node:path');
  const { gzipSync } = await import('node:zlib');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'kalliope-person-'));
  const tool=path.resolve('tools/person-editorial.js');
  try {
    for (const dir of ['fdirs/p','tools/data','public/api/v1']) fs.mkdirSync(path.join(root,dir),{recursive:true});
    fs.writeFileSync(path.join(root,'fdirs/p/info.xml'),'<person type="poet"/>');
    const xml='<bio><biographies><biography><body><span data-wish="p-song"><i>Song</i></span></body></biography></biographies></bio>';
    const bio=path.join(root,'fdirs/p/bio.xml');fs.writeFileSync(bio,xml);
    fs.writeFileSync(path.join(root,'tools/data/biography-backlog.json'),'[]');
    const r=registry();r.entries[0].targetId='missing';
    const file=path.join(root,'tools/data/wanted-texts.json');fs.writeFileSync(file,JSON.stringify(r));
    const bulk=path.join(root,'public/api/v1/texts.jsonl.gz');fs.writeFileSync(bulk,gzipSync(texts.map(t=>JSON.stringify(t)).join('\n')));
    const run=arg=>execFileSync(process.execPath,[tool,arg],{cwd:root,stdio:['ignore','pipe','pipe']});
    expect(()=>run('--reconcile')).toThrow();expect(fs.readFileSync(bio,'utf8')).toBe(xml);
    r.entries[0].targetId='song1';fs.writeFileSync(file,JSON.stringify(r));
    run('--reconcile');const linked=fs.readFileSync(bio,'utf8');
    expect(linked).toContain('<a poem="song1"><i>Song</i></a>');
    run('--reconcile');expect(fs.readFileSync(bio,'utf8')).toBe(linked);
    fs.writeFileSync(bulk,gzipSync(''));
    expect(()=>run('--check')).toThrow();
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
