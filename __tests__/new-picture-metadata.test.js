import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { pictureRegistrations, newPictureErrors, validateRefs } from '../tools/validate-new-picture-metadata.js';

const mark = '<!-- metadata checked: 2026-11-06 -->';
const entries = (xml, filename = 'fdirs/test/portraits.xml') => pictureRegistrations(`<pictures>${xml}</pictures>`, filename);
const check = xml => newPictureErrors([], entries(xml));

describe('new picture metadata', () => {
  it('requires a checked comment on each new direct registration', () => {
    const result = check(`<picture src="p1.jpg">${mark}</picture><picture src="p2.jpg"/>`);
    expect(result.newCount).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('p2.jpg');
    expect(result.errors[0]).toContain('fdirs/test/portraits.xml:');
  });

  it.each([
    `<picture src="p1.jpg">${mark}</picture>`,
    `<picture src="p1.jpg"><description>Caption</description>${mark}</picture>`,
    `<picture src="p1.jpg"/> \n ${mark}`,
    '<picture src="p1.jpg"><!-- metadata checked: 2024-02-29 --></picture>',
  ])('accepts a valid attestation attached to the picture: %s', xml => {
    expect(check(xml).errors).toEqual([]);
  });

  it.each([
    '<picture src="p1.jpg">metadata checked: 2026-11-06</picture>',
    `${mark}<picture src="p1.jpg"/>`,
    `<picture src="p1.jpg"/><description>${mark}</description>`,
    `<picture src="p1.jpg"/><!-- source -->${mark}`,
    '<picture src="p1.jpg"><!-- metadata checked: 2025-02-29 --></picture>',
    '<picture src="p1.jpg"><!-- metadata checked: 2026-13-01 --></picture>',
    '<picture src="p1.jpg"><!-- metadata checked: 2026-11-31 --></picture>',
    '<picture src="p1.jpg"><!-- metadata checked: 2026-1-1 --></picture>',
  ])('rejects missing, misplaced or invalid attestations: %s', xml => {
    expect(check(xml).errors).toHaveLength(1);
  });

  it('does not borrow an adjacent picture attestation', () => {
    expect(check(`<picture src="p1.jpg"/><picture src="p2.jpg">${mark}</picture>`).errors).toHaveLength(1);
  });

  it('exempts references, title pages, scores and square-src derivatives', () => {
    expect(check('<picture artwork="test/a"/><picture portrait="test/p1"/><picture ref="test/a"/><picture src="title.jpg" type="titlepage"/><picture src="score.jpg" type="score"/><picture src="p1.jpg" square-src="p1-square.jpg">'+mark+'</picture>')).toEqual({ errors: [], newCount: 1 });
    expect(check('<picture src="art.jpg" type="illustration"/>').errors).toHaveLength(1);
    expect(check('<picture src="cover.jpg" type="frontpage"/>').errors).toHaveLength(1);
  });

  it('resolves implicit artwork paths and normalizes relative paths', () => {
    expect(entries('<picture id="a"/>', 'content/artwork.xml')[0].asset).toBe('/images/kunst/a.jpg');
    const base = entries('<picture src="./a.jpg"/>', 'fdirs/artist/portraits.xml');
    const head = entries('<picture id="a"/>', 'fdirs/artist/artwork.xml');
    expect(newPictureErrors(base, head).errors).toEqual([]);
    expect(newPictureErrors(base, entries('<picture src="/images/artist/a.jpg"/>')).errors).toEqual([]);
  });

  it('supports keywords, about pages, events and remote images', () => {
    for (const filename of ['content/keywords/a.xml', 'content/about/a.xml', 'content/events.xml', 'fdirs/test/events.xml', 'fdirs/test/1900.xml']) {
      expect(newPictureErrors([], entries('<picture src="a.jpg"/>', filename)).errors).toHaveLength(1);
    }
    expect(check(`<picture src="https://example.org/a.jpg">${mark}</picture>`).errors).toEqual([]);
    expect(check('<picture src="https://example.org/a.jpg"/>').errors).toHaveLength(1);
  });

  it('grandfathers registrations, not merely existing image files', () => {
    const base = entries('<picture src="p1.jpg"/>');
    expect(newPictureErrors(base, base).errors).toEqual([]);
    expect(newPictureErrors(base, [...base, ...base]).errors).toHaveLength(1);
    expect(newPictureErrors([], base).errors).toHaveLength(1);
    expect(newPictureErrors(base, entries('<picture src="p2.jpg"/>'), new Map([['/images/test/p1.jpg', '/images/test/p2.jpg']])).errors).toEqual([]);
  });

  it('rejects malformed XML', () => {
    expect(() => pictureRegistrations('<pictures><picture></pictures>', 'bad.xml')).toThrow('bad.xml');
  });
});

describe('Git revision comparison', () => {
  let directory;
  let previous;
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
  const write = (filename, contents) => {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, contents);
  };
  const commit = () => {
    git('add', '.');
    // Fixture identity is deliberately not an agent identity.
    git('commit', '-qm', 'Fixture');
    return git('rev-parse', 'HEAD');
  };
  beforeEach(() => {
    previous = process.cwd();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'picture-metadata-'));
    process.chdir(directory);
    git('init', '-q');
    const identity = (key, format) => {
      try {
        return execFileSync('git', ['config', '--get', key], { cwd: previous, encoding: 'utf8' }).trim();
      } catch {
        return execFileSync('git', ['log', '-1', `--format=${format}`], { cwd: previous, encoding: 'utf8' }).trim();
      }
    };
    const name = identity('user.name', '%an');
    const email = identity('user.email', '%ae');
    git('config', 'user.name', name);
    git('config', 'user.email', email);
  });
  afterEach(() => {
    process.chdir(previous);
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it('handles real image renames and registration moves, then rejects a new unchecked picture', () => {
    write('fdirs/test/portraits.xml', '<pictures><picture src="old.jpg"/></pictures>');
    write('public/images/test/old.jpg', 'image fixture');
    // An image file without a registration must not be grandfathered.
    write('public/images/test/new.jpg', 'new image fixture');
    const base = commit();
    git('mv', 'public/images/test/old.jpg', 'public/images/test/renamed.jpg');
    fs.unlinkSync('fdirs/test/portraits.xml');
    write('fdirs/test/artwork.xml', '<pictures><picture id="renamed"/></pictures>');
    const moved = commit();
    expect(validateRefs(base, moved)).toEqual({ errors: [], newCount: 0 });
    write('fdirs/test/1900.xml', '<pictures><picture src="new.jpg"/></pictures>');
    const added = commit();
    expect(validateRefs(base, added).errors).toHaveLength(1);
    write('fdirs/test/1900.xml', `<pictures><picture src="new.jpg">${mark}</picture></pictures>`);
    expect(validateRefs(base, commit())).toEqual({ errors: [], newCount: 1 });
    expect(() => validateRefs('nonexistent-ref', moved)).toThrow();
  });
});
