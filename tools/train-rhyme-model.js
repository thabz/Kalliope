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
  rhymeFeatureVector,
  rhymeModelFilename,
  rhymePairKey,
  sequenceRuleKey,
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

const modalPattern = (patterns, minShare = 0.6) => {
  const counts = new Map();
  patterns.forEach(pattern => increment(counts, pattern));
  const ranked = [...counts].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  if (ranked.length === 0 || (ranked[1]?.[1] ?? 0) === ranked[0][1]) return null;
  const share = ranked[0][1] / patterns.length;
  if (share < minShare) return null;
  return {
    deviations: patterns.length - ranked[0][1],
    hits: ranked[0][1],
    pattern: ranked[0][0],
    share,
  };
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
  const positiveSequences = new Map();
  const negativeSequences = new Map();
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
    const modeLabels = analysis.stanzaAnalyses[patterns.indexOf(mode.pattern)].labels;
    labelledPoems += 1;
    const deviationWeight = 1 / Math.max(1, mode.deviations);
    poem.stanzas.forEach((stanza, stanzaIndex) => {
      const stanzaWeight = patterns[stanzaIndex] === mode.pattern
        ? 1
        : 1 + deviationWeight;
      const candidates = stanza.map(endingCandidates);
      for (let left = 0; left < stanza.length; left += 1) {
        for (let right = left + 1; right < stanza.length; right += 1) {
          if (modeLabels[left] === 'X' || modeLabels[right] === 'X') continue;
          const sameClass = modeLabels[left] === modeLabels[right];
          const best = bestCandidatePair(candidates[left], candidates[right], null);
          if (best == null) continue;
          const key = rhymePairKey(best.left.tail, best.right.tail);
          const pairMap = sameClass ? positivePairs : negativePairs;
          const operationMap = sameClass ? positiveOperations : negativeOperations;
          const sequenceMap = sameClass ? positiveSequences : negativeSequences;
          increment(pairMap, key, stanzaWeight);
          alignmentOperations(best.left.tail, best.right.tail).forEach(operation =>
            increment(operationMap, operation, stanzaWeight));
          const sequence = sequenceRuleKey(best.left.tail, best.right.tail);
          if (sequence != null) increment(sequenceMap, sequence, stanzaWeight);
        }
      }
    });
  });
  [[verifiedRhymes, positivePairs, positiveOperations, positiveSequences],
    [verifiedNonRhymes, negativePairs, negativeOperations, negativeSequences]]
    .forEach(([pairs, pairMap, operationMap, sequenceMap]) => {
      pairs.forEach(([left, right]) => {
        const best = bestCandidatePair(endingCandidates(left), endingCandidates(right), null);
        if (best == null) return;
        increment(pairMap, rhymePairKey(best.left.tail, best.right.tail), 20);
        alignmentOperations(best.left.tail, best.right.tail).forEach(operation =>
          increment(operationMap, operation, 20));
        const sequence = sequenceRuleKey(best.left.tail, best.right.tail);
        if (sequence != null) increment(sequenceMap, sequence, 20);
      });
    });
  return {
    labelledPoems,
    negativeOperations,
    negativePairs,
    positiveOperations,
    positivePairs,
    positiveSequences,
    negativeSequences,
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

const trainedSequences = examples => Object.fromEntries([...examples.positiveSequences]
  .flatMap(([sequence, positive]) => {
    const negative = examples.negativeSequences.get(sequence) ?? 0;
    const reliability = positive / Math.max(1, positive + negative);
    if (positive < 1.5 || reliability < 0.8) return [];
    const support = Math.min(1, Math.log2(positive + 1) / 4);
    const score = Math.min(0.96, 0.73 + reliability * 0.15 + support * 0.08);
    return [[sequence, Math.round(score * 1000) / 1000]];
  })
  .sort(([left], [right]) => left.localeCompare(right)));

const classifierFeatureNames = [
  'bias', 'baseSimilarity', 'weightedSimilarity', 'sequenceScore',
  'lengthSimilarity', 'sameNucleus', 'sameFinal', 'sharedSuffix',
];

const trainClassifier = (examples, model) => {
  const keys = new Set([...examples.positivePairs.keys(), ...examples.negativePairs.keys()]);
  const rankedSamples = [...keys].map(key => {
    const [left, right] = key.split('\u0000');
    const positive = examples.positivePairs.get(key) ?? 0;
    const negative = examples.negativePairs.get(key) ?? 0;
    const total = positive + negative;
    return {
      features: rhymeFeatureVector(left, right, model),
      importance: Math.log2(total + 1),
      target: positive / Math.max(1, total),
    };
  }).sort((left, right) => right.importance - left.importance);
  const samples = [
    ...rankedSamples.filter(sample => sample.target >= 0.5).slice(0, 6000),
    ...rankedSamples.filter(sample => sample.target < 0.5).slice(0, 6000),
  ];
  let weights = [-4, 1.5, 2, 1.5, 0.2, 0.5, 0.3, 0.5];
  const totalImportance = samples.reduce((sum, sample) => sum + sample.importance, 0);
  for (let epoch = 0; epoch < 80; epoch += 1) {
    const gradient = Array(weights.length).fill(0);
    samples.forEach(sample => {
      const linear = sample.features.reduce((sum, feature, index) => sum + feature * weights[index], 0);
      const prediction = 1 / (1 + Math.exp(-linear));
      sample.features.forEach((feature, index) => {
        gradient[index] += (prediction - sample.target) * feature * sample.importance;
      });
    });
    const learningRate = 0.35 / (1 + epoch / 40);
    weights = weights.map((weight, index) => weight - learningRate *
      (gradient[index] / Math.max(1, totalImportance) + (index === 0 ? 0 : weight * 0.002)));
  }
  const scored = samples.map(sample => {
    const linear = sample.features.reduce((sum, feature, index) => sum + feature * weights[index], 0);
    return { ...sample, probability: 1 / (1 + Math.exp(-linear)) };
  });
  let bestThreshold = { precision: 1, recall: 0, value: 0.95 };
  for (let threshold = 0.8; threshold <= 0.95; threshold += 0.01) {
    let truePositive = 0;
    let falsePositive = 0;
    let falseNegative = 0;
    scored.forEach(sample => {
      const positive = sample.importance * sample.target;
      const negative = sample.importance * (1 - sample.target);
      if (sample.probability >= threshold) {
        truePositive += positive;
        falsePositive += negative;
      } else falseNegative += positive;
    });
    const precision = truePositive / Math.max(1, truePositive + falsePositive);
    const recall = truePositive / Math.max(1, truePositive + falseNegative);
    if (precision >= 0.95 && recall > bestThreshold.recall) {
      bestThreshold = { precision, recall, value: threshold };
    }
  }
  return {
    features: classifierFeatureNames,
    precision: Math.round(bestThreshold.precision * 10000) / 10000,
    recall: Math.round(bestThreshold.recall * 10000) / 10000,
    threshold: Math.round(bestThreshold.value * 100) / 100,
    weights: weights.map(weight => Math.round(weight * 10000) / 10000),
  };
};

const trainIterations = poems => {
  let model = null;
  let previousFingerprint = null;
  let labelledPoems = 0;
  let iterations = 0;
  for (let iteration = 1; iteration <= 10; iteration += 1) {
    const examples = collectExamples(poems, model);
    const operations = trainedOperations(examples);
    const sequences = trainedSequences(examples);
    const nextModel = {
      consensusFloor: 0.61,
      consensusSupport: 0.6,
      operations,
      pairs: trainedPairs(examples),
      sequences,
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
  const finalExamples = collectExamples(poems, model);
  const classifier = trainClassifier(finalExamples, model);
  return { ...model, classifier, iterations, labelledPoems };
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
    format: 2,
    corpus: {
      ...summary,
      fromYear: 1820,
      toYear: 1880,
      minStanzas: 5,
      minLinesPerStanza: 4,
      minModalShare: 0.6,
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
    sequences: Object.keys(model.sequences).length,
    classifier: model.classifier,
    output: path.relative(process.cwd(), rhymeModelFilename),
  }, null, 2));
}
