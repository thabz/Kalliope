import fs from 'fs';
import os from 'os';
import path from 'path';
import { analyzeWorkXml, parseArgs, run } from '../tools/analyse-form.js';
import { classifyPoeticForm } from '../tools/form-analysis.js';
import { run as runPoeticForm } from '../tools/poetic-form.js';

const signals = ({
  metre = [{ pattern: 'iambic-pentameter', confidence: 0.91 }],
  rhyme = { pattern: 'ABBA ABBA CDC DCD', confidence: 0.96 },
  structure = { pattern: '4-4-3-3', confidence: 1 },
  syllables = [{ pattern: 'hendecasyllabic', confidence: 0.88 }],
} = {}) => ({ metre, rhyme, structure, syllables });

const workXml = ({ existingForm = '', pattern = 'ABBA ABBA CDC DCD' } = {}) => `
<kalliopework id="1900" author="digter">
<workhead><title>Digte</title><year>1900</year></workhead>
<workbody>
<text id="digter1900a">
<head>
  <title>Digt</title>
  <structure><analysis pattern="4-4-3-3" confidence="1.0"/></structure>
  <rhyme><analysis pattern="${pattern}" confidence="0.96"/></rhyme>
  <metre><analysis pattern="iambic-pentameter" confidence="0.91"/></metre>
  <syllables><analysis pattern="hendecasyllabic" confidence="0.88"/></syllables>
  ${existingForm}
</head>
<body><poetry>
En linje
</poetry></body>
</text>
</workbody>
</kalliopework>
`;

describe('klassifikation af sonetter', () => {
  it('identificerer en petrarcasonet ud fra uafhængige signaler', () => {
    const result = classifyPoeticForm(signals());

    expect(result.analyses).toContainEqual({ pattern: 'sonnet', confidence: 0.99 });
    expect(result.analyses).toContainEqual({ pattern: 'petrarchan-sonnet', confidence: 0.99 });
  });

  it('identificerer en shakespeare-sonet', () => {
    const result = classifyPoeticForm(signals({
      rhyme: { pattern: 'ABAB CDCD EFEF GG', confidence: 0.98 },
      structure: { pattern: '4-4-4-2', confidence: 1 },
    }));

    expect(result.analyses.find(analysis => analysis.pattern === 'sonnet').confidence)
      .toBeGreaterThanOrEqual(0.95);
    expect(result.analyses.find(analysis => analysis.pattern === 'shakespearean-sonnet').confidence)
      .toBeGreaterThanOrEqual(0.95);
  });

  it('identificerer en sonet uden eksplicitte strofegrænser uden at gætte subtype', () => {
    const result = classifyPoeticForm(signals({
      rhyme: { pattern: 'ABAB CDCD EFEF GG', confidence: 0.96 },
      structure: { pattern: '14', confidence: 1 },
    }));
    const sonnet = result.analyses.find(analysis => analysis.pattern === 'sonnet');
    const subtype = result.analyses.find(analysis => analysis.pattern === 'shakespearean-sonnet');

    expect(sonnet.confidence).toBeGreaterThanOrEqual(0.9);
    expect(subtype.confidence).toBeLessThan(0.8);
  });

  it('genkender en petrarcansk rimvariant uden eksplicitte strofegrænser', () => {
    const result = classifyPoeticForm(signals({
      rhyme: { pattern: 'ABBAABBACDDCEE', confidence: 1 },
      structure: { pattern: '14', confidence: 1 },
    }));

    expect(result.analyses.find(analysis => analysis.pattern === 'sonnet').confidence)
      .toBeGreaterThanOrEqual(0.85);
  });

  it('accepterer en dansk variant med et atypisk, men gennemgående rimskema', () => {
    const result = classifyPoeticForm(signals({
      rhyme: { pattern: 'ABAB BCCB CDC DCD', confidence: 0.9 },
    }));

    expect(result.analyses.find(analysis => analysis.pattern === 'sonnet').confidence)
      .toBeGreaterThanOrEqual(0.8);
    expect(result.analyses.filter(analysis =>
      analysis.pattern !== 'sonnet' && analysis.confidence >= 0.8)).toEqual([]);
  });

  it('giver ikke høj confidence til fjorten linjer alene', () => {
    const result = classifyPoeticForm(signals({
      metre: [{ pattern: 'trochaic-tetrameter', confidence: 0.9 }],
      rhyme: { pattern: 'XXXX XXXX XXX XXX', confidence: 0.45 },
      structure: { pattern: '7-7', confidence: 1 },
      syllables: [{ pattern: '8-syllable', confidence: 0.9 }],
    }));

    expect(result.lineCount).toBe(14);
    expect(result.analyses.find(analysis => analysis.pattern === 'sonnet').confidence)
      .toBeLessThan(0.8);
  });
});

