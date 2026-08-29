#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';

const minimumRunLength = 3;
const maximumPatternLength = 8;

const median = values => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor((sorted.length - 1) / 2)];
};

const indentationWidth = line => {
  const prefix = line.match(/^[ \t]*/u)[0];
  let width = 0;
  [...prefix].forEach(character => {
    width += character === '\t' ? 4 - (width % 4) : 1;
  });
  return width;
};

const plainText = line =>
  line
    .replace(/<[^>]+>/gu, '')
    .replace(/&nbsp;/gu, ' ')
    .trim();

const headingText = line =>
  plainText(line.replace(/<note\b[^>]*>[\s\S]*?<\/note>/gu, ''));

const isSectionHeading = line => {
  if (
    /<nonum(?:\s|>)/u.test(line) === false ||
    /<center(?:\s|>)/u.test(line) === false
  ) {
    return false;
  }

  const heading = headingText(line);
  const letters = heading.match(/\p{L}/gu)?.join('') ?? '';
  return (
    /^(?:\d+|[ivxlcdm]+[a-zæøå]?|\p{L})[.)]?$/iu.test(heading) ||
    /afdeling/iu.test(heading) ||
    /^mel\s*[.:]/iu.test(heading) ||
    (letters.length > 1 &&
      letters === letters.toLocaleUpperCase('da-DK'))
  );
};

const isStanzaDivider = line =>
  line.trim() === '' ||
  /<nonum(?:\s|>)/u.test(line) ||
  /^\s*<wrap(?:\s|>)/u.test(line) ||
  /^\s*-{3,}\s*$/u.test(line) ||
  plainText(line) === '';

const parseBody = body => {
  if (typeof body !== 'string') {
    throw new TypeError('Inputfeltet "body" skal være en streng.');
  }

  const lines = body.replace(/\r\n?/gu, '\n').split('\n');
  const verseLines = [];
  const sections = [];
  let pendingHeading = null;
  let currentSection = null;
  let currentStanza = null;

  const finishStanza = () => {
    if (currentStanza == null) {
      return;
    }
    currentStanza.verseLineEnd =
      currentStanza.verseLineStart + currentStanza.indentations.length - 1;
    currentStanza = null;
  };

  const ensureSection = () => {
    if (currentSection != null) {
      return;
    }
    currentSection = {
      heading: pendingHeading,
      indentations: [],
      stanzas: [],
      verseLineStart: verseLines.length + 1,
    };
    pendingHeading = null;
    sections.push(currentSection);
  };

  const ensureStanza = () => {
    ensureSection();
    if (currentStanza != null) {
      return;
    }
    currentStanza = {
      indentations: [],
      verseLineStart: verseLines.length + 1,
    };
    currentSection.stanzas.push(currentStanza);
  };

  lines.forEach(line => {
    if (isSectionHeading(line)) {
      finishStanza();
      currentSection = null;
      pendingHeading = headingText(line);
      return;
    }
    if (isStanzaDivider(line)) {
      finishStanza();
      return;
    }

    ensureStanza();
    const indentation = indentationWidth(line);
    verseLines.push({
      indentation,
      text: plainText(line),
      verseLine: verseLines.length + 1,
    });
    currentSection.indentations.push(indentation);
    currentStanza.indentations.push(indentation);
  });
  finishStanza();

  sections.forEach((section, index) => {
    section.number = index + 1;
    section.verseLineEnd =
      section.verseLineStart + section.indentations.length - 1;
  });

  return { sections, verseLines };
};

const constantRuns = residuals => {
  const runs = [];
  let start = 0;
  while (start < residuals.length) {
    const offset = residuals[start];
    let end = start + 1;
    while (end < residuals.length && residuals[end] === offset) {
      end += 1;
    }
    if (
      typeof offset === 'number' &&
      offset !== 0 &&
      end - start >= minimumRunLength
    ) {
      runs.push({ end, offset, start });
    }
    start = end;
  }
  return runs;
};

