import { analyzeRhyme } from '../tools/rhyme-analysis.js';
import { analyzeWorkXml } from '../tools/analyse-rhyme.js';

describe('rhyme analysis', () => {
  test('finds rhyme relations and resets labels for each stanza', () => {
    const result = analyzeRhyme([
      ['Jeg ser en rose', 'Ved havets rand', 'En anden rose', 'Og står på land'],
      ['Det dufter af en rose', 'Hen over havets rand', 'En anden lille rose', 'Og ind imod et land'],
    ], { minConfidence: 0 });

    expect(result.pattern).toBe('ABAB ABAB');
    expect(result.confidence).toBeGreaterThan(0.75);
    expect(result.endings[1].method).toBe('exact-ending');
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
    expect(result.endings[0].method).toBe('corpus-pair');
  });

  test('recognizes the editorially confirmed historical rhyme Tog and Laag', () => {
    const result = analyzeRhyme([['Tog', 'Laag']], { minConfidence: 0 });

    expect(result.pattern).toBe('AA');
    expect(result.endings[0].method).toBe('corpus-pair');
  });

  test('recognizes a rhyme split across a word boundary', () => {
    const result = analyzeRhyme([['Verden!', 'her er den!']], { minConfidence: 0 });

    expect(result.pattern).toBe('AA');
    expect(result.endings[1].phrase).toBe('er den');
  });

  test('does not force unrelated endings into a rhyme class', () => {
    const result = analyzeRhyme([['måne', 'rose', 'hest', 'land']], { minConfidence: 0 });

    expect(result.pattern).toBe('XXXX');
  });

  test('normalizes historical g/t and aaer spellings', () => {
    const result = analyzeRhyme([['strakt', 'foragt', 'staaer', 'Haar']], { minConfidence: 0 });

    expect(result.pattern).toBe('AABB');
  });

  test('keeps stressed -aven apart from Ven and igjen', () => {
    const result = analyzeRhyme([['Graven', 'Ven', 'igjen', 'Paradishaven']], { minConfidence: 0 });

    expect(result.pattern).toBe('ABBA');
  });

  test('keeps orthographic fallback out of rhyme classes', () => {
    const result = analyzeRhyme([['qz', 'qz']], { minConfidence: 0 });

    expect(result.pattern).toBe('XX');
    expect(result.methods).toEqual(['unanalysable', 'unanalysable']);
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

  test('does not apply the Danish model to a non-Danish text', () => {
    const xml = `<kalliopework><workbody><text id="x" lang="en"><head/><body><poetry>land
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
