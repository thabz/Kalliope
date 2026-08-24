#!/usr/bin/env node
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { analyzeRhyme } from './rhyme-analysis.js';
import { selectRhymeTrainingPoems, summarizeRhymeTrainingPoems } from './rhyme-corpus.js';
import {
  bestCandidatePair,
  endingCandidates,
  rhymeModelFilename,
  rhymePairKey,
} from './rhyme-model.js';

const increment = (map, key, amount = 1) => map.set(key, (map.get(key) ?? 0) + amount);

// Redaktionelt bekræftede eksempler bruges som stabile ankre for sjældne rim,
// der ikke nødvendigvis forekommer i de lange træningsdigte.
const verifiedRhymes = [
  ['Tog', 'Laag'],
  ['formilde', 'Lille'],
  ['Verden', 'her er den'],
  ['skuer', 'luer'],
  ['ranker', 'banker'],
  ['skygget', 'rykket'],
  ['Graven', 'Paradishaven'],
  ['Ven', 'igjen'],
];

const verifiedNonRhymes = [
  ['skuer', 'ranker'],
  ['luer', 'banker'],
];

const modalPattern = patterns => {
  const counts = new Map();
  patterns.forEach(pattern => increment(counts, pattern));
  const ranked = [...counts].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  if (ranked.length === 0 || (ranked[1]?.[1] ?? 0) === ranked[0][1]) return null;
  return ranked[0][0];
};

const alignmentOperations = (left, right) => {
  const matrix = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
  for (let row = 0; row <= left.length; row += 1) matrix[row][0] = row;
  for (let column = 0; column <= right.length; column += 1) matrix[0][column] = column;
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
  }
  const operations = [];
  let row = left.length;
  let column = right.length;
  while (row > 0 || column > 0) {
    if (row > 0 && column > 0 && matrix[row][column] === matrix[row - 1][column - 1] &&
      left[row - 1] === right[column - 1]) {
      row -= 1;
      column -= 1;
    } else if (row > 0 && column > 0 && matrix[row][column] === matrix[row - 1][column - 1] + 1) {
      const pair = [left[row - 1], right[column - 1]].sort();
      operations.push(`${pair[0]}>${pair[1]}`);
      row -= 1;
      column -= 1;
    } else if (row > 0 && matrix[row][column] === matrix[row - 1][column] + 1) {
      operations.push(`>${left[row - 1]}`);
      row -= 1;
    } else {
      operations.push(`>${right[column - 1]}`);
      column -= 1;
    }
  }
  return operations;
};

const collectExamples = (poems, model = null) => {
  const positivePairs = new Map();
  const negativePairs = new Map();
  const positiveOperations = new Map();
  const negativeOperations = new Map();
  let labelledPoems = 0;
  poems.forEach(poem => {
    const analysis = analyzeRhyme(poem.stanzas, {
      bootstrap: model == null,
      minConfidence: 0,
      model,
    });
    const patterns = analysis.stanzaPatterns;
    const mode = modalPattern(patterns);
    if (mode == null) return;
    labelledPoems += 1;
    poem.stanzas.forEach(stanza => {
      const candidates = stanza.map(endingCandidates);
      for (let left = 0; left < stanza.length; left += 1) {
        for (let right = left + 1; right < stanza.length; right += 1) {
          if (mode[left] === 'X' || mode[right] === 'X') continue;
          const sameClass = mode[left] === mode[right];
          const best = bestCandidatePair(candidates[left], candidates[right], null);
          if (best == null) continue;
          const key = rhymePairKey(best.left.tail, best.right.tail);
          const pairMap = sameClass ? positivePairs : negativePairs;
          const operationMap = sameClass ? positiveOperations : negativeOperations;
          increment(pairMap, key);
          alignmentOperations(best.left.tail, best.right.tail).forEach(operation =>
            increment(operationMap, operation));
        }
      }
    });
  });
  [[verifiedRhymes, positivePairs, positiveOperations],
    [verifiedNonRhymes, negativePairs, negativeOperations]].forEach(([pairs, pairMap, operationMap]) => {
    pairs.forEach(([left, right]) => {
      const best = bestCandidatePair(endingCandidates(left), endingCandidates(right), null);
      if (best == null) return;
      increment(pairMap, rhymePairKey(best.left.tail, best.right.tail), 20);
      alignmentOperations(best.left.tail, best.right.tail).forEach(operation =>
        increment(operationMap, operation, 20));
    });
  });
  return {
    labelledPoems,
    negativeOperations,
    negativePairs,
    positiveOperations,
    positivePairs,
  };
};

const trainedPairs = examples => {
  const pairs = new Map([...examples.positivePairs].flatMap(([key, positive]) => {
    const negative = examples.negativePairs.get(key) ?? 0;
    const reliability = positive / Math.max(1, positive + negative);
    if (reliability < 0.8) return [];
    const support = Math.min(1, Math.log2(positive + 1) / 4);
    return [[key, Math.round((0.94 + support * 0.05) * 1000) / 1000]];
  }));
  verifiedRhymes.forEach(([left, right]) => {
    const best = bestCandidatePair(endingCandidates(left), endingCandidates(right), null);
    if (best != null) pairs.set(rhymePairKey(best.left.tail, best.right.tail), 0.995);
  });
  verifiedNonRhymes.forEach(([left, right]) => {
    const best = bestCandidatePair(endingCandidates(left), endingCandidates(right), null);
    if (best != null) pairs.delete(rhymePairKey(best.left.tail, best.right.tail));
  });
  return Object.fromEntries([...pairs].sort(([left], [right]) => left.localeCompare(right)));
};