const patternModel = (profile, patternLength) => {
  const phaseValues = Array.from({ length: patternLength }, () => []);
  profile.forEach((indentation, index) => {
    phaseValues[index % patternLength].push(indentation);
  });
  if (phaseValues.some(values => values.length < 3)) {
    return null;
  }

  const pattern = phaseValues.map(median);
  const residuals = profile.map(
    (indentation, index) => indentation - pattern[index % patternLength]
  );
  const runs = constantRuns(residuals);
  const covered = new Set();
  runs.forEach(run => {
    for (let index = run.start; index < run.end; index += 1) {
      covered.add(index);
    }
  });
  const unexplainedIndexes = residuals
    .map((residual, index) => ({ index, residual }))
    .filter(
      item => item.residual !== 0 && covered.has(item.index) === false
    );
  const unexplainedDistance = unexplainedIndexes.reduce(
    (sum, item) => sum + Math.abs(item.residual),
    0
  );

  return {
    explainedCount: profile.length - unexplainedIndexes.length,
    pattern,
    patternLength,
    residuals,
    runs,
    score:
      unexplainedIndexes.length * 100 +
      unexplainedDistance * 10 +
      patternLength,
  };
};

const bestPatternModel = profile => {
  if (profile.length < 6) {
    return null;
  }
  const maxPatternLength = Math.min(
    maximumPatternLength,
    Math.floor(profile.length / 3)
  );
  const models = [];
  for (let length = 1; length <= maxPatternLength; length += 1) {
    const model = patternModel(profile, length);
    if (model != null) {
      models.push(model);
    }
  }
  models.sort(
    (left, right) =>
      left.score - right.score ||
      left.patternLength - right.patternLength
  );
  const best = models[0] ?? null;
  if (best == null || best.explainedCount / profile.length < 0.75) {
    return null;
  }
  return best;
};

const confidenceForRun = ({ atPageBreak, model, run, stanzaCount }) => {
  if (model.basis === 'stanza' && stanzaCount === 1 && !atPageBreak) {
    return 1;
  }
  const restoredAfter = run.end < model.residuals.length;
  const establishedBefore = run.start >= model.patternLength * 2;
  if (
    run.end - run.start >= model.patternLength * 2 &&
    establishedBefore &&
    restoredAfter
  ) {
    return 3;
  }
  if (atPageBreak || establishedBefore || restoredAfter) {
    return 2;
  }
  return 1;
};

const publicConfidence = confidence =>
  ['possible', 'likely', 'strong'][confidence - 1];

const normalizedProfile = profile => {
  const baseline = Math.min(...profile);
  return profile.map(indentation => indentation - baseline);
};

const repeatedSequence = values => {
  const maximumLength = Math.floor(values.length / 2);
  for (let length = 1; length <= maximumLength; length += 1) {
    if (values.every((value, index) => value === values[index % length])) {
      return values.slice(0, length);
    }
  }
  return null;
};

