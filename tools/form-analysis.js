const clamp = value => Math.max(0, Math.min(0.99, value));

const roundConfidence = value => Math.round(clamp(value) * 100) / 100;

const normalizePattern = pattern => String(pattern ?? '')
  .toUpperCase()
  .replace(/[^A-Z]/g, '');

const canonicalPattern = pattern => {
  const labels = new Map();
  let next = 0;
  return normalizePattern(pattern).split('').map(label => {
    if (label === 'X') return 'X';
    if (labels.has(label) !== true) {
      labels.set(label, String.fromCharCode(65 + next));
      next += 1;
    }
    return labels.get(label);
  }).join('');
};

const stanzaLengthsFromStructure = structure => String(structure?.pattern ?? '')
  .split('-')
  .map(Number)
  .filter(length => Number.isInteger(length) && length > 0);

const rhymeStanzas = (pattern, stanzaLengths) => {
  const explicit = String(pattern ?? '').trim().split(/\s+/).filter(Boolean);
  if (explicit.length > 1) return explicit.map(normalizePattern);
  const compact = normalizePattern(pattern);
  if (stanzaLengths.reduce((sum, length) => sum + length, 0) !== compact.length) {
    return compact === '' ? [] : [compact];
  }
  let offset = 0;
  return stanzaLengths.map(length => {
    const stanza = compact.slice(offset, offset + length);
    offset += length;
    return stanza;
  });
};

const isPetrarchanRhyme = (pattern, stanzaLengths) => {
  let stanzas = rhymeStanzas(pattern, stanzaLengths);
  if (stanzas.map(stanza => stanza.length).join('-') !== '4-4-3-3' &&
      normalizePattern(pattern).length === 14) {
    stanzas = rhymeStanzas(pattern, [4, 4, 3, 3]);
  }
  if (stanzas.map(stanza => stanza.length).join('-') !== '4-4-3-3') return false;
  const local = stanzas.map(canonicalPattern);
  if (local[0] !== 'ABBA' || local[1] !== 'ABBA') return false;
  const global = canonicalPattern(stanzas.join(''));
  const established = new Set([
    'ABBAABBACDCDCD',
    'ABBAABBACDECDE',
    'ABBAABBACDEDCE',
    'ABBAABBACDCEDE',
    'ABBAABBACDDCEE',
  ]);
  const localSestets = new Set(['ABA ABA', 'ABC ABC', 'ABC BAC']);
  return established.has(global) || localSestets.has(`${local[2]} ${local[3]}`);
};

const isShakespeareanRhyme = (pattern, stanzaLengths) => {
  let stanzas = rhymeStanzas(pattern, stanzaLengths);
  if (stanzas.map(stanza => stanza.length).join('-') !== '4-4-4-2' &&
      normalizePattern(pattern).length === 14) {
    stanzas = rhymeStanzas(pattern, [4, 4, 4, 2]);
  }
  if (stanzas.map(stanza => stanza.length).join('-') !== '4-4-4-2') return false;
  const local = stanzas.map(canonicalPattern);
  return canonicalPattern(stanzas.join('')) === 'ABABCDCDEFEFGG' ||
    local.join(' ') === 'ABAB ABAB ABAB AA';
};

const rhymeCoverage = pattern => {
  const labels = normalizePattern(pattern).split('').filter(label => label !== 'X');
  if (labels.length === 0) return 0;
  const frequencies = labels.reduce((counts, label) => {
    counts.set(label, (counts.get(label) ?? 0) + 1);
    return counts;
  }, new Map());
  const rhymed = labels.filter(label => (frequencies.get(label) ?? 0) > 1).length;
  return rhymed / normalizePattern(pattern).length;
};

const strongestCompatible = (analyses, patterns) => analyses
  .filter(analysis => patterns.has(analysis.pattern))
  .reduce((highest, analysis) => Math.max(highest, analysis.confidence), 0);

const strongest = analyses => analyses
  .reduce((highest, analysis) => Math.max(highest, analysis.confidence), 0);

const addSignal = (signals, contribution, description) => {
  signals.push({ contribution, description });
  return contribution;
};

const subtypeConfidence = ({
  compatibleMetre,
  compatibleSyllables,
  lineCount,
  rhymeConfidence,
  rhymeMatches,
  structureConfidence,
  structureMatches,
}) => roundConfidence(
  (lineCount === 14 ? 0.18 : 0) +
  (structureMatches ? 0.46 * structureConfidence : 0) +
  (rhymeMatches ? 0.45 * rhymeConfidence : 0) +
  compatibleMetre * 0.06 +
  compatibleSyllables * 0.03,
);

