const wordPattern = /[\p{L}]+(?:['’][\p{L}]+)?/gu;
const vowelRunPattern = /[aeiouyæøå]+/giu;

// Udtalen kan ikke udledes sikkert af vokalklynger i disse ord. Listen holdes
// bevidst lille, så historiske og ukendte ord fortsat behandles af reglerne.
const lexicon = new Map(Object.entries({
  adieu: 2,
  boede: 2,
  de: 1,
  eet: 1,
  evig: 2,
  evigt: 2,
  fjorten: 2,
  gudinde: 3,
  havde: 2,
  hendes: 2,
  hjerte: 2,
  hjertet: 2,
  hver: 1,
  jeg: 1,
  linie: 3,
  meget: 2,
  nogen: 2,
  nogle: 2,
  oehlenschläger: 4,
  poesi: 3,
  sagde: 2,
  seks: 1,
  sytten: 2,
  tredive: 3,
  vore: 2,
}));

const patternNames = new Map(Object.entries({
  5: 'pentasyllabic',
  6: 'hexasyllabic',
  7: 'heptasyllabic',
  8: 'octosyllabic',
  9: 'enneasyllabic',
  10: 'decasyllabic',
  11: 'hendecasyllabic',
  12: 'alexandrine',
  13: 'tridecasyllabic',
  14: 'tetradecasyllabic',
  15: 'pentadecasyllabic',
  16: 'hexadecasyllabic',
}));

const normalizeWord = word => {
  let normalized = word.toLocaleLowerCase('da-DK')
    .replace(/’/g, "'")
    .replace(/^'+|'+$/g, '');
  const historical = /aa|ae|oe|ue|ie|ii/u.test(normalized);
  normalized = normalized
    .replace(/'/g, '')
    .replace(/^ki(?=[eæ])/u, 'k')
    .replace(/^hi(?=[eæ])/u, 'hj')
    .replace(/^gi(?=[eæ])/u, 'gj')
    .replace(/qu/g, 'kv')
    .replace(/aa/g, 'å');
  return { historical, normalized };
};

const vowelsInRun = run => {
  if (run.length === 1 || new Set(run).size === 1) return 1;
  if (['ai', 'au', 'ej', 'ei', 'eu', 'øj', 'øy', 'ou'].includes(run)) return 1;
  return Array.from(run).length;
};

export const estimateWord = word => {
  const { historical, normalized } = normalizeWord(word);
  if (lexicon.has(normalized)) {
    return { word, syllables: lexicon.get(normalized), confidence: 0.99, method: 'lexicon' };
  }

  const runs = normalized.match(vowelRunPattern) ?? [];
  const syllables = Math.max(1, runs.reduce((sum, run) => sum + vowelsInRun(run), 0));
  const elided = /['’]/u.test(word);
  return {
    word,
    syllables,
    confidence: elided ? 0.7 : historical ? 0.78 : 0.86,
    method: elided ? 'elision-rule' : historical ? 'historical-rule' : 'rule',
  };
};

export const estimateLine = line => {
  const words = (line.match(wordPattern) ?? []).map(estimateWord);
  if (words.length === 0) return { text: line, syllables: 0, confidence: 0, words };
  const syllables = words.reduce((sum, word) => sum + word.syllables, 0);
  const confidence = words.reduce(
    (sum, word) => sum + word.confidence * word.syllables,
    0,
  ) / syllables;
  return { text: line, syllables, confidence: Math.round(confidence * 1000) / 1000, words };
};

const lineScore = (observed, expected) => {
  const scores = [1, 0.82, 0.3];
  return scores[Math.abs(observed - expected)] ?? 0.04;
};

export const analyzeSyllables = (rawLines, { minConfidence = 0.75 } = {}) => {
  const lines = rawLines
    .map(line => typeof line === 'string' ? estimateLine(line) : line)
    .filter(line => line.syllables >= 2);
  if (lines.length < 4) {
    return { analyses: [], candidates: [], lines, reason: 'too-few-lines' };
  }

  const pronunciation = lines.reduce((sum, line) => sum + line.confidence, 0) /
    lines.length;
  const sampleFactor = 0.62 + 0.38 * Math.min(1, Math.sqrt(lines.length / 14));
  const low = Math.max(4, Math.min(...lines.map(line => line.syllables)) - 1);
  const high = Math.min(18, Math.max(...lines.map(line => line.syllables)) + 1);
  const candidates = [];

  for (let expected = low; expected <= high; expected += 1) {
    const scores = lines
      .map(line => lineScore(line.syllables, expected))
      .sort((left, right) => right - left);
    const robustCount = Math.max(1, Math.ceil(scores.length * 0.9));
    const robustMean = scores.slice(0, robustCount)
      .reduce((sum, score) => sum + score, 0) / robustCount;
    const matchingLines = lines.filter(line => line.syllables === expected).length;
    const coverage = matchingLines / lines.length;
    const pronunciationFactor = 0.75 + 0.25 * pronunciation;
    const confidence = Math.round(Math.min(
      1,
      (robustMean * 0.88 + coverage * 0.12) * sampleFactor * pronunciationFactor,
    ) * 100) / 100;
    candidates.push({
      pattern: patternNames.get(String(expected)) ?? `${expected}-syllable`,
      syllables: expected,
      confidence,
      matchingLines,
    });
  }

  candidates.sort((left, right) => {
    const confidenceDifference = right.confidence - left.confidence;
    return confidenceDifference !== 0
      ? confidenceDifference
      : left.syllables - right.syllables;
  });
  const analyses = candidates.filter(candidate => candidate.confidence >= minConfidence);
  return {
    analyses,
    candidates,
    lines,
    reason: analyses.length === 0 ? 'below-threshold' : null,
  };
};

export const formatSyllablesXml = analyses => [
  '<syllables>',
  ...analyses.map(analysis =>
    `  <analysis pattern="${analysis.pattern}" confidence="${analysis.confidence.toFixed(2)}"/>`),
  '</syllables>',
].join('\n');
