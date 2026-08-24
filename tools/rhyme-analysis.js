import { bestCandidatePair, endingCandidates, loadRhymeModel } from './rhyme-model.js';

const WORD = /[\p{L}]+(?:['’][\p{L}]+)?/gu;
const VOWELS = 'aeiouyæøå';
const clamp = value => Math.max(0, Math.min(1, value));

const HISTORICAL_SUBSTITUTIONS = [
  ['sch', 'sk', 'sch→sk'], ['ph', 'f', 'ph→f'], ['th', 't', 'th→t'],
  ['ch', 'k', 'ch→k'], ['qu', 'kv', 'qu→kv'], ['ck', 'k', 'ck→k'],
  ['dt', 't', 'dt→t'], ['gh', 'g', 'gh→g'], ['aae', 'åe', 'aae→åe'],
  ['oe', 'ø', 'oe→ø'], ['ae', 'æ', 'ae→æ'], ['aa', 'å', 'aa→å'],
  ['c', 'k', 'c→k'], ['x', 'ks', 'x→ks'], ['z', 's', 'z→s'],
];

const HISTORICAL_EXCEPTIONS_WITH_FINAL_STRESS = new Set(['igen', 'igjen']);

const normalizeHistoricalDanish = word => {
  let value = word.toLocaleLowerCase('da-DK').replace(/[’']/gu, '');
  const rules = [];
  HISTORICAL_SUBSTITUTIONS.forEach(([from, to, name]) => {
    if (value.includes(from)) rules.push(name);
    value = value.replaceAll(from, to);
  });
  if (/ld(?=e)/u.test(value)) rules.push('ld→ll før svagt e');
  value = value.replaceAll(/ld(?=e)/gu, 'll');
  if (value.includes('gt')) rules.push('gt→kt');
  value = value.replaceAll('gt', 'kt');
  if (value.includes('åer')) rules.push('åer→år');
  value = value.replaceAll('åer', 'år');
  if (value.includes('æ')) rules.push('æ→e');
  value = value.replaceAll('æ', 'e');
  return { value, rules };
};

export const cleanRhymeWord = line => (line.match(WORD) ?? []).at(-1) ?? null;

const bootstrapEnding = word => {
  if (word == null) return { signature: null, method: 'unanalysable', gender: null, rules: [] };
  const normalized = normalizeHistoricalDanish(word);
  const { value } = normalized;
  const vowelIndexes = [...value].flatMap((character, index) =>
    VOWELS.includes(character) ? [index] : []);
  if (vowelIndexes.length === 0) {
    return { signature: null, method: 'unanalysable', gender: null, rules: [] };
  }
  const weakEn = value.endsWith('en') && vowelIndexes.length > 1 &&
    HISTORICAL_EXCEPTIONS_WITH_FINAL_STRESS.has(value) === false;
  const weakEnding = value.endsWith('e') || value.endsWith('er') || value.endsWith('et') ||
    value.endsWith('ed') || value.endsWith('end') || weakEn;
  if (weakEnding) normalized.rules.push('svag slutendelse');
  let nucleus = weakEnding && vowelIndexes.length > 1
    ? vowelIndexes.at(-2)
    : vowelIndexes.at(-1);
  while (nucleus > 0 && VOWELS.includes(value[nucleus - 1])) nucleus -= 1;
  const signature = value.slice(nucleus).replace(weakEnding && value.endsWith('e') ? /e$/u : /$^/u, '');
  return {
    signature,
    method: 'bootstrap-rules',
    rules: normalized.rules,
    gender: weakEnding ? 'feminine' : 'masculine',
  };
};

const labelsForSignatures = signatures => {
  const counts = new Map();
  signatures.forEach(signature => {
    if (signature != null) counts.set(signature, (counts.get(signature) ?? 0) + 1);
  });
  const classes = new Map();
  let nextClass = 0;
  return signatures.map(signature => {
    if (signature == null || (counts.get(signature) ?? 0) < 2) return 'X';
    if (classes.has(signature) === false) {
      classes.set(signature, String.fromCharCode(65 + nextClass));
      nextClass += 1;
    }
    return classes.get(signature);
  });
};

const bootstrapStanza = stanza => {
  const endings = stanza.map(line => {
    const word = cleanRhymeWord(line);
    return { word, ...bootstrapEnding(word), score: 1 };
  });
  return { endings, labels: labelsForSignatures(endings.map(ending => ending.signature)) };
};

const pairMatrix = (candidates, model) => candidates.map((left, leftIndex) =>
  candidates.map((right, rightIndex) => leftIndex === rightIndex
    ? { left: left[0] ?? null, method: 'identity', right: right[0] ?? null, score: 1 }
    : bestCandidatePair(left, right, model)));

const clusterLines = (matrix, threshold) => {
  const clusters = matrix.map((_, index) => [index]);
  while (true) {
    let best = null;
    for (let leftIndex = 0; leftIndex < clusters.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < clusters.length; rightIndex += 1) {
        const scores = clusters[leftIndex].flatMap(left =>
          clusters[rightIndex].map(right => matrix[left][right]?.score ?? 0));
        const minimum = Math.min(...scores);
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        if (minimum < threshold) continue;
        if (best == null || minimum > best.minimum ||
          (minimum === best.minimum && average > best.average)) {
          best = { average, leftIndex, minimum, rightIndex };
        }
      }
    }
    if (best == null) break;
    clusters[best.leftIndex] = [...clusters[best.leftIndex], ...clusters[best.rightIndex]].sort((a, b) => a - b);
    clusters.splice(best.rightIndex, 1);
  }
  return clusters.sort((left, right) => left[0] - right[0]);
};

const renderModelStanza = (stanza, candidates, matrix, threshold) => {
  const clusters = clusterLines(matrix, threshold);
  const labels = Array(stanza.length).fill('X');
  let nextClass = 0;
  clusters.filter(cluster => cluster.length >= 2).forEach(cluster => {
    const label = nextClass < 26 ? String.fromCharCode(65 + nextClass) : `A${nextClass + 1}`;
    nextClass += 1;
    cluster.forEach(index => { labels[index] = label; });
  });
  const endings = stanza.map((line, index) => {
    const cluster = clusters.find(candidate => candidate.includes(index));
    const partner = cluster?.find(candidate => candidate !== index);
    const match = partner == null ? null : matrix[index][partner];
    const candidate = match?.left ?? candidates[index][0] ?? null;
    return {
      word: cleanRhymeWord(line),
      phrase: candidate?.phrase ?? null,
      signature: candidate?.tail ?? null,
      method: match?.method ?? (candidate == null ? 'unanalysable' : 'unmatched'),
      rules: match == null ? [] : [
        `score=${match.score.toFixed(3)}`,
        ...(match.rawScore == null ? [] : [`rå score=${match.rawScore.toFixed(3)}`]),
      ],
      gender: null,
      score: match?.score ?? 0,
    };
  });
  return { endings, labels };
};

const prepareModelStanza = (stanza, model) => {
  const candidates = stanza.map(endingCandidates);
  return { candidates, matrix: pairMatrix(candidates, model) };
};

const assistWithPoemConsensus = (stanzas, prepared, rawResults, model) => {
  const threshold = model?.threshold ?? 0.72;
  const floor = model?.consensusFloor ?? threshold - 0.15;
  const requiredSupport = model?.consensusSupport ?? 0.6;
  const matrices = prepared.map(result => result.matrix.map(row => [...row]));
  let adjustedPairs = 0;
  const lengthGroups = new Map();
  stanzas.forEach((stanza, index) => {
    const indexes = lengthGroups.get(stanza.length) ?? [];
    indexes.push(index);
    lengthGroups.set(stanza.length, indexes);
  });
  lengthGroups.forEach(indexes => {
    if (indexes.length < 3) return;
    const stanzaLength = stanzas[indexes[0]].length;
    for (let left = 0; left < stanzaLength; left += 1) {
      for (let right = left + 1; right < stanzaLength; right += 1) {
        const matches = indexes.filter(index => {
          const labels = rawResults[index].labels;
          return labels[left] !== 'X' && labels[left] === labels[right];
        }).length;
        const support = matches / indexes.length;
        if (matches < 2 || support < requiredSupport) continue;
        indexes.forEach(index => {
          const local = matrices[index][left][right];
          if (local == null || local.score >= threshold || local.score < floor) return;
          const score = threshold + 0.001 + Math.min(0.009, support * 0.01);
          matrices[index][left][right] = { ...local, method: 'poem-consensus', rawScore: local.score, score };
          const reverse = matrices[index][right][left];
          matrices[index][right][left] = { ...reverse, method: 'poem-consensus', rawScore: reverse.score, score };
          adjustedPairs += 1;
        });
      }
    }
  });
  return { adjustedPairs, matrices };
};

export const analyzeRhyme = (stanzas, {
  bootstrap = false,
  minConfidence = 0.75,
  model = undefined,
  poemConsensus = true,
} = {}) => {
  // Bootstrap-reglerne bruges kun til den første træningsrunde. Normal analyse
  // bruger den lille, versionsstyrede korpusmodel.
  const activeModel = bootstrap ? null : (model === undefined ? loadRhymeModel() : model);
  const prepared = bootstrap ? [] : stanzas.map(stanza => prepareModelStanza(stanza, activeModel));
  const rawStanzaResults = stanzas.map((stanza, index) => bootstrap
    ? bootstrapStanza(stanza)
    : renderModelStanza(stanza, prepared[index].candidates, prepared[index].matrix,
      activeModel?.threshold ?? 0.72));
  const assisted = bootstrap || poemConsensus === false
    ? { adjustedPairs: 0, matrices: prepared.map(result => result.matrix) }
    : assistWithPoemConsensus(stanzas, prepared, rawStanzaResults, activeModel);
  const stanzaResults = assisted.adjustedPairs === 0
    ? rawStanzaResults
    : stanzas.map((stanza, index) => renderModelStanza(stanza, prepared[index].candidates,
      assisted.matrices[index], activeModel?.threshold ?? 0.72));
  const rawPattern = rawStanzaResults.map(result => result.labels.join('')).join(' ');
  const pattern = stanzaResults.map(result => result.labels.join('')).join(' ');
  const lines = stanzas.flat();
  const endings = stanzaResults.flatMap(result => result.endings);
  const methods = endings.map(ending => ending.method);
  const matched = stanzaResults.reduce((sum, result) =>
    sum + result.labels.filter(label => label !== 'X').length, 0);
  const coverage = lines.length === 0 ? 0 : matched / lines.length;
  const matchedScores = endings.filter(ending => ending.score > 0).map(ending => ending.score);
  const meanScore = matchedScores.length === 0
    ? 0
    : matchedScores.reduce((sum, score) => sum + score, 0) / matchedScores.length;
  const confidence = lines.length === 0
    ? 0
    : Math.round(clamp(0.45 + coverage * 0.35 + meanScore * 0.2) * 100) / 100;
  return {
    pattern,
    rawPattern,
    stanzaPatterns: stanzaResults.map(result => result.labels.join('')),
    rawStanzaPatterns: rawStanzaResults.map(result => result.labels.join('')),
    stanzaAnalyses: stanzaResults,
    rawStanzaAnalyses: rawStanzaResults,
    consensusAdjustedPairs: assisted.adjustedPairs,
    confidence,
    lines,
    endings,
    methods,
    accepted: confidence >= minConfidence,
  };
};
