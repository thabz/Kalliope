import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  analyzeSyllables,
  estimateLine,
  estimateWord,
} from '../tools/poetic-form/syllable-analysis.js';
import {
  analyzeWorkXml,
  parseArgs,
  run,
} from '../tools/poetic-form/analyse-syllables.js';

const elevenSyllables = 'Skoven vågner under månens stille lys';
const tenSyllables = 'Skoven vågner under månens stille';
const poem = Array.from({ length: 14 }, () => elevenSyllables).join('\n');
const workXml = `<?xml version="1.0" encoding="UTF-8"?>
<kalliopework id="1900" author="digter">
<workhead>
  <title>Digte</title>
  <year>1900</year>
</workhead>
<workbody>
<text id="digter1900a">
<head>
  <title>Digt</title>
</head>
<body>
<poetry>
${poem}
</poetry>
</body>
</text>

</workbody>
</kalliopework>
`;

describe('stavelsesanalyse', () => {
  it.each([
    ['Kiærlighed', 3],
    ['Hiertet', 2],
    ['Aar', 1],
    ["ev'rig", 2],
    ['Xyzzy', 2],
  ])('tæller moderne, historiske og ukendte ord: %s', (word, expected) => {
    expect(estimateWord(word).syllables).toBe(expected);
  });

  it('estimerer stavelsesantal og sikkerhed for en hel linje', () => {
    const result = estimateLine(elevenSyllables);

    expect(result.syllables).toBe(11);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('finder et gennemgående hendekasyllabisk mønster', () => {
    const result = analyzeSyllables(Array.from({ length: 14 }, () => elevenSyllables), {
      minConfidence: 0.8,
    });

    expect(result.analyses[0].pattern).toBe('hendecasyllabic');
    expect(result.analyses[0].matchingLines).toBe(14);
    expect(result.analyses[0].confidence).toBeGreaterThan(0.9);
  });

  it('gemmer flere plausible analyser ved maskulin og feminin variation', () => {
    const lines = [
      ...Array.from({ length: 7 }, () => tenSyllables),
      ...Array.from({ length: 7 }, () => elevenSyllables),
    ];
    const result = analyzeSyllables(lines, { minConfidence: 0.8 });

    expect(result.analyses.map(analysis => analysis.pattern)).toEqual([
      'decasyllabic',
      'hendecasyllabic',
    ]);
  });

  it('kræver mindst fire brugbare linjer', () => {
    const result = analyzeSyllables([
      elevenSyllables,
      elevenSyllables,
      elevenSyllables,
    ]);

    expect(result.reason).toBe('too-few-lines');
    expect(result.analyses).toEqual([]);
  });
});

describe('XML og CLI', () => {
  it('indsætter analyser sorteret efter faldende confidence', () => {
    const result = analyzeWorkXml(workXml);
    const confidences = result.reports[0].result.analyses
      .map(analysis => analysis.confidence);

    expect(result.xml).toContain(
      '<syllables>\n    <analysis pattern="hendecasyllabic"',
    );
    expect(confidences).toEqual([...confidences].sort((left, right) => right - left));
  });

  it('overskriver ikke eksisterende manuelt kurateret metadata', () => {
    const curated = workXml.replace(
      '</head>',
      '<syllables>\n  <analysis pattern="manual-pattern" confidence="1.00"/>\n' +
        '</syllables>\n</head>',
    );
    const result = analyzeWorkXml(curated);

    expect(result.reports[0].status).toBe('existing-syllables');
    expect(result.xml).toContain('pattern="manual-pattern"');
    expect(result.xml).not.toContain('pattern="hendecasyllabic"');
  });

  it('springer fremmedsprogede tekster over', () => {
    const english = workXml.replace(
      '<text id="digter1900a">',
      '<text id="digter1900a" lang="en">',
    );
    const result = analyzeWorkXml(english);

    expect(result.reports[0].status).toBe('unsupported-language:en');
    expect(result.xml).not.toContain('<syllables>');
  });

  it('parser udvalg, dry-run, debug og tærskel', () => {
    expect(parseArgs([
      '--poet', 'oehlenschlaeger', '--dry-run', '--debug',
      '--only-missing', '--min-confidence', '0.8',
    ])).toEqual({
      debug: true,
      dryRun: true,
      minConfidence: 0.8,
      onlyMissing: true,
      poet: 'oehlenschlaeger',
      work: null,
    });
  });

  it('afviser en tærskel uden for intervallet', () => {
    expect(() => parseArgs(['--min-confidence', '1.1'])).toThrow(
      '--min-confidence skal være et tal mellem 0 og 1.',
    );
  });

  it('viser linjedebug uden at skrive i dry-run', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-syllables-'));
    const poetDir = path.join(rootDir, 'fdirs', 'digter');
    fs.mkdirSync(poetDir, { recursive: true });
    fs.writeFileSync(path.join(poetDir, 'info.xml'), '<person id="digter" lang="da"/>');
    const filename = path.join(poetDir, '1900.xml');
    fs.writeFileSync(filename, workXml);
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const result = run([
        '--work', 'digter/1900.xml', '--dry-run', '--debug',
        '--min-confidence', '0.8',
      ], rootDir);

      expect(result).toEqual({ changedFiles: 1, proposedPoems: 1 });
      expect(fs.readFileSync(filename, 'utf8')).toBe(workXml);
      expect(log.mock.calls.flat().join('\n')).toContain(
        '01  11  Skoven vågner under månens stille lys',
      );
    } finally {
      log.mockRestore();
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('skriver metadata én gang og bevarer den ved --only-missing', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-syllables-'));
    const poetDir = path.join(rootDir, 'fdirs', 'digter');
    fs.mkdirSync(poetDir, { recursive: true });
    fs.writeFileSync(path.join(poetDir, 'info.xml'), '<person id="digter" lang="da"/>');
    const filename = path.join(poetDir, '1900.xml');
    fs.writeFileSync(filename, workXml);
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      expect(run(['--work', 'digter/1900.xml'], rootDir))
        .toEqual({ changedFiles: 1, proposedPoems: 1 });
      const first = fs.readFileSync(filename, 'utf8');
      expect(first.match(/<syllables>/g)).toHaveLength(1);

      expect(run(['--work', 'digter/1900.xml', '--only-missing'], rootDir))
        .toEqual({ changedFiles: 0, proposedPoems: 0 });
      expect(fs.readFileSync(filename, 'utf8')).toBe(first);
    } finally {
      log.mockRestore();
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
