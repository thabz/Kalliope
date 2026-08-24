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

const editDistance = (left, right, operationWeights = {}) => {
  const rows = left.length + 1;
  const columns = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(columns).fill(0));
  for (let row = 1; row < rows; row += 1) {
    const operation = `${left[row - 1]}>`;
    matrix[row][0] = matrix[row - 1][0] + (1 - (operationWeights[operation] ?? 0));
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
        matrix[row - 1][column] + (1 - (operationWeights[`${leftCharacter}>`] ?? 0)),
        matrix[row][column - 1] + (1 - (operationWeights[`>${rightCharacter}`] ?? 0)),
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

export const bestCandidatePair = (leftCandidates, rightCandidates, model = null) => {
  let best = null;
  leftCandidates.forEach(left => rightCandidates.forEach(right => {
    const direct = model?.pairs?.[pairKey(left.tail, right.tail)];
    const weighted = 1 - editDistance(left.tail, right.tail, model?.operations) /
      Math.max(left.tail.length, right.tail.length, 1);
    const score = left.tail === right.tail ? 1 : Math.max(direct ?? 0, weighted, 0);
    const method = left.tail === right.tail
      ? 'exact-ending'
      : direct != null && direct >= weighted ? 'corpus-pair' : 'corpus-rules';
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
