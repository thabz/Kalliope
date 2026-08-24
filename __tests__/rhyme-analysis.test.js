import { analyzeRhyme } from '../tools/rhyme-analysis.js';
import { analyzeWorkXml } from '../tools/analyse-rhyme.js';

describe('rhyme analysis', () => {
  test('finds phonetic rhyme relations and preserves stanzas', () => {
    const result = analyzeRhyme([
      ['Jeg ser en rose', 'Ved havets rand', 'Den dufter sødt', 'Og står på land'],
      ['En anden rose', 'Som lyser klart'],
    ], { minConfidence: 0 });

    expect(result.pattern).toBe('ABXB AX');
    expect(result.confidence).toBeGreaterThan(0.75);
    expect(result.endings[1].method).toBe('phonetic-rules');
  });

  test('does not create a class for a single unrhymed line', () => {
    const result = analyzeRhyme([['land', 'strand', 'måne', 'strand']], { minConfidence: 0 });

    expect(result.pattern).toBe('AAXA');
  });

  test('uses the stressed vowel before a weak final e', () => {
    const result = analyzeRhyme([['skuer', 'ranker', 'banker', 'luer']], { minConfidence: 0 });

    expect(result.pattern).toBe('ABBA');
  });

  test('normalizes historical e and æ spellings in a rhyme nucleus', () => {
    const result = analyzeRhyme([['skuer', 'peger', 'sig', 'luer', 'bæger', 'mig']], { minConfidence: 0 });

    expect(result.pattern).toBe('ABCABC');
  });

  test('ignores a weak historical final e', () => {
    const result = analyzeRhyme([['Faa', 'forstaae', 'forbi', 'Melodie']], { minConfidence: 0 });

    expect(result.pattern).toBe('AABB');
  });

  test('normalizes silent d before a weak e', () => {
    const result = analyzeRhyme([['formilde', 'Lille']], { minConfidence: 0 });

    expect(result.pattern).toBe('AA');
  });

  test('does not overwrite existing rhyme metadata', () => {
    const xml = `<kalliopework><workbody><text id="x"><head><rhyme><analysis pattern="ABBA" confidence="0.91"/></rhyme></head><body><poetry>land
strand
land
strand</poetry></body></text></workbody></kalliopework>`;

    const result = analyzeWorkXml(xml, { minConfidence: 0 });

    expect(result.reports).toHaveLength(0);
    expect(result.xml).toBe(xml);
  });

  test('refresh replaces an existing analysis', () => {
    const xml = `<kalliopework><workbody><text id="x"><head><rhyme><analysis pattern="AAAA" confidence="1.00"/></rhyme></head><body><poetry>skuer
ranker
banker
luer</poetry></body></text></workbody></kalliopework>`;

    const result = analyzeWorkXml(xml, { minConfidence: 0, refresh: true });

    expect(result.reports[0].result.pattern).toBe('ABBA');
    expect(result.xml.match(/<rhyme>/g)).toHaveLength(1);
  });
});
