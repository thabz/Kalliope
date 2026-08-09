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
  it('accepts page-break declarations and facsimile filenames', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead>
          <title>Digte</title>
          <year>1900</year>
          <pagebreaks/>
        </workhead>
        <workbody>
          <text id="digter1900a">
            <head><firstline>Første linje</firstline></head>
            <body><poetry>Første linje
<pb n="2" facs="019.jpg"/>Anden linje</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;

    expect(() => {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'],
        { input: xml, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
    }).not.toThrow();
  });

  it('validates all tracked work files', () => {
    const files = kalliopeWorkFiles();

    expect(files.length).toBeGreaterThan(0);

    try {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/kalliopework.rng', ...files],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
      );
    } catch (error) {
      throw new Error(error.stderr || error.message);
    }
  });
});