export const classifyPoeticForm = ({
  metre = [],
  rhyme = null,
  structure = null,
  syllables = [],
} = {}) => {
  const signals = [];
  const stanzaLengths = stanzaLengthsFromStructure(structure);
  const lineCount = stanzaLengths.reduce((sum, length) => sum + length, 0);
  const structureConfidence = Number(structure?.confidence ?? 0);
  const rhymeConfidence = Number(rhyme?.confidence ?? 0);
  const structurePattern = stanzaLengths.join('-');
  const petrarchanStructure = structurePattern === '4-4-3-3';
  const shakespeareanStructure = structurePattern === '4-4-4-2';
  const compatibleStructure = petrarchanStructure || shakespeareanStructure ||
    structurePattern === '8-3-3' || structurePattern === '8-6';
  const petrarchanRhyme = rhyme != null &&
    isPetrarchanRhyme(rhyme.pattern, stanzaLengths);
  const shakespeareanRhyme = rhyme != null &&
    isShakespeareanRhyme(rhyme.pattern, stanzaLengths);
  const recognizedRhyme = petrarchanRhyme || shakespeareanRhyme;
  const coverage = rhyme == null ? 0 : rhymeCoverage(rhyme.pattern);
  const compatibleMetre = strongestCompatible(metre, new Set([
    'alexandrine',
    'hendecasyllabic',
    'iambic-pentameter',
  ]));
  const compatibleSyllables = strongestCompatible(syllables, new Set([
    '10-syllable',
    '11-syllable',
    '12-syllable',
    'decasyllabic',
    'hendecasyllabic',
  ]));

  let score = 0;
  if (lineCount === 14) {
    score += addSignal(signals, 0.52, '14 lines');
  } else if (lineCount === 13 || lineCount === 15) {
    score += addSignal(signals, 0.18, `${lineCount} lines (near the usual 14)`);
  } else if (lineCount > 0) {
    score += addSignal(signals, -0.18, `${lineCount} lines conflicts with the usual 14`);
  }

  if (compatibleStructure) {
    score += addSignal(
      signals,
      0.17 * structureConfidence,
      `stanza pattern ${structurePattern}`,
    );
  } else if (structurePattern !== '' && structurePattern !== '14') {
    score += addSignal(
      signals,
      -0.08 * structureConfidence,
      `stanza pattern ${structurePattern} is atypical`,
    );
  }

  if (recognizedRhyme) {
    score += addSignal(
      signals,
      0.28 * rhymeConfidence,
      `rhyme ${rhyme.pattern} (${rhymeConfidence.toFixed(2)})`,
    );
  } else if (coverage >= 0.6 && rhymeConfidence >= 0.6) {
    score += addSignal(
      signals,
      0.14 * rhymeConfidence * coverage,
      `substantial rhyme ${rhyme.pattern} (${rhymeConfidence.toFixed(2)})`,
    );
  } else if (rhyme != null) {
    score += addSignal(
      signals,
      -0.06 * (1 - coverage),
      `no recognisable sonnet rhyme (${rhyme.pattern})`,
    );
  }

  if (compatibleMetre > 0) {
    const analysis = metre.find(candidate =>
      candidate.confidence === compatibleMetre &&
      ['alexandrine', 'hendecasyllabic', 'iambic-pentameter'].includes(candidate.pattern));
    score += addSignal(
      signals,
      0.08 * compatibleMetre,
      `${analysis.pattern} (${compatibleMetre.toFixed(2)})`,
    );
  } else if (strongest(metre) >= 0.75) {
    score += addSignal(signals, -0.03, 'dominant metre is atypical for a sonnet');
  }

  if (compatibleSyllables > 0) {
    const analysis = syllables.find(candidate =>
      candidate.confidence === compatibleSyllables &&
      ['10-syllable', '11-syllable', '12-syllable', 'decasyllabic', 'hendecasyllabic']
        .includes(candidate.pattern));
    score += addSignal(
      signals,
      0.05 * compatibleSyllables,
      `predominantly ${analysis.pattern} (${compatibleSyllables.toFixed(2)})`,
    );
  } else if (strongest(syllables) >= 0.75) {
    score += addSignal(signals, -0.02, 'dominant syllable count is atypical for a sonnet');
  }

  const sonnetConfidence = roundConfidence(score);
  const petrarchanConfidence = Math.min(sonnetConfidence, subtypeConfidence({
    compatibleMetre,
    compatibleSyllables,
    lineCount,
    rhymeConfidence,
    rhymeMatches: petrarchanRhyme,
    structureConfidence,
    structureMatches: petrarchanStructure,
  }));
  const shakespeareanConfidence = Math.min(sonnetConfidence, subtypeConfidence({
    compatibleMetre,
    compatibleSyllables,
    lineCount,
    rhymeConfidence,
    rhymeMatches: shakespeareanRhyme,
    structureConfidence,
    structureMatches: shakespeareanStructure,
  }));

  return {
    analyses: [
      { pattern: 'sonnet', confidence: sonnetConfidence },
      { pattern: 'petrarchan-sonnet', confidence: petrarchanConfidence },
      { pattern: 'shakespearean-sonnet', confidence: shakespeareanConfidence },
    ].sort((left, right) => right.confidence - left.confidence),
    lineCount,
    signals,
    stanzaLengths,
  };
};

export const formatFormXml = analyses => [
  '<form>',
  ...analyses.map(analysis =>
    `  <analysis pattern="${analysis.pattern}" confidence="${analysis.confidence.toFixed(2)}"/>`),
  '</form>',
].join('\n');