const stanzaPatternModel = section => {
  const byShape = new Map();
  section.stanzas.forEach(stanza => {
    const normalized = normalizedProfile(stanza.indentations);
    const key = `${stanza.indentations.length}:${normalized.join(',')}`;
    const matching = byShape.get(key) ?? [];
    matching.push(stanza);
    byShape.set(key, matching);
  });
  const definitions = [...byShape.values()]
    .filter(stanzas => stanzas.length >= 3)
    .map(stanzas => {
      const stanzaLength = stanzas[0].indentations.length;
      const normalized = normalizedProfile(stanzas[0].indentations);
      const baselines = stanzas.map(stanza =>
        Math.min(...stanza.indentations)
      );
      const baselinePattern = repeatedSequence(baselines) ?? [median(baselines)];
      const representativeBaseline = median(baselines);
      return {
        baselinePattern,
        normalized,
        occurrences: stanzas.length,
        pattern: normalized.map(
          indentation => indentation + representativeBaseline
        ),
        stanzaLength,
        stanzas,
      };
    })
    .sort(
      (left, right) =>
        right.occurrences * right.stanzaLength -
          left.occurrences * left.stanzaLength ||
        left.stanzaLength - right.stanzaLength
    );
  if (definitions.length === 0) {
    return null;
  }

  const expectedProfile = Array(section.indentations.length).fill(null);
  const profileMismatches = [];
  definitions.forEach(definition => {
    definition.stanzas.forEach((stanza, stanzaIndex) => {
      const offset = stanza.verseLineStart - section.verseLineStart;
      const baseline =
        definition.baselinePattern[
          stanzaIndex % definition.baselinePattern.length
        ];
      definition.normalized.forEach((indentation, index) => {
        expectedProfile[offset + index] = indentation + baseline;
      });
    });
  });

  const definitionsByLength = new Map();
  definitions.forEach(definition => {
    const matching = definitionsByLength.get(definition.stanzaLength) ?? [];
    matching.push(definition);
    definitionsByLength.set(definition.stanzaLength, matching);
  });
  definitionsByLength.forEach((matchingDefinitions, stanzaLength) => {
    if (matchingDefinitions.length !== 1) {
      return;
    }
    const definition = matchingDefinitions[0];
    const sameLengthStanzas = section.stanzas.filter(
      stanza => stanza.indentations.length === stanzaLength
    );
    if (
      sameLengthStanzas.length < 4 ||
      sameLengthStanzas.length !== definition.occurrences + 1 ||
      definition.occurrences / sameLengthStanzas.length < 0.75
    ) {
      return;
    }
    const knownStanzas = new Set(definition.stanzas);
    sameLengthStanzas.forEach(stanza => {
      if (knownStanzas.has(stanza)) {
        return;
      }
      const offset = stanza.verseLineStart - section.verseLineStart;
      const expected = definition.pattern;
      expected.forEach((indentation, index) => {
        expectedProfile[offset + index] = indentation;
      });
      profileMismatches.push({
        expected,
        observed: stanza.indentations,
        stanza,
      });
    });
  });
  const residuals = section.indentations.map((indentation, index) => {
    const expected = expectedProfile[index];
    return expected == null ? null : indentation - expected;
  });
  return {
    basis: 'stanza',
    definitions,
    expectedProfile,
    pattern: definitions[0].pattern,
    patternLength: definitions[0].stanzaLength,
    profileMismatches,
    residuals,
    runs: constantRuns(residuals),
  };
};

const stanzaPositionPatternModel = section => {
  const byLength = new Map();
  section.stanzas.forEach(stanza => {
    const matching = byLength.get(stanza.indentations.length) ?? [];
    matching.push(stanza);
    byLength.set(stanza.indentations.length, matching);
  });
  const [stanzaLength, stanzas] = [...byLength.entries()].sort(
    (left, right) =>
      right[1].length * right[0] - left[1].length * left[0] ||
      left[0] - right[0]
  )[0] ?? [null, []];
  if (
    stanzaLength == null ||
    stanzas.length < 3 ||
    stanzas.length / section.stanzas.length < 0.75 ||
    (stanzas.length * stanzaLength) / section.indentations.length < 0.75
  ) {
    return null;
  }

  const pattern = Array.from({ length: stanzaLength }, (_, index) =>
    median(stanzas.map(stanza => stanza.indentations[index]))
  );
  const expectedProfile = Array(section.indentations.length).fill(null);
  stanzas.forEach(stanza => {
    const offset = stanza.verseLineStart - section.verseLineStart;
    pattern.forEach((indentation, index) => {
      expectedProfile[offset + index] = indentation;
    });
  });
  const residuals = section.indentations.map((indentation, index) => {
    const expected = expectedProfile[index];
    return expected == null ? null : indentation - expected;
  });
  return {
    basis: 'stanza_position',
    definitions: [
      {
        baselinePattern: [],
        occurrences: stanzas.length,
        pattern,
        stanzaLength,
      },
    ],
    expectedProfile,
    pattern,
    patternLength: stanzaLength,
    profileMismatches: [],
    residuals,
    runs: constantRuns(residuals),
  };
};