describe('formanalyse i XML og CLI', () => {
  it('gemmer både overordnet form og en sikker subtype', () => {
    const result = analyzeWorkXml(workXml(), { minConfidence: 0.8 });

    expect(result.xml).toContain('<form>');
    expect(result.xml).toContain('pattern="sonnet" confidence="0.99"');
    expect(result.xml).toContain('pattern="petrarchan-sonnet" confidence="0.99"');
  });

  it('overskriver aldrig eksisterende formmetadata', () => {
    const curated = '<form><analysis pattern="sonnet" confidence="0.81"/></form>';
    const result = analyzeWorkXml(workXml({ existingForm: curated }), {
      minConfidence: 0.8,
      onlyMissing: true,
    });

    expect(result.reports[0].status).toBe('existing-form');
    expect(result.xml).toContain(curated);
    expect(result.xml.match(/<form>/g)).toHaveLength(1);
  });

  it('parser de dokumenterede valg', () => {
    expect(parseArgs([
      '--find', 'sonnet', '--only-missing', '--min-confidence', '0.85',
      '--poet', 'digter', '--debug',
    ])).toEqual({
      debug: true,
      dryRun: true,
      find: 'sonnet',
      form: 'sonnet',
      minConfidence: 0.85,
      onlyMissing: true,
      poet: 'digter',
      work: null,
    });
  });

  it('viser find-resultater sorteret og ændrer ikke XML', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-form-'));
    const poetDir = path.join(rootDir, 'fdirs', 'digter');
    fs.mkdirSync(poetDir, { recursive: true });
    fs.writeFileSync(path.join(poetDir, 'info.xml'), '<person id="digter" lang="da"/>');
    const strong = path.join(poetDir, '1900.xml');
    const weaker = path.join(poetDir, '1901.xml');
    fs.writeFileSync(strong, workXml());
    fs.writeFileSync(weaker, workXml({ pattern: 'ABAB BCCB CDC DCD' })
      .replace('id="1900"', 'id="1901"'));
    const originals = [strong, weaker].map(filename => fs.readFileSync(filename, 'utf8'));
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const result = run(['--find', 'sonnet', '--poet', 'digter'], rootDir);
      const output = log.mock.calls.map(call => call[0]);

      expect(result.candidates).toBe(2);
      expect(output[0]).toContain('1900.xml');
      expect(output[1]).toContain('1901.xml');
      expect([strong, weaker].map(filename => fs.readFileSync(filename, 'utf8'))).toEqual(originals);
    } finally {
      log.mockRestore();
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('viser forklaring og foreslået XML ved dry-run', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-form-'));
    const poetDir = path.join(rootDir, 'fdirs', 'digter');
    fs.mkdirSync(poetDir, { recursive: true });
    fs.writeFileSync(path.join(poetDir, 'info.xml'), '<person id="digter" lang="da"/>');
    const filename = path.join(poetDir, '1900.xml');
    fs.writeFileSync(filename, workXml());
    const original = fs.readFileSync(filename, 'utf8');
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      run(['--work', 'digter/1900.xml', '--dry-run', '--debug'], rootDir);
      const output = log.mock.calls.flat().join('\n');

      expect(output).toContain('SONNET: 0.99');
      expect(output).toContain('+ 14 lines');
      expect(output).toContain('Proposed XML:');
      expect(fs.readFileSync(filename, 'utf8')).toBe(original);
    } finally {
      log.mockRestore();
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('viser alle delanalyser pænt for ét digt-id', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-poetic-form-'));
    const poetDir = path.join(rootDir, 'fdirs', 'digter');
    fs.mkdirSync(poetDir, { recursive: true });
    fs.writeFileSync(path.join(poetDir, 'info.xml'), '<person id="digter" lang="da"/>');
    fs.writeFileSync(path.join(poetDir, '1900.xml'), workXml());
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      runPoeticForm(['digter1900a'], rootDir);
      const output = log.mock.calls.flat().join('\n');

      expect(output).toContain('Digt: digter1900a');
      expect(output).toContain('STRUKTUR');
      expect(output).toContain('RIM');
      expect(output).toContain('METRIK');
      expect(output).toContain('STAVELSER');
      expect(output).toContain('POETISK FORM');
      expect(output).toContain('BEGRUNDELSE');
    } finally {
      log.mockRestore();
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
