import { execFileSync } from 'child_process';

const infoXmlFiles = () =>
  execFileSync('git', ['ls-files', 'fdirs/*/info.xml'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

describe('info.xml RELAX NG schema', () => {
  it('validates all tracked info.xml files', () => {
    const files = infoXmlFiles();

    expect(files.length).toBeGreaterThan(0);

    try {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/info-xml.rng', ...files],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
      );
    } catch (error) {
      throw new Error(error.stderr || error.message);
    }
  });
});
