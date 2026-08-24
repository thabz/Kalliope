import { DOMParser } from '@xmldom/xmldom';

const VOWEL_RUN = /[aeiouyæøå]+/giu;
const WORD = /[\p{L}]+(?:['’][\p{L}]+)?/gu;

const weakWords = new Set([
  'ad', 'af', 'at', 'da', 'de', 'den', 'der', 'det', 'du', 'efter', 'eller',
  'en', 'end', 'er', 'et', 'for', 'fra', 'før', 'gennem', 'ham', 'han', 'hans',
  'har', 'hen', 'hende', 'her', 'hos', 'hun', 'hvad', 'hvem', 'hvor', 'i',
  'ikke', 'jeg', 'kan', 'med', 'men', 'mig', 'mod', 'må', 'ned', 'nu', 'når',
  'og', 'om', 'op', 'os', 'over', 'på', 'sig', 'sin', 'skal', 'som', 'til',
  'under', 'ved', 'vi', 'vil', 'vor', 'vores', 'vær', 'været', 'øvrig',
]);

const weakPrefixes = ['be', 'ge', 'er', 'for'];
const ignoredLineElements = ['footnote', 'note', 'nonum', 'margin', 'num'];
const ignoredLinePattern = new RegExp(
  `<(?:${ignoredLineElements.join('|')})\\b[^>]*>[\\s\\S]*?<\\/(?:${ignoredLineElements.join('|')})>`,
  'gi',
);

const roundConfidence = value => Math.round(value * 100) / 100;
const clamp = value => Math.max(0, Math.min(1, value));

export const countSyllables = word => {
  const normalized = word
    .toLocaleLowerCase('da-DK')
    .replace(/[’']/g, '')
    .replace(/^(k|h|s|g|sk)i(?=[eæ])/u, '$1')
    .replace(/qu/g, 'kv');
  const runs = normalized.match(VOWEL_RUN) ?? [];
  const count = runs.reduce((sum, run) => {
    if (/^(?:aa|au|eu|ee|oo|uu)+$/u.test(run)) return sum + run.length / 2;
    return sum + new Set(run).size;
  }, 0);
  return Math.max(1, count);
};

const stressForWord = word => {
  const normalized = word.toLocaleLowerCase('da-DK').replace(/[’']/g, '');
  const syllables = countSyllables(normalized);

  if (syllables === 1) {
    return [weakWords.has(normalized) ? 0.18 : 0.82];
  }

  const stresses = Array.from({ length: syllables }, () => 0.14);
  const weakPrefix = weakPrefixes.some(prefix =>
    normalized.startsWith(prefix) && normalized.length > prefix.length + 2,
  );
  const primary = weakPrefix ? 1 : 0;
  stresses[Math.min(primary, syllables - 1)] = 0.88;

  if (syllables >= 4) {
    stresses[syllables - 2] = Math.max(stresses[syllables - 2], 0.48);
  }
  if (weakWords.has(normalized)) {
    return stresses.map(stress => stress * 0.55);
  }
  return stresses;
};

export const analyzeLine = line => {
  const words = line.match(WORD) ?? [];
  const stress = words.flatMap(stressForWord);
  return {
    text: line,
    words,
    syllables: stress.length,
    stress,
  };
};

const expectedPattern = (foot, feet) => {
  const patterns = {
    iambic: [0, 1],
    trochaic: [1, 0],
    anapestic: [0, 0, 1],
    dactylic: [1, 0, 0],
  };
  return Array.from({ length: feet }, () => patterns[foot]).flat();
};

const sequenceDistance = (observed, expected) => {
  const rows = observed.length + 1;
  const columns = expected.length + 1;
  const matrix = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => Number.POSITIVE_INFINITY),
  );
  matrix[0][0] = 0;
  for (let row = 1; row < rows; row += 1) matrix[row][0] = row * 0.9;
  for (let column = 1; column < columns; column += 1) matrix[0][column] = column * 0.9;

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const target = expected[column - 1];
      const substitution = Math.abs(observed[row - 1] - target);
      matrix[row][column] = Math.min(
        matrix[row - 1][column - 1] + substitution,
        matrix[row - 1][column] + 0.9,
        matrix[row][column - 1] + 0.9,
      );
    }
  }
  return matrix.at(-1).at(-1);
};

const scoreRhythmicLine = (line, model) => {
  const expected = expectedPattern(model.foot, model.feet);
  const normalDistance = sequenceDistance(line.stress, expected);
  const inverted = expected.length >= 2
    ? [expected[1], expected[0], ...expected.slice(2)]
    : expected;
  const invertedDistance = sequenceDistance(line.stress, inverted) + 0.12;
  const feminine = [...expected, 0];
  const feminineDistance = sequenceDistance(line.stress, feminine) + 0.08;
  const distance = Math.min(normalDistance, invertedDistance, feminineDistance);
  const denominator = Math.max(line.syllables, expected.length, 1);
  const rhythm = clamp(1 - distance / denominator);
  const lengthDifference = Math.min(
    Math.abs(line.syllables - expected.length),
    Math.abs(line.syllables - expected.length - 1) + 0.2,
  );
  const length = clamp(1 - lengthDifference / Math.max(3, expected.length * 0.35));
  return clamp(rhythm * 0.62 + length * 0.38);
};

const scoreSyllabicLine = (line, syllables) => {
  const difference = Math.abs(line.syllables - syllables);
  return clamp(1 - difference * 0.34);
};

const aggregateScores = (lineScores, lineCount) => {
  const sorted = [...lineScores].sort((a, b) => b - a);
  const robustCount = Math.max(1, Math.ceil(sorted.length * 0.86));
  const robustMean = sorted
    .slice(0, robustCount)
    .reduce((sum, score) => sum + score, 0) / robustCount;
  const matchingLines = lineScores.filter(score => score >= 0.72).length;
  const coverage = matchingLines / lineScores.length;
  const sampleFactor = 0.62 + 0.38 * Math.min(1, lineCount / 14);
  const confidence = clamp((robustMean * 0.64 + coverage * 0.36) * sampleFactor);
  return { confidence, matchingLines, meanLineScore: robustMean };
};

const rhythmicModels = ['iambic', 'trochaic', 'anapestic', 'dactylic']
  .flatMap(foot => [2, 3, 4, 5, 6].map(feet => ({
    type: 'rhythmic',
    foot,
    feet,
    pattern: `${foot}-${['', '', 'dimeter', 'trimeter', 'tetrameter', 'pentameter', 'hexameter'][feet]}`,
  })));

const syllabicModels = [
  { type: 'syllabic', pattern: 'alexandrine', syllables: 12 },
  { type: 'syllabic', pattern: 'hendecasyllabic', syllables: 11 },
];

const scoreModel = (lines, model) => {
  const lineScores = lines.map(line => model.type === 'rhythmic'
    ? scoreRhythmicLine(line, model)
    : scoreSyllabicLine(line, model.syllables));
  return { ...model, ...aggregateScores(lineScores, lines.length), lineScores };
};

export const analyzePoem = (rawLines, { minConfidence = 0.75 } = {}) => {
  const lines = rawLines
    .map(line => typeof line === 'string' ? analyzeLine(line) : line)
    .filter(line => line.words.length > 0 && line.syllables >= 2);

  if (lines.length < 4) {
    return { analyses: [], candidates: [], lines, reason: 'too-few-lines' };
  }

  const rawCandidates = [...rhythmicModels, ...syllabicModels]
    .map(model => scoreModel(lines, model));
  const candidates = rawCandidates.map(candidate => {
    const alternative = rawCandidates
      .filter(other => other !== candidate && other.type === candidate.type)
      .reduce((highest, other) => Math.max(highest, other.confidence), 0);
    const uniqueness = clamp((candidate.confidence - alternative) / 0.06);
    return {
      ...candidate,
      confidence: candidate.confidence * (0.88 + uniqueness * 0.12),
      uniqueness,
    };
  });
  const rhythmic = candidates
    .filter(candidate => candidate.type === 'rhythmic')
    .sort((a, b) => b.confidence - a.confidence);
  const syllabic = candidates
    .filter(candidate => candidate.type === 'syllabic')
    .sort((a, b) => b.confidence - a.confidence);
  const bestRhythmic = rhythmic[0];
  const bestSyllabic = syllabic[0];
  const selected = [bestRhythmic, bestSyllabic]
    .filter(candidate => roundConfidence(candidate.confidence) >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence)
    .map(candidate => ({
      ...candidate,
      confidence: roundConfidence(candidate.confidence),
      meanLineScore: roundConfidence(candidate.meanLineScore),
    }));

  return {
    analyses: selected,
    candidates: candidates
      .sort((a, b) => b.confidence - a.confidence)
      .map(candidate => ({
        ...candidate,
        confidence: roundConfidence(candidate.confidence),
        meanLineScore: roundConfidence(candidate.meanLineScore),
      })),
    lines,
    reason: selected.length === 0 ? 'below-threshold' : null,
  };
};

const stripIgnoredMarkup = line => {
  let result = line;
  let previous;
  do {
    previous = result;
    result = result.replace(ignoredLinePattern, '');
  } while (result !== previous);
  return result
    .replace(/<(?:pb|br|hr|img|resetnum)\b[^>]*\/?\s*>/gi, '')
    .replace(/<[^>]+>/g, '');
};

export const poetryLinesFromXml = poetryXml => {
  let content = poetryXml
    .replace(/^<poetry\b[^>]*>/i, '')
    .replace(/<\/poetry>$/i, '');
  let previous;
  do {
    previous = content;
    content = content.replace(ignoredLinePattern, '');
  } while (content !== previous);
  return content
    .split(/\r?\n/)
    .map(line => stripIgnoredMarkup(line).trim())
    .filter(line => line.length > 0 && /^[-–—_=*\dIVXLCDM. ]+$/iu.test(line) !== true)
    .map(line => {
      const document = new DOMParser().parseFromString(`<line>${line}</line>`, 'text/xml');
      return document.documentElement.textContent.trim();
    });
};

export const formatMetreXml = analyses => [
  '<metre>',
  ...analyses.map(analysis =>
    `  <analysis pattern="${analysis.pattern}" confidence="${analysis.confidence.toFixed(2)}"/>`,
  ),
  '</metre>',
].join('\n');
