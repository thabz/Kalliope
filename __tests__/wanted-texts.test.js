import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { loadTrackedWorkFiles } from '../tools/libs/work-files.js';
import { resolveAuthorId } from '../tools/build-static/anthologies.js';
import { getChildByTagName } from '../tools/build-static/xml.js';
import { parseXml, checkWishes, reconcileWishes, loadPeople } from '../.agents/skills/add-kalliope-person/scripts/wanted-texts.js';
const person = (body = '<span data-wish="p-song"><i>Song</i></span>') => ({
  id: 'p', filename: 'fdirs/p/bio.xml',
  bio: parseXml(`<bio><biographies><biography><body>${body}</body></biography></biographies></bio>`),
});
const registry = () => ({version: 1, entries: [{id:'p-song', poetId:'p', title:'Song', source:'Printed biography, p. 3', status:'open', mentions:[{file:'fdirs/p/bio.xml',text:'Song'}]}]});
const texts = [{id:'song1',poet_id:'p',title:'Song'},{id:'song2',poet_id:'p',title:'Song'}];

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
});

it('validates the wanted-text register without generated datasets', () => {
  const people=loadPeople(process.cwd());
  const r=JSON.parse(fs.readFileSync('tools/data/wanted-texts.json','utf8'));
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
});

it('reconciles through the CLI only after validation, and rejects a later deleted target', async () => {
  const { default: os } = await import('node:os');
  const { default: path } = await import('node:path');
  const { gzipSync } = await import('node:zlib');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'kalliope-person-'));
  const tool=path.resolve('.agents/skills/add-kalliope-person/scripts/wanted-texts.js');
  try {
    for (const dir of ['fdirs/p','tools/data','public/api/v1']) fs.mkdirSync(path.join(root,dir),{recursive:true});
    fs.writeFileSync(path.join(root,'fdirs/p/info.xml'),'<person type="poet"/>');
    const xml='<bio><biographies><biography><body><span data-wish="p-song"><i>Song</i></span></body></biography></biographies></bio>';
    const bio=path.join(root,'fdirs/p/bio.xml');fs.writeFileSync(bio,xml);
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
