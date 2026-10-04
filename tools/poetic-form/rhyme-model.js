import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const WORD = /[\p{L}]+(?:['’][\p{L}]+)?/gu;
const VOWELS = 'aeiouyæøå';
const MODEL_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'rhyme', 'corpus-model.json.gz');
const FINAL_STRESS_WORDS = new Set(['igen', 'igjen']);
let cachedModel;

const normalizeText = value => value
  .toLocaleLowerCase('da-DK')
  .replace(/[’']/gu, '')
  .replace(/[^\p{L}|]/gu, '');

const tailFromPhrase = phrase => {
  const value = normalizeText(phrase);
  const indexes = [...value].flatMap((character, index) =>
    VOWELS.includes(character) ? [index] : []);
  if (indexes.length === 0) return null;
  const finalWord = value.split('|').at(-1) ?? value;
  const weakEnding = (finalWord.endsWith('e') || finalWord.endsWith('er') ||
    finalWord.endsWith('en') || finalWord.endsWith('et') || finalWord.endsWith('ed') ||
    finalWord.endsWith('end')) &&
    FINAL_STRESS_WORDS.has(finalWord) === false;
  let nucleus = weakEnding && indexes.length > 1 ? indexes.at(-2) : indexes.at(-1);
  while (nucleus > 0 && VOWELS.includes(value[nucleus - 1])) nucleus -= 1;
  const tail = value.slice(nucleus).replaceAll('|', '');
  return finalWord.endsWith('e') ? tail.replace(/e$/u, '') : tail;
};

export const endingCandidates = line => {
  const words = line.match(WORD) ?? [];
  const candidates = [];
  for (let count = 1; count <= Math.min(3, words.length); count += 1) {
    const wordsInPhrase = words.slice(-count);
    const tail = tailFromPhrase(wordsInPhrase.join('|'));
    if (tail == null) continue;
    const tails = new Set([tail]);
    if (/[lnr]d$/u.test(tail)) tails.add(tail.slice(0, -1));
    tails.forEach(candidateTail => {
      if (candidates.some(candidate => candidate.tail === candidateTail) === false) {
        candidates.push({ phrase: wordsInPhrase.join(' '), tail: candidateTail, wordCount: count });
      }
    });
  }
  return candidates;
};

const pairKey = (left, right) => [left, right].sort().join('\u0000');

export const sequenceRuleKey = (left, right) => {
  let prefix = 0;
  while (prefix < left.length && prefix < right.length && left[prefix] === right[prefix]) prefix += 1;
  let suffix = 0;
  while (suffix < left.length - prefix && suffix < right.length - prefix &&
    left[left.length - suffix - 1] === right[right.length - suffix - 1]) suffix += 1;
  if (prefix === left.length && prefix === right.length) return null;
  const leftFragment = left.slice(prefix, left.length - suffix);
  const rightFragment = right.slice(prefix, right.length - suffix);
  const fragments = [leftFragment, rightFragment].sort();
  const before = prefix === 0 ? '^' : left[prefix - 1];
  const after = suffix === 0 ? '$' : left[left.length - suffix];
  return `${fragments[0]}>${fragments[1]}|${before}_${after}`;
};

const editDistance = (left, right, operationWeights = {}) => {
  const rows = left.length + 1;
  const columns = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(columns).fill(0));
  for (let row = 1; row < rows; row += 1) {
    const operation = `${left[row - 1]}>`;
    const reverse = `>${left[row - 1]}`;
    matrix[row][0] = matrix[row - 1][0] + (1 - (operationWeights[operation] ??
      operationWeights[reverse] ?? 0));
  }
  for (let column = 1; column < columns; column += 1) {
    const operation = `>${right[column - 1]}`;
    matrix[0][column] = matrix[0][column - 1] + (1 - (operationWeights[operation] ?? 0));
  }
  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const leftCharacter = left[row - 1];
      const rightCharacter = right[column - 1];
      const substitution = leftCharacter === rightCharacter
        ? 0
        : 1 - (operationWeights[`${leftCharacter}>${rightCharacter}`] ??
          operationWeights[`${rightCharacter}>${leftCharacter}`] ?? 0);
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + (1 - (operationWeights[`${leftCharacter}>`] ??
          operationWeights[`>${leftCharacter}`] ?? 0)),
        matrix[row][column - 1] + (1 - (operationWeights[`>${rightCharacter}`] ??
          operationWeights[`${rightCharacter}>`] ?? 0)),
        matrix[row - 1][column - 1] + substitution,
      );
    }
  }
  return matrix.at(-1).at(-1);
};

