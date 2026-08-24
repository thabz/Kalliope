import { poetryStanzasFromXml } from './metre-analysis.js';

const WORD = /[\p{L}]+(?:['’][\p{L}]+)?/gu;
const VOWELS = 'aeiouyæøå';
const clamp = value => Math.max(0, Math.min(1, value));

// Enderim vurderes fra sidste trykstærke vokal til ordets slutning. Se
// https://ordnet.dk/ddo/ordbog/11011302 ("enderim"). Stavningen alene er
// derfor ikke tilstrækkelig, især ikke i historiske danske tekster; se også
// https://ordnet.dk/ods/hjaelp/lydskrift/ og
// https://www.dansksproghistorie.dk/42/.
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

const endingForWord = word => {
  if (word == null) return { signature: null, method: 'unanalysable', gender: null, rules: [] };
  const normalized = normalizeHistoricalDanish(word);
  const { value } = normalized;
  const vowelIndexes = [...value].flatMap((character, index) =>
    VOWELS.includes(character) ? [index] : []);
  if (vowelIndexes.length === 0) {
    return { signature: null, method: 'unanalysable', gender: null, rules: [] };
  }
  const lastVowel = vowelIndexes.at(-1);
  // Final e is normally a weak schwa in Danish.  This also covers the
  // common inflectional ending -er: skuer/luer must not rhyme merely because
  // their spelling ends like ranker/banker.
  const weakEn = value.endsWith('en') && vowelIndexes.length > 1 &&
    !HISTORICAL_EXCEPTIONS_WITH_FINAL_STRESS.has(value);
  const weakEnding = value.endsWith('e') || value.endsWith('er') || weakEn;
  if (weakEnding) normalized.rules.push('svag slutendelse');
  const nucleus = weakEnding && vowelIndexes.length > 1
    ? vowelIndexes.at(-2)
    : lastVowel;
  const signature = value.slice(nucleus).replace(weakEnding && value.endsWith('e') ? /e$/u : /$^/u, '');
  return {
    signature,
    method: 'phonetic-rules',
    rules: normalized.rules,
    gender: signature.endsWith('e') && vowelIndexes.length > 1 ? 'feminine' : 'masculine',
  };
};

const orthographicEnding = word => {
  if (word == null) return null;
  const value = word.toLocaleLowerCase('da-DK');
  const index = [...value].findLastIndex(character => VOWELS.includes(character));
  return index < 0 ? null : value.slice(index);
};

export const analyzeRhyme = (stanzas, { minConfidence = 0.75 } = {}) => {
  const lines = stanzas.flat();
  const endings = lines.map(line => ({
    word: cleanRhymeWord(line),
    ...endingForWord(cleanRhymeWord(line)),
  }));
  const counts = new Map();
  endings.forEach(({ signature }) => {
    if (signature != null) counts.set(signature, (counts.get(signature) ?? 0) + 1);
  });
  const classes = new Map();
  let nextClass = 0;
  const methods = [];
  const labels = endings.map(ending => {
    let signature = ending.signature;
    if (signature == null || (counts.get(signature) ?? 0) < 2) {
      signature = orthographicEnding(ending.word);
      methods.push(signature == null ? 'unanalysable' : 'orthographic-fallback');
      return 'X';
    }
    methods.push(ending.method);
    if (!classes.has(signature)) {
      classes.set(signature, nextClass < 26 ? String.fromCharCode(65 + nextClass) : `A${nextClass + 1}`);
      nextClass += 1;
    }
    return classes.get(signature);
  });
  const pattern = [];
  let offset = 0;
  stanzas.forEach(stanza => {
    pattern.push(labels.slice(offset, offset + stanza.length).join(''));
    offset += stanza.length;
  });
  const paired = [...counts.values()].filter(count => count >= 2)
    .reduce((sum, count) => sum + count, 0);
  const coverage = lines.length > 0 ? paired / lines.length : 0;
  const phoneticCoverage = methods.filter(method => method === 'phonetic-rules').length /
    Math.max(1, paired);
  const confidence = lines.length > 0
    ? Math.round(clamp(0.45 + coverage * 0.35 + phoneticCoverage * 0.2) * 100) / 100
    : 0;
  return {
    pattern: pattern.join(' '),
    confidence,
    lines,
    endings,
    methods,
    accepted: confidence >= minConfidence,
  };
};
