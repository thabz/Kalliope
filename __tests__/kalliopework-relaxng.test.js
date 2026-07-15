import fs from 'fs';
import { execFileSync } from 'child_process';

const trackedFiles = pattern =>
  execFileSync('git', ['ls-files', pattern], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

const kalliopeWorkFiles = () =>
  trackedFiles('fdirs/*/*.xml').filter(filename =>
    /<kalliopework[\s>]/.test(fs.readFileSync(filename, 'utf8'))
  );

describe('kalliopework RELAX NG schema', () => {
  it('validates all tracked work files', () => {
    const files = kalliopeWorkFiles();

    expect(files.length).toBeGreaterThan(0);

    try {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'data/kalliopework.rng', ...files],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
      );
    } catch (error) {
      throw new Error(error.stderr || error.message);
    }
  });
});