export const baseTailSimilarity = (left, right) => {
  if (left === right) return 1;
  return Math.max(0, 1 - editDistance(left, right) / Math.max(left.length, right.length, 1));
};

const weightedTailSimilarity = (left, right, model = {}) => Math.max(0,
  1 - editDistance(left, right, model.operations) / Math.max(left.length, right.length, 1));

const sharedSuffixShare = (left, right) => {
  let shared = 0;
  while (shared < left.length && shared < right.length &&
    left[left.length - shared - 1] === right[right.length - shared - 1]) shared += 1;
  return shared / Math.max(left.length, right.length, 1);
};

export const rhymeFeatureVector = (left, right, model = {}) => {
  const sequence = model.sequences?.[sequenceRuleKey(left, right)] ?? 0;
  return [
    1,
    baseTailSimilarity(left, right),
    weightedTailSimilarity(left, right, model),
    sequence,
    1 - Math.abs(left.length - right.length) / Math.max(left.length, right.length, 1),
    left[0] === right[0] ? 1 : 0,
    left.at(-1) === right.at(-1) ? 1 : 0,
    sharedSuffixShare(left, right),
  ];
};

const classifierScore = (features, model) => {
  const weights = model?.classifier?.weights;
  if (weights == null) return 0;
  const linear = features.reduce((sum, feature, index) => sum + feature * (weights[index] ?? 0), 0);
  const probability = 1 / (1 + Math.exp(-linear));
  const decisionThreshold = Math.max(0.8, model.classifier.threshold ?? 0.8);
  const rhymeThreshold = model.threshold ?? 0.76;
  return probability >= decisionThreshold
    ? rhymeThreshold + (probability - decisionThreshold) / Math.max(0.001, 1 - decisionThreshold) *
      (1 - rhymeThreshold)
    : probability / Math.max(0.001, decisionThreshold) * rhymeThreshold;
};

export const bestCandidatePair = (leftCandidates, rightCandidates, model = null) => {
  let best = null;
  leftCandidates.forEach(left => rightCandidates.forEach(right => {
    const direct = model?.pairs?.[pairKey(left.tail, right.tail)];
    const features = rhymeFeatureVector(left.tail, right.tail, model ?? {});
    const weighted = features[2];
    const sequence = features[3];
    const classifier = classifierScore(features, model);
    const alternatives = [
      ['corpus-pair', direct ?? 0],
      ['corpus-sequence', sequence],
      ['corpus-classifier', classifier],
      ['corpus-rules', weighted],
    ].sort((a, b) => b[1] - a[1]);
    const score = left.tail === right.tail ? 1 : Math.max(alternatives[0][1], 0);
    const method = left.tail === right.tail ? 'exact-ending' : alternatives[0][0];
    if (best == null || score > best.score ||
      (score === best.score && pairKey(left.tail, right.tail) < pairKey(best.left.tail, best.right.tail))) {
      best = { left, method, right, score };
    }
  }));
  return best;
};

export const loadRhymeModel = (filename = MODEL_FILE) => {
  if (filename === MODEL_FILE && cachedModel != null) return cachedModel;
  if (fs.existsSync(filename) === false) return null;
  const model = JSON.parse(zlib.gunzipSync(fs.readFileSync(filename)).toString('utf8'));
  if (filename === MODEL_FILE) cachedModel = model;
  return model;
};

export const rhymeModelFilename = MODEL_FILE;
export const rhymePairKey = pairKey;
