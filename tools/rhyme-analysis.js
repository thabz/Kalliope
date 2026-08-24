import { poetryStanzasFromXml } from './metre-analysis.js';

const WORD = /[\p{L}]+(?:['’][\p{L}]+)?/gu;
const VOWELS = 'aeiouyæøå';
const clamp = value => Math.max(0, Math.min(1, value));

const phonetic = word => {
  let value = word.toLocaleLowerCase('da-DK').replace(/[’']/gu, '');
  [
    ['sch', 'sk'], ['ph', 'f'], ['th', 't'], ['ch', 'k'], ['qu', 'kv'],
    ['ck', 'k'], ['dt', 't'], ['gh', 'g'], ['aae', 'åe'], ['oe', 'ø'], ['ae', 'æ'],
    ['aa', 'å'], ['c', 'k'], ['x', 'ks'], ['z', 's'],
  ].forEach(([from, to]) => { value = value.replaceAll(from, to); });
  return value
    .replaceAll(/ld(?=e)/gu, 'll')
    .replaceAll('gt', 'kt')
    .replaceAll('åer', 'år')
    .replaceAll('æ', 'e');
};

export const cleanRhymeWord = line => (line.match(WORD) ?? []).at(-1) ?? null;

const endingForWord = word => {
  if (word == null) return { signature: null, method: 'unanalysable', gender: null };
  const value = phonetic(word);
  const vowelIndexes = [...value].flatMap((character, index) =>
    VOWELS.includes(character) ? [index] : []);
  if (vowelIndexes.length === 0) return { signature: null, method: 'unanalysable', gender: null };
  const lastVowel = vowelIndexes.at(-1);
  // Final e is normally a weak schwa in Danish.  This also covers the
  // common inflectional ending -er: skuer/luer must not rhyme merely because
  // their spelling ends like ranker/banker.
  const weakEnding = value.endsWith('e') || value.endsWith('er');
  const nucleus = weakEnding && vowelIndexes.length > 1
    ? vowelIndexes.at(-2)
    : lastVowel;
  const signature = value.slice(nucleus).replace(weakEnding && value.endsWith('e') ? /e$/u : /$^/u, '');
  return {
    signature,
    method: 'phonetic-rules',
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