const trainedOperations = examples => Object.fromEntries([...examples.positiveOperations]
  .flatMap(([operation, positive]) => {
    const negative = examples.negativeOperations.get(operation) ?? 0;
    const reliability = positive / Math.max(1, positive + negative);
    if (positive < 3 || reliability < 0.7) return [];
    const support = Math.min(1, Math.log10(positive + 1) / 3);
    const weight = Math.min(0.82, 0.2 + reliability * 0.42 + support * 0.2);
    return [[operation, Math.round(weight * 1000) / 1000]];
  })
  .sort(([left], [right]) => left.localeCompare(right)));

const trainIterations = poems => {
  let model = null;
  let previousFingerprint = null;
  let labelledPoems = 0;
  let iterations = 0;
  for (let iteration = 1; iteration <= 10; iteration += 1) {
    const examples = collectExamples(poems, model);
    const nextModel = {
      consensusFloor: 0.61,
      consensusSupport: 0.6,
      operations: trainedOperations(examples),
      pairs: trainedPairs(examples),
      threshold: 0.76,
    };
    const fingerprint = crypto.createHash('sha256')
      .update(JSON.stringify(nextModel))
      .digest('hex');
    model = nextModel;
    labelledPoems = examples.labelledPoems;
    iterations = iteration;
    if (fingerprint === previousFingerprint) break;
    previousFingerprint = fingerprint;
  }
  return { ...model, iterations, labelledPoems };
};

const scorePoems = (poems, model) => {
  let modalHits = 0;
  let rawModalHits = 0;
  let consensusAdjustedPairs = 0;
  let stanzas = 0;
  let unmatched = 0;
  let lines = 0;
  poems.forEach(poem => {
    const analysis = analyzeRhyme(poem.stanzas, { minConfidence: 0, model });
    const patterns = analysis.stanzaPatterns;
    const rawPatterns = analysis.rawStanzaPatterns;
    const counts = new Map();
    const rawCounts = new Map();
    patterns.forEach(pattern => increment(counts, pattern));
    rawPatterns.forEach(pattern => increment(rawCounts, pattern));
    modalHits += Math.max(...counts.values());
    rawModalHits += Math.max(...rawCounts.values());
    consensusAdjustedPairs += analysis.consensusAdjustedPairs;
    stanzas += patterns.length;
    patterns.forEach(pattern => { unmatched += (pattern.match(/X/gu) ?? []).length; });
    lines += patterns.length * poem.linesPerStanza;
  });
  return {
    lines,
    modalAgreement: Math.round(modalHits / Math.max(1, stanzas) * 10000) / 10000,
    rawModalAgreement: Math.round(rawModalHits / Math.max(1, stanzas) * 10000) / 10000,
    consensusAdjustedPairs,
    poems: poems.length,
    stanzas,
    xLineShare: Math.round(unmatched / Math.max(1, lines) * 10000) / 10000,
  };
};

export const trainRhymeModel = (rootDir = process.cwd()) => {
  const poems = selectRhymeTrainingPoems(rootDir);
  const summary = summarizeRhymeTrainingPoems(poems);
  const corpusHash = crypto.createHash('sha256');
  poems.forEach(poem => {
    corpusHash.update(`${poem.file}\0${poem.id}\0`);
    poem.stanzas.flat().forEach(line => corpusHash.update(`${line}\n`));
  });
  const validationPoems = poems.filter(poem =>
    crypto.createHash('sha256').update(poem.file).digest()[0] % 5 === 0);
  const developmentPoems = poems.filter(poem => validationPoems.includes(poem) === false);
  const developmentModel = trainIterations(developmentPoems);
  const validation = scorePoems(validationPoems, developmentModel);
  const model = trainIterations(poems);
  return {
    format: 1,
    corpus: {
      ...summary,
      fromYear: 1820,
      toYear: 1880,
      minStanzas: 9,
      minLinesPerStanza: 4,
      sha256: corpusHash.digest('hex'),
    },
    developmentPoems: developmentPoems.length,
    iterations: model.iterations,
    labelledPoems: model.labelledPoems,
    validation,
    validationPoems: validationPoems.length,
    ...model,
  };
};

export const writeRhymeModel = (model, filename = rhymeModelFilename) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const serialized = `${JSON.stringify(model)}\n`;
  fs.writeFileSync(filename, zlib.gzipSync(serialized, { level: 9, mtime: 0 }));
};

if (process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1]) {
  const model = trainRhymeModel();
  writeRhymeModel(model);
  console.log(JSON.stringify({
    corpus: model.corpus,
    developmentPoems: model.developmentPoems,
    validationPoems: model.validationPoems,
    validation: model.validation,
    labelledPoems: model.labelledPoems,
    iterations: model.iterations,
    operations: Object.keys(model.operations).length,
    pairs: Object.keys(model.pairs).length,
    output: path.relative(process.cwd(), rhymeModelFilename),
  }, null, 2));
}
