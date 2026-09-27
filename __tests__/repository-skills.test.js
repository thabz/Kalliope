import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const portableSkills = [
  'add-kalliope-work',
  'add-translation-original',
  'pdf-to-kalliope',
  'prepare-fraktur-ocr',
  'prepare-kalliope-titlepage',
];

describe('portable repository skills', () => {
  it('uses .agents/skills as the only source directory', () => {
    expect(fs.existsSync(path.join(rootDir, '.codex', 'skills'))).toBe(false);
    portableSkills.forEach(skill => {
      expect(fs.existsSync(
        path.join(rootDir, '.agents', 'skills', skill, 'SKILL.md'),
      )).toBe(true);
    });
  });

  it.each(portableSkills)('exposes %s to Claude through a relative symlink', skill => {
    const link = path.join(rootDir, '.claude', 'skills', skill);
    expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
    expect(fs.readlinkSync(link)).toBe(`../../.agents/skills/${skill}`);
    expect(fs.existsSync(path.join(link, 'SKILL.md'))).toBe(true);
  });
});