const periodicPatternModel = section => {
  if (section.stanzas.length !== 1) {
    return null;
  }
  const model = bestPatternModel(section.indentations);
  if (model == null) {
    return null;
  }
  return {
    ...model,
    basis: 'periodic',
    definitions: [],
    profileMismatches: [],
    expectedProfile: section.indentations.map(
      (_, index) => model.pattern[index % model.patternLength]
    ),
  };
};

const analyzeSection = ({ pageBreaks, section }) => {
  const model =
    stanzaPatternModel(section) ??
    stanzaPositionPatternModel(section) ??
    periodicPatternModel(section);
  if (model == null) {
    return {
      analysisBasis: null,
      candidateDetails: [],
      dominantPattern: null,
      patternLength: null,
      stanzaPatterns: [],
    };
  }

  const candidateDetails = model.runs.map(run => {
    const verseLineStart = section.verseLineStart + run.start;
    const verseLineEnd = section.verseLineStart + run.end - 1;
    const atPageBreak = pageBreaks.has(verseLineStart);
    const stanzaCount = section.stanzas.filter(
      stanza =>
        stanza.verseLineStart <= verseLineEnd &&
        stanza.verseLineEnd >= verseLineStart
    ).length;
    const expectedPattern = Array.from(
      { length: run.end - run.start },
      (_, index) => model.expectedProfile[run.start + index]
    );
    const observedProfile = section.indentations.slice(run.start, run.end);
    return {
      candidate: {
        type: 'possible_indentation_shift',
        section_number: section.number,
        verse_line_start: verseLineStart,
        verse_line_end: verseLineEnd,
        observed_offset: run.offset,
        expected_profile: expectedPattern,
        observed_profile: observedProfile,
        at_page_break: atPageBreak,
        confidence: publicConfidence(
          confidenceForRun({ atPageBreak, model, run, stanzaCount })
        ),
        reason: `En sammenhængende passage er forskudt ${run.offset > 0 ? '+' : ''}${run.offset} mellemrum fra afdelingens sandsynlige ${model.basis.startsWith('stanza') ? 'strofebaserede ' : ''}indrykningsmønster.`,
        action:
          'Kontrollér passage og sideskift mod facsimilet; ret kun indrykningen, hvis trykket bekræfter forskydningen.',
      },
      model,
    };
  });
  model.profileMismatches.forEach(mismatch => {
    const verseLineStart = mismatch.stanza.verseLineStart;
    const verseLineEnd = mismatch.stanza.verseLineEnd;
    const atPageBreak = pageBreaks.has(verseLineStart);
    candidateDetails.push({
      candidate: {
        type: 'possible_stanza_indentation_mismatch',
        section_number: section.number,
        verse_line_start: verseLineStart,
        verse_line_end: verseLineEnd,
        expected_profile: mismatch.expected,
        observed_profile: mismatch.observed,
        at_page_break: atPageBreak,
        confidence: atPageBreak ? 'strong' : 'likely',
        reason:
          'Strofens indrykningsprofil afviger fra mindst tre andre strofer med samme linjeantal og fælles profil.',
        action:
          'Kontrollér især kapitæler, drop caps og korte linjer mod facsimilet; ret kun indrykningen, hvis trykket bekræfter afvigelsen.',
      },
      model,
    });
  });

  return {
    analysisBasis: model.basis,
    candidateDetails,
    dominantPattern: model.pattern,
    patternLength: model.patternLength,
    stanzaPatterns: model.definitions.map(definition => ({
      baselinePattern: definition.baselinePattern,
      occurrences: definition.occurrences,
      pattern: definition.pattern,
      stanzaLength: definition.stanzaLength,
    })),
  };
};

