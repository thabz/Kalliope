import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { parseXMLFragment as parseXml } from '../../tools/build-static/xml.js';

const elements = (node, tag) => Array.from(node.getElementsByTagName(tag));
const person = (body = 'Biography') => ({
  id: 'p',
  info: parseXml('<person type="poet"/>'),
  bio: parseXml(`<bio><biographies><biography><body>${body}</body></biography></biographies></bio>`),
});

const sourceIds = ['dbl1', 'dbl2', 'salmonsen2', 'salmonsen-supplement', 'salmonsen4', 'erslew', 'ehrencron-mueller'];
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isNaN(Date.parse(value)) === false && new Date(value).toISOString().slice(0, 10) === value;
const hasBiography = doc => doc != null && elements(doc, 'biography')
  .some(entry => entry.getAttribute('hidden') !== 'true' &&
    elements(entry, 'body').some(body => body.textContent.trim().length > 0));

// Research evidence lives in source XML, outside the public bulk dataset.
const loadPeople = root => fs.readdirSync(path.join(root, 'fdirs'), { withFileTypes: true })
  .filter(entry => entry.isDirectory() === true && fs.existsSync(path.join(root, 'fdirs', entry.name, 'info.xml')))
  .map(entry => {
    const filename = `fdirs/${entry.name}/bio.xml`;
    return { id: entry.name,
      info: parseXml(fs.readFileSync(path.join(root, 'fdirs', entry.name, 'info.xml'), 'utf8')),
      bio: fs.existsSync(path.join(root, filename)) ? parseXml(fs.readFileSync(path.join(root, filename), 'utf8')) : null };
  });

const checkCoverage = people => {
  const errors = [];
  for (const person of people) {
    if (person.info.documentElement.getAttribute('type') === 'collection') continue;
    const statuses = elements(person.info, 'biography-status');
    const status = statuses[0];
    const hasBio = hasBiography(person.bio);
    if (statuses.length > 1) errors.push(`${person.id}: gentaget biography-status`);
    if (status != null) {
      const sources = elements(status, 'checked-source');
      if (status.getAttribute('status') !== 'not-found' || validDate(status.getAttribute('checked-on')) !== true ||
        sources.length === 0 || sources.some(source =>
          sourceIds.includes(source.getAttribute('id')) === false || source.textContent.trim().length === 0) ||
        elements(status, 'note').some(note => note.textContent.trim().length > 0) !== true) {
        errors.push(`${person.id}: ugyldig biography-status`);
      }
      if (hasBio === true) errors.push(`${person.id}: biografi og negativ status findes samtidig`);
    }
    if (hasBio === false && status == null) {
      errors.push(`${person.id}: mangler biografi eller dokumenteret negativ søgning`);
    }
  }
  return errors;
};

describe('biography coverage', () => {
  it.each(['poet', 'artist', 'person'])('requires a visible biography or documented research for every %s', type => {
    const p = person();
    p.info.documentElement.setAttribute('type', type);
    expect(checkCoverage([p])).toEqual([]);
    p.bio = null;
    expect(checkCoverage([p])).toEqual(['p: mangler biografi eller dokumenteret negativ søgning']);
    p.bio = person('  ').bio;
    expect(hasBiography(p.bio)).toBe(false);
    expect(checkCoverage([p])).toHaveLength(1);
    p.bio = person().bio;
    p.bio.getElementsByTagName('biography')[0].setAttribute('hidden', 'true');
    expect(hasBiography(p.bio)).toBe(false);
    expect(checkCoverage([p])).toHaveLength(1);
  });

  it('exempts collections', () => {
    const p = person();
    p.bio = null;
    p.info.documentElement.setAttribute('type', 'collection');
    expect(checkCoverage([p])).toEqual([]);
  });

  const negativeResearch = '<biography-status status="not-found" checked-on="2026-10-31"><checked-source id="dbl1">No matching entry</checked-source><note>Alphabetical entries checked</note></biography-status>';
  it('accepts documented negative research and rejects a simultaneous visible biography', () => {
    const p = person();
    p.bio = null;
    p.info = parseXml(`<person type="artist">${negativeResearch}</person>`);
    expect(checkCoverage([p])).toEqual([]);
    p.bio = person().bio;
    expect(checkCoverage([p]).join()).toMatch(/samtidig/);
  });

  it.each([
    ['impossible date', '2026-10-31', '2026-02-30'],
    ['wrong status', 'not-found', 'pending'],
    ['missing source', '<checked-source id="dbl1">No matching entry</checked-source>', ''],
    ['unknown source', 'dbl1', 'unapproved-source'],
    ['empty source description', 'No matching entry', '  '],
    ['empty reason', 'Alphabetical entries checked', '  '],
  ])('rejects negative research with %s', (_description, before, after) => {
    const p = person();
    p.bio = null;
    p.info = parseXml(`<person type="poet">${negativeResearch.replace(before, after)}</person>`);
    expect(checkCoverage([p])).toEqual(['p: ugyldig biography-status']);
  });

  it('rejects duplicate research statuses', () => {
    const p = person();
    p.bio = null;
    p.info = parseXml(`<person type="person">${negativeResearch}${negativeResearch}</person>`);
    expect(checkCoverage([p])).toEqual(['p: gentaget biography-status']);
  });

  it.each(['erslew', 'ehrencron-mueller'])('accepts a documented unsuccessful search in reserve source %s', sourceId => {
    const p = person();
    p.bio = null;
    const info = `<person id="p" country="dk" lang="da" type="poet"><name><lastname>P</lastname></name>${negativeResearch.replace('dbl1', sourceId)}</person>`;
    p.info = parseXml(info);
    expect(checkCoverage([p])).toEqual([]);
    expect(() => execFileSync('xmllint', ['--noout', '--relaxng', 'schemas/info-xml.rng', '-'], { input: info, stdio: ['pipe', 'pipe', 'pipe'] })).not.toThrow();
  });
});

it('requires biography or documented failed research for everyone in the corpus', () => {
  expect(checkCoverage(loadPeople(process.cwd()))).toEqual([]);
});

it('includes new, untracked person folders', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-biography-coverage-'));
  try {
    fs.mkdirSync(path.join(root, 'fdirs/new-person'), { recursive: true });
    fs.writeFileSync(path.join(root, 'fdirs/new-person/info.xml'), '<person type="poet"/>');
    expect(checkCoverage(loadPeople(root))).toEqual([
      'new-person: mangler biografi eller dokumenteret negativ søgning',
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

it('validates negative-status metadata and blank works against the actual schemas', () => {
  const info='<person id="p" country="dk" lang="da" type="poet"><name><lastname>P</lastname></name><biography-status status="not-found" checked-on="2026-10-31"><checked-source id="dbl1">No matching entry</checked-source><note>Nothing found</note></biography-status></person>';
  expect(() => execFileSync('xmllint',['--noout','--relaxng','schemas/info-xml.rng','-'],{input:info,stdio:['pipe','pipe','pipe']})).not.toThrow();
  expect(() => execFileSync('xmllint',['--noout','--relaxng','schemas/kalliopework.rng','-'],{input:'<kalliopework id="w" author="p" status="incomplete" type="poetry"><workhead><title>Collected Works</title><year>1900</year></workhead><workbody/></kalliopework>',stdio:['pipe','pipe','pipe']})).not.toThrow();
});
