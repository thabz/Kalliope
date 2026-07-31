import {
  findVariantCandidates,
  jaccardSimilarity,
  normalizeText,
  pairKey,
} from '../tools/report-variant-candidates.js';

describe('variant candidate helpers', () => {
  it('normalizes case, accents, punctuation, and whitespace', () => {
    expect(normalizeText('  Én rædselsfuld—Time! ')).toBe(
      'enrædselsfuldtime'
    );
  });

  it('calculates Jaccard similarity', () => {
    expect(
      jaccardSimilarity(
        new Set(['en', 'to', 'tre']),
        new Set(['to', 'tre', 'fire'])
      )
    ).toBe(0.5);
    expect(jaccardSimilarity(new Set(), new Set(['en']))).toBe(0);
  });

  it('creates stable, symmetric pair keys', () => {
    expect(pairKey('b', 'a')).toBe(pairKey('a', 'b'));
  });

  it('finds unlinked candidates in a selected poet fixture', () => {
    const candidates = findVariantCandidates({
      rootDir: process.cwd(),
      poetIds: ['andersen'],
      includeReviewed: true,
    });
    expect(
      candidates.every(candidate => candidate.author === 'andersen')
    ).toBe(true);
    expect(
      candidates.some(candidate =>
        candidate.texts.some(text => text.id === 'andersen2017110711')
      )
    ).toBe(false);
  });
});