const sameProfileShape = (left, right) =>
  left.length === right.length &&
  left.every((indentation, index) => indentation === right[index]);

const sectionBoundaryCandidates = sectionAnalyses => {
  const candidates = [];
  for (let index = 1; index < sectionAnalyses.length; index += 1) {
    const previous = sectionAnalyses[index - 1];
    const current = sectionAnalyses[index];
    if (
      previous.dominantPattern == null ||
      current.dominantPattern == null ||
      previous.patternLength !== current.patternLength ||
      sameProfileShape(
        normalizedProfile(previous.dominantPattern),
        normalizedProfile(current.dominantPattern)
      ) === false
    ) {
      continue;
    }

    const offset =
      Math.min(...current.dominantPattern) -
      Math.min(...previous.dominantPattern);
    if (offset === 0) {
      continue;
    }
    candidates.push({
      type: 'possible_section_indentation_shift',
      section_number: current.number,
      verse_line_start: current.verseLineStart,
      verse_line_end: current.verseLineEnd,
      observed_offset: offset,
      expected_profile: previous.dominantPattern,
      observed_profile: current.dominantPattern,
      at_page_break: false,
      confidence: 'possible',
      reason:
        'Afdelingen har samme relative indrykningsprofil som den foregående, men et andet grundindryk. Det kan være tilsigtet for et nyt digt.',
      action:
        'Kontrollér afdelingsstarten mod facsimilet og vurder, om afdelingen er selvstændig eller utilsigtet forskudt.',
    });
  }
  return candidates;
};

const openingCapitalCandidates = parsed => {
  const section = parsed.sections[0];
  const stanza = section?.stanzas[0];
  if (
    section == null ||
    stanza == null ||
    section.verseLineStart !== 1 ||
    stanza.verseLineStart !== 1 ||
    parsed.verseLines.length < 20
  ) {
    return [];
  }

  const smallIndentationCounts = new Map();
  section.indentations.forEach(indentation => {
    if (indentation > 0 && indentation <= 4) {
      smallIndentationCounts.set(
        indentation,
        (smallIndentationCounts.get(indentation) ?? 0) + 1
      );
    }
  });
  let [dominantIndentation, dominantCount] = [...smallIndentationCounts]
    .sort(
      (left, right) => right[1] - left[1] || left[0] - right[0]
    )[0] ?? [null, 0];
  if (dominantCount < 4) {
    const zeroCount = section.indentations.filter(
      indentation => indentation === 0
    ).length;
    [dominantIndentation, dominantCount] = [0, zeroCount];
  }
  if (
    (dominantIndentation === 0 && dominantCount < 12) ||
    (dominantIndentation !== 0 && dominantCount < 4)
  ) {
    return [];
  }

  const openingLimit = Math.min(4, stanza.indentations.length);
  const unusualIndexes = section.indentations
    .map((indentation, index) => ({ indentation, index }))
    .filter(item => item.indentation >= dominantIndentation + 4);
  if (
    unusualIndexes.length < 1 ||
    unusualIndexes.length > 2 ||
    unusualIndexes.some(item => item.index >= openingLimit) ||
    unusualIndexes[0].index !== 0 ||
    /^\p{Lu}/u.test(parsed.verseLines[0].text) === false
  ) {
    return [];
  }

  const end = unusualIndexes.at(-1).index + 1;
  const observedProfile = section.indentations.slice(0, end);
  const unusual = new Set(unusualIndexes.map(item => item.index));
  const expectedProfile = observedProfile.map((indentation, index) =>
    unusual.has(index) ? dominantIndentation : indentation
  );
  return [
    {
      type: 'possible_opening_capital_indentation',
      section_number: section.number,
      verse_line_start: 1,
      verse_line_end: end,
      expected_profile: expectedProfile,
      observed_profile: observedProfile,
      at_page_break: false,
      confidence: 'likely',
      reason:
        `Kun åbningens kapitællinje${unusualIndexes.length === 1 ? '' : 'r'} bruger markant større indrykninger end tekstens gentagne indrykning på ${dominantIndentation} mellemrum. Det kan skyldes OCR-koordinater omkring en kapitæl eller drop cap.`,
      action:
        'Kontrollér åbningen mod facsimilet og de senere strofer; ret kun indrykningen, hvis satsen bekræfter den gentagne profil.',
    },
  ];
};

