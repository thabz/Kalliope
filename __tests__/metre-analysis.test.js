import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  analyzeLine,
  analyzePoem,
  countSyllables,
  poetryLinesFromXml,
} from '../tools/metre-analysis.js';
import {
  analyzeWorkXml,
  parseArgs,
  run,
} from '../tools/analyse-metre.js';

const corpus = JSON.parse(
  fs.readFileSync(new URL('./fixtures/metre-corpus.json', import.meta.url), 'utf8'),
);
const poemLines = corpus[0].lines.join('\n');
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
  <firstline>i nat på vej mod havets rand</firstline>
</head>
<body>
<poetry>
${poemLines}
</poetry>
</body>
</text>

</workbody>
</kalliopework>
`;

describe('metrisk analyse', () => {
  it.each(corpus)('klassificerer $name', ({ expected, lines }) => {
    const result = analyzePoem(lines, { minConfidence: 0.75 });

    expect(result.analyses.map(analysis => analysis.pattern)).toEqual(expected);
    expect(result.analyses.every(analysis =>
      analysis.confidence >= 0 && analysis.confidence <= 1,
    )).toBe(true);
  });

  it('kræver mere evidens end to regelmæssige linjer', () => {
    const result = analyzePoem(['i nat på vej', 'ved dag på sti']);

    expect(result.reason).toBe('too-few-lines');
    expect(result.analyses).toEqual([]);
  });

  it('tåler en afvigende linje i et ellers regelmæssigt digt', () => {
    const regular = corpus[0].lines;
    const result = analyzePoem([...regular, 'Pludselig står alting ganske stille her']);

    expect(result.analyses[0].pattern).toBe('iambic-tetrameter');
  });

  it.each([
    ['Kiærlighed', 3],
    ['Hiertet', 2],
    ['Byens', 2],
    ['Hav', 1],
    ['Aar', 1],
  ])('tæller stavelser i %s', (word, expected) => {
    expect(countSyllables(word)).toBe(expected);
  });

  it('udleder stavelsesantal og sandsynligt tryk for en linje', () => {
    const line = analyzeLine('i nat på vej');

    expect(line.syllables).toBe(4);
    expect(line.stress[0]).toBeLessThan(line.stress[1]);
    expect(line.stress[2]).toBeLessThan(line.stress[3]);
  });

  it('udelader redaktionelle linjer, noter og sideskift', () => {
    const lines = poetryLinesFromXml(`<poetry>
<nonum><center>I</center></nonum>
Første <i>verslinje</i><note>lang
note</note>
<pb n="2" facs="001.jpg"/>Anden verslinje
----</poetry>`);

    expect(lines).toEqual(['Første verslinje', 'Anden verslinje']);
  });
});

describe('XML-opdatering', () => {
  it('indsætter analyser sorteret efter faldende confidence', () => {
    const result = analyzeWorkXml(workXml);
    const confidences = result.reports[0].result.analyses
      .map(analysis => analysis.confidence);

    expect(result.xml).toContain('<metre>\n    <analysis pattern="iambic-tetrameter"');
    expect(confidences).toEqual([...confidences].sort((a, b) => b - a));
  });

  it('overskriver ikke eksisterende manuelt kurateret metadata', () => {
    const curated = workXml.replace(
      '</head>',
      '<metre>\n  <analysis pattern="manual-pattern" confidence="1.00"/>\n</metre>\n</head>',
    );
    const result = analyzeWorkXml(curated);

    expect(result.reports[0].status).toBe('existing-metre');
    expect(result.xml).toContain('pattern="manual-pattern"');
    expect(result.xml).not.toContain('pattern="iambic-tetrameter"');
  });

  it('respekterer en konfigurerbar tærskel', () => {
    const result = analyzeWorkXml(workXml, { minConfidence: 0.99 });

    expect(result.reports[0].status).toBe('below-threshold');
    expect(result.xml).not.toContain('<metre>');
  });

  it('springer eksplicit fremmedsprogede tekster over', () => {
    const english = workXml.replace('<text id="digter1900a">', '<text id="digter1900a" lang="en">');
    const result = analyzeWorkXml(english);

    expect(result.reports[0].status).toBe('unsupported-language:en');
    expect(result.xml).not.toContain('<metre>');
  });
});

describe('CLI-options', () => {
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

  it('viser debug-forslag uden at skrive i dry-run', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-metre-'));
    const poetDir = path.join(rootDir, 'fdirs', 'digter');
    fs.mkdirSync(poetDir, { recursive: true });
    fs.writeFileSync(
      path.join(poetDir, 'info.xml'),
      '<person id="digter" lang="da"/>',
    );
    const filename = path.join(poetDir, '1900.xml');
    fs.writeFileSync(filename, workXml);
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const result = run(['--work', 'digter/1900.xml', '--dry-run', '--debug'], rootDir);

      expect(result).toEqual({ changedFiles: 1, proposedPoems: 1 });
      expect(fs.readFileSync(filename, 'utf8')).toBe(workXml);
      expect(log.mock.calls.flat().join('\n')).toContain('Proposed XML:');
    } finally {
      log.mockRestore();
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
