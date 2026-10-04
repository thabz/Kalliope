import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

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

describe('documented Jest test paths', () => {
  it('selects every explicitly named suite by its exact path', () => {
    const markdownFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true })
      .flatMap(entry => {
        const filename = path.join(directory, entry.name);
        return entry.isDirectory() ? markdownFiles(filename)
          : entry.name.endsWith('.md') ? [filename] : [];
      });
    const paths = [...new Set(
      [...markdownFiles(path.join(rootDir, 'docs')),
        ...markdownFiles(path.join(rootDir, '.agents', 'skills'))]
        .flatMap(filename =>
          fs.readFileSync(filename, 'utf8').match(/__tests__\/[\w./-]+\.test\.js/g) ?? []
        ),
    )];
    expect(paths.length).toBeGreaterThan(0);
    paths.forEach(testPath => {
      expect(fs.existsSync(path.join(rootDir, testPath))).toBe(true);
    });

    const selected = execFileSync(
      path.join(rootDir, 'node_modules', '.bin', 'jest'),
      ['--runInBand', '--runTestsByPath', '--listTests', ...paths],
      { cwd: rootDir, encoding: 'utf8' },
    ).trim().split('\n').sort();
    expect(selected).toEqual(paths.map(testPath => path.join(rootDir, testPath)).sort());
  });
});
