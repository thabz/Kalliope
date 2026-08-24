#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { analyzeRhyme, cleanRhymeWord } from './rhyme-analysis.js';
import { selectRhymeTrainingPoems, summarizeRhymeTrainingPoems } from './rhyme-corpus.js';

const modalPattern = patterns => {
  const counts = new Map();
  patterns.forEach(pattern => counts.set(pattern, (counts.get(pattern) ?? 0) + 1));
  const ranked = [...counts].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return {
    ambiguous: ranked.length > 1 && ranked[0][1] === ranked[1][1],
    hits: ranked[0]?.[1] ?? 0,
    pattern: ranked[0]?.[0] ?? '',
  };
};

export const evaluateRhymeCorpus = (rootDir = process.cwd(), { bootstrap = false } = {}) => {
  const poems = selectRhymeTrainingPoems(rootDir);
  const missingPairs = new Map();
  const extraPairs = new Map();
  const details = poems.map(poem => {
    const results = poem.stanzas.map(stanza =>
      analyzeRhyme([stanza], { bootstrap, minConfidence: 0 }));
    const mode = modalPattern(results.map(result => result.pattern));
    const lineCount = results.reduce((sum, result) => sum + result.lines.length, 0);
    const unmatched = results.reduce((sum, result) =>
      sum + (result.pattern.match(/X/gu) ?? []).length, 0);
    if (mode.ambiguous === false) results.forEach((result, stanzaIndex) => {
      for (let left = 0; left < result.lines.length; left += 1) {
        for (let right = left + 1; right < result.lines.length; right += 1) {
          if (mode.pattern[left] === 'X' || mode.pattern[right] === 'X') continue;
          const expected = mode.pattern[left] === mode.pattern[right];
          const observed = result.pattern[left] !== 'X' && result.pattern[left] === result.pattern[right];
          if (expected === observed) continue;
          const words = [cleanRhymeWord(poem.stanzas[stanzaIndex][left]),
            cleanRhymeWord(poem.stanzas[stanzaIndex][right])]
            .map(word => word?.toLocaleLowerCase('da-DK') ?? '-')
            .sort();
          const key = words.join('/');
          const target = expected ? missingPairs : extraPairs;
          target.set(key, (target.get(key) ?? 0) + 1);
        }
      }
    });
    return {
      ambiguous: mode.ambiguous,
      file: poem.file,
      hits: mode.hits,
      id: poem.id,
      lineCount,
      mode: mode.pattern,
      share: mode.hits / poem.stanzas.length,
      stanzas: poem.stanzas.length,
      unmatched,
    };
  });
  const totals = summarizeRhymeTrainingPoems(poems);
  const modalHits = details.reduce((sum, detail) => sum + detail.hits, 0);
  const unmatched = details.reduce((sum, detail) => sum + detail.unmatched, 0);
  return {
    summary: {
      ...totals,
      ambiguousPoems: details.filter(detail => detail.ambiguous).length,
      modalAgreement: Math.round(modalHits / Math.max(1, totals.stanzas) * 10000) / 10000,
      perfectPoems: details.filter(detail => detail.hits === detail.stanzas).length,
      xLineShare: Math.round(unmatched / Math.max(1, totals.lines) * 10000) / 10000,
    },
    outliers: {
      extra: [...extraPairs].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).slice(0, 30),
      missing: [...missingPairs].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])).slice(0, 30),
    },
    worst: details.sort((left, right) => left.share - right.share || right.stanzas - left.stanzas).slice(0, 30),
  };
};

if (process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1]) {
  const bootstrap = process.argv.includes('--bootstrap');
  console.log(JSON.stringify(evaluateRhymeCorpus(process.cwd(), { bootstrap }), null, 2));
}