const analyzeIndentation = input => {
  if (input == null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError(
      'Input skal være et JSON-objekt med feltet "body" og eventuelt "page_breaks".'
    );
  }
  const parsed = parseBody(input.body);
  const rawPageBreaks = input.page_breaks ?? [];
  if (
    !Array.isArray(rawPageBreaks) ||
    rawPageBreaks.some(
      line =>
        !Number.isInteger(line) ||
        line < 1 ||
        line > parsed.verseLines.length
    )
  ) {
    throw new TypeError(
      'Inputfeltet "page_breaks" skal være en liste af gyldige verslinjenumre.'
    );
  }
  const pageBreaks = new Set(rawPageBreaks);
  const sectionAnalyses = parsed.sections.map(section => ({
    ...section,
    ...analyzeSection({ pageBreaks, section }),
  }));
  let candidates = [
    ...sectionAnalyses.flatMap(section =>
      section.candidateDetails.map(detail => detail.candidate)
    ),
    ...sectionBoundaryCandidates(sectionAnalyses),
  ].sort(
    (left, right) =>
      left.verse_line_start - right.verse_line_start ||
      left.type.localeCompare(right.type)
  );
  if (candidates.length === 0) {
    candidates = openingCapitalCandidates(parsed);
  }
  const stableSectionCount = sectionAnalyses.filter(
    section => section.dominantPattern != null
  ).length;
  let status = 'no_stable_pattern';
  if (candidates.length > 0) {
    status = 'candidates_found';
  } else if (stableSectionCount > 0) {
    status = 'no_candidates';
  } else if (parsed.verseLines.length < 6) {
    status = 'insufficient_evidence';
  }

  return {
    status,
    verse_line_count: parsed.verseLines.length,
    indentation_profile: parsed.verseLines.map(line => line.indentation),
    sections: sectionAnalyses.map(section => ({
      section_number: section.number,
      heading: section.heading,
      verse_line_start: section.verseLineStart,
      verse_line_end: section.verseLineEnd,
      indentation_profile: section.indentations,
      dominant_pattern: section.dominantPattern,
      analysis_basis: section.analysisBasis,
      stanza_patterns: section.stanzaPatterns.map(pattern => ({
        stanza_length: pattern.stanzaLength,
        occurrences: pattern.occurrences,
        pattern: pattern.pattern,
        baseline_pattern: pattern.baselinePattern,
      })),
    })),
    candidates,
  };
};

const usage = () => {
  console.error(
    'Brug: node analyze-indentation.js [input.json|-]\n' +
      'Uden filnavn læses JSON fra standard input.'
  );
};

const main = () => {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    usage();
    return;
  }
  if (args.length > 1) {
    usage();
    process.exitCode = 2;
    return;
  }

  try {
    const filename = args[0];
    const json =
      filename == null || filename === '-'
        ? fs.readFileSync(0, 'utf8')
        : fs.readFileSync(filename, 'utf8');
    console.log(JSON.stringify(analyzeIndentation(JSON.parse(json)), null, 2));
  } catch (error) {
    console.error(`Kunne ikke analysere indrykninger: ${error.message}`);
    process.exitCode = 1;
  }
};

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}

export { analyzeIndentation, parseBody };
