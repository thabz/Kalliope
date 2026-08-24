import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const script = fileURLToPath(new URL('../tools/analyse-structure.js', import.meta.url));

const createWork = poetry => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-structure-'));
  const directory = path.join(root, 'fdirs', 'digter');
  const filename = path.join(directory, '1900.xml');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(filename, `<kalliopework id="1900" author="digter">
<workhead><title>Digte</title><year>1900</year></workhead>
<workbody>
<text id="digter1900a">
<head>
  <firstline>Første linje</firstline>
</head>
<body>
${poetry}
</body>
</text>
</workbody>
</kalliopework>
`);
  return { filename, root };
};

const run = (root, args = []) => execFileSync(
  process.execPath,
  [script, ...args],
  { cwd: root, encoding: 'utf8' },
);

describe('structure analysis', () => {
  it('records explicit stanza lengths without classifying the verse form', () => {
    const stanzas = [4, 4, 3, 3]
      .map((length, stanza) => Array.from(
        { length },
        (_unused, line) => `Strofe ${stanza + 1}, linje ${line + 1}`,
      ).join('\n'))
      .join('\n\n');
    const { filename, root } = createWork(`<poetry>\n${stanzas}\n</poetry>`);

    run(root, ['--work', 'digter/1900.xml']);

    expect(fs.readFileSync(filename, 'utf8')).toContain(
      '<structure>\n    <analysis pattern="4-4-3-3" confidence="1.0"/>\n  </structure>',
    );
  });

  it('does not count semantic special lines, notes or page breaks as verse lines', () => {
    const { filename, root } = createWork(`<poetry>
<nonum><right>Til N. N.</right></nonum>
Første<note>Redaktionel note</note> linje
Anden linje
<versenum>II</versenum>
Tredje linje
<pb n="2" facs="002.jpg"/>Fjerde linje
<hr width="4"/>
Femte linje
Sjette linje
----
Syvende linje
Ottende linje
</poetry>`);

    const output = run(root, ['--work', filename, '--debug']);
    const xml = fs.readFileSync(filename, 'utf8');

    expect(xml).toContain('pattern="2-2-2-2" confidence="1.0"');
    expect(output).toContain('Lines: 8');
    expect(output).toContain('Stanzas: 4');
    expect(output).toContain('Empty lines: 0');
    expect(output).toContain('Special lines: 4');
    expect(output).toContain('Regular: yes');
  });

  it('keeps an uninterrupted fourteen-line poem as one stanza', () => {
    const lines = Array.from({ length: 14 }, (_unused, index) => `Linje ${index + 1}`);
    const { filename, root } = createWork(`<poetry>\n${lines.join('\n')}\n</poetry>`);

    run(root, ['--work', 'fdirs/digter/1900.xml']);

    expect(fs.readFileSync(filename, 'utf8')).toContain('pattern="14"');
  });

  it('supports dry-run and only-missing', () => {
    const { filename, root } = createWork('<poetry>\nEn\nTo\nTre\nFire\n</poetry>');
    const original = fs.readFileSync(filename, 'utf8');

    expect(run(root, ['--work', 'digter/1900.xml', '--dry-run']))
      .toContain('1 strukturanalyser foreslået i 1 værkfiler.');
    expect(fs.readFileSync(filename, 'utf8')).toBe(original);

    fs.writeFileSync(
      filename,
      original.replace(
        '</head>',
        '  <structure>\n    <analysis pattern="9" confidence="0.5"/>\n  </structure>\n</head>',
      ),
    );
    run(root, ['--work', 'digter/1900.xml', '--only-missing']);
    expect(fs.readFileSync(filename, 'utf8')).toContain('pattern="9"');

    run(root, ['--work', 'digter/1900.xml']);
    const refreshed = fs.readFileSync(filename, 'utf8');
    expect(refreshed).toContain('pattern="4" confidence="1.0"');
    expect(refreshed).not.toContain('pattern="9"');
    expect(refreshed).toContain(
      '<firstline>Første linje</firstline>\n  <structure>',
    );
  });
});
