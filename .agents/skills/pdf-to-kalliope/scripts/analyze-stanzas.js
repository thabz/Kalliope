#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';

const knownForms = [
  {
    name: 'sonnet-petrarchan',
    verseLineCount: 14,
    stanzaLengths: [4, 4, 3, 3],
  },
  {
    name: 'sonnet-shakespearean',
    verseLineCount: 14,
    stanzaLengths: [4, 4, 4, 2],
  },
];

const maxKnownFormBoundaryChanges = 2;

const plainText = line =>
  line
    .replace(/<[^>]+>/gu, '')
    .replace(/&nbsp;/gu, ' ')
    .trim();

const isStanzaDivider = line =>
  line.trim() === '' ||
  /<nonum(?:\s|>)/u.test(line) ||
  /^\s*<wrap(?:\s|>)/u.test(line) ||
  /^\s*<right(?:\s|>)/u.test(line) ||
  /^\s*-{3,}\s*$/u.test(line) ||
  plainText(line) === '';

const cumulativeBoundaries = stanzaLengths => {
  const boundaries = [];
  let line = 0;

  stanzaLengths.slice(0, -1).forEach(length => {
    line += length;
    boundaries.push(line);
  });

  return boundaries;
};

const symmetricDifference = (left, right) => {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return [
    ...left.filter(value => !rightSet.has(value)),
    ...right.filter(value => !leftSet.has(value)),
  ];
};

const parseBody = body => {
  if (typeof body !== 'string') {
    throw new TypeError('Inputfeltet "body" skal være en streng.');
  }

  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const stanzaLengths = [];
  const stanzas = [];
  let currentLines = [];
  let verseLineCount = 0;

  const finishStanza = () => {
    if (currentLines.length === 0) {
      return;
    }

    const endVerseLine = verseLineCount;
    stanzas.push({
      lines: currentLines,
      startVerseLine: endVerseLine - currentLines.length + 1,
      endVerseLine,
    });
    stanzaLengths.push(currentLines.length);
    currentLines = [];
  };

  lines.forEach(line => {
    if (isStanzaDivider(line)) {
      finishStanza();
      return;
    }

    currentLines.push(line);
    verseLineCount += 1;
  });

  finishStanza();

  return {
    observedBoundaries: cumulativeBoundaries(stanzaLengths),
    stanzaLengths,
    stanzas,
    verseLineCount,
  };
};

const candidateKey = candidate =>
  `${candidate.type}:${candidate.after_verse_line ?? candidate.verse_line_start}`;

const addCandidate = (candidates, candidate) => {
  const key = candidateKey(candidate);
  const existing = candidates.get(key);

  if (existing == null || candidate.confidence > existing.confidence) {
    candidates.set(key, candidate);
  }
};

const boundaryCandidate = ({
  afterVerseLine,
  confidence,
  expectedPattern,
  formName = null,
  type,
}) => {
  const missing = type === 'possible_missing_boundary';
  const uniformPattern = expectedPattern.every(
    length => length === expectedPattern[0]
  );
  const patternReason = expectedPattern.join('+');
  const reason =
    formName == null
      ? uniformPattern
        ? `Digtet består ellers overvejende af strofer på ${expectedPattern[0]} linjer.`
        : `Strofeinddelingen følger ellers mønstret ${patternReason}.`
      : `Grænsen afviger fra den sandsynlige form ${formName} (${patternReason}).`;

  return {
    type,
    after_verse_line: afterVerseLine,
    confidence,
    reason,
    action: missing
      ? 'Kontrollér, om der mangler en strofegrænse efter denne verslinje.'
      : 'Kontrollér, om strofegrænsen efter denne verslinje er overflødig.',
  };
};

const knownFormAnalysis = ({
  observedBoundaries,
  verseLineCount,
  candidates,
}) => {
  const matchingForms = knownForms
    .filter(form => form.verseLineCount === verseLineCount)
    .map(form => {
      const expectedBoundaries = cumulativeBoundaries(form.stanzaLengths);
      return {
        ...form,
        boundaryChanges: symmetricDifference(
          observedBoundaries,
          expectedBoundaries
        ).length,
        expectedBoundaries,
      };
    })
    .filter(form => form.boundaryChanges <= maxKnownFormBoundaryChanges)
    .sort(
      (left, right) =>
        left.boundaryChanges - right.boundaryChanges ||
        left.name.localeCompare(right.name)
    );

  if (matchingForms.length === 0) {
    return [];
  }

  const bestChangeCount = matchingForms[0].boundaryChanges;
  const preferredForms = matchingForms.filter(
    form => form.boundaryChanges === bestChangeCount
  );
  const confidence = bestChangeCount === 1 ? 3 : bestChangeCount === 2 ? 2 : 1;

  preferredForms.forEach(form => {
    const expectedSet = new Set(form.expectedBoundaries);
    const observedSet = new Set(observedBoundaries);

    observedBoundaries
      .filter(boundary => !expectedSet.has(boundary))
      .forEach(boundary => {
        addCandidate(
          candidates,
          boundaryCandidate({
            afterVerseLine: boundary,
            confidence,
            expectedPattern: form.stanzaLengths,
            formName: form.name,
            type: 'possible_extra_boundary',
          })
        );
      });

    form.expectedBoundaries
      .filter(boundary => !observedSet.has(boundary))
      .forEach(boundary => {
        addCandidate(
          candidates,
          boundaryCandidate({
            afterVerseLine: boundary,
            confidence,
            expectedPattern: form.stanzaLengths,
            formName: form.name,
            type: 'possible_missing_boundary',
          })
        );
      });
  });

  return matchingForms.map((form, index) => ({
    name: form.name,
    expected_stanza_lengths: form.stanzaLengths,
    boundary_changes: form.boundaryChanges,
    preferred: form.boundaryChanges === bestChangeCount,
    rank: index + 1,
  }));
};

const dominantStanzaLength = stanzaLengths => {
  if (stanzaLengths.length < 4) {
    return null;
  }

  const frequencies = new Map();
  stanzaLengths.forEach(length => {
    frequencies.set(length, (frequencies.get(length) ?? 0) + 1);
  });

  const sorted = [...frequencies.entries()].sort(
    (left, right) => right[1] - left[1] || left[0] - right[0]
  );
  const [length, count] = sorted[0];
  const tied = sorted[1]?.[1] === count;

  if (tied || count < 3 || count / stanzaLengths.length < 0.6) {
    return null;
  }

  return length;
};

const dominantPatternAnalysis = ({
  stanzaLengths,
  candidates,
}) => {
  const dominantLength = dominantStanzaLength(stanzaLengths);
  if (dominantLength == null) {
    return null;
  }

  const candidateCountBefore = candidates.size;
  const symmetricFrameLength =
    stanzaLengths.length >= 4 &&
    stanzaLengths[0] === stanzaLengths.at(-1) &&
    stanzaLengths[0] !== dominantLength &&
    stanzaLengths[0] % dominantLength === 0
      ? stanzaLengths[0]
      : null;
  let stanzaIndex = 0;
  let verseLinesBeforeRun = 0;
  while (stanzaIndex < stanzaLengths.length) {
    const length = stanzaLengths[stanzaIndex];
    if (length === dominantLength) {
      verseLinesBeforeRun += length;
      stanzaIndex += 1;
      continue;
    }

    const runLengths = [];
    while (
      stanzaIndex < stanzaLengths.length &&
      stanzaLengths[stanzaIndex] !== dominantLength
    ) {
      runLengths.push(stanzaLengths[stanzaIndex]);
      stanzaIndex += 1;
    }

    const runLength = runLengths.reduce((sum, item) => sum + item, 0);
    const isSymmetricFrameRun =
      runLengths.length === 1 &&
      runLengths[0] === symmetricFrameLength &&
      (verseLinesBeforeRun === 0 || stanzaIndex === stanzaLengths.length);
    if (!isSymmetricFrameRun && runLength % dominantLength === 0) {
      const expectedPattern = Array(runLength / dominantLength).fill(
        dominantLength
      );
      const expectedBoundaries = cumulativeBoundaries(expectedPattern).map(
        boundary => verseLinesBeforeRun + boundary
      );
      const observedBoundaries = cumulativeBoundaries(runLengths).map(
        boundary => verseLinesBeforeRun + boundary
      );
      const expectedSet = new Set(expectedBoundaries);
      const observedSet = new Set(observedBoundaries);

      observedBoundaries
        .filter(boundary => !expectedSet.has(boundary))
        .forEach(boundary => {
          addCandidate(
            candidates,
            boundaryCandidate({
              afterVerseLine: boundary,
              confidence: 2,
              expectedPattern,
              type: 'possible_extra_boundary',
            })
          );
        });

      expectedBoundaries
        .filter(boundary => !observedSet.has(boundary))
        .forEach(boundary => {
          addCandidate(
            candidates,
            boundaryCandidate({
              afterVerseLine: boundary,
              confidence: 2,
              expectedPattern,
              type: 'possible_missing_boundary',
            })
          );
        });
    }

    verseLinesBeforeRun += runLength;
  }

  if (candidates.size === candidateCountBefore) {
    let stanzaStart = 1;
    stanzaLengths.forEach((length, index) => {
      const isSymmetricFrame =
        length === symmetricFrameLength &&
        (index === 0 || index === stanzaLengths.length - 1);
      if (length !== dominantLength && !isSymmetricFrame) {
        addCandidate(candidates, {
          type: 'possible_irregular_stanza',
          stanza_number: index + 1,
          verse_line_start: stanzaStart,
          verse_line_end: stanzaStart + length - 1,
          observed_length: length,
          expected_length: dominantLength,
          confidence: 1,
          reason: `De øvrige strofer har overvejende ${dominantLength} linjer, men denne har ${length}.`,
          action: 'Kontrollér hele strofen og dens nabogrænser mod facsimilet.',
        });
      }
      stanzaStart += length;
    });
  }

  return dominantLength;
};

const localPatternAnalysis = ({ stanzaLengths, candidates }) => {
  let stanzaStart = 0;
  const localCandidates = [];
  const supportsPattern = (lengths, targetLength) => {
    const targetCount = lengths.filter(length => length === targetLength).length;
    return (
      (targetCount >= 3 && targetCount / lengths.length >= 0.6) ||
      (targetCount >= 2 && targetCount === lengths.length)
    );
  };

  const observedBoundaries = cumulativeBoundaries(stanzaLengths);
  const mergeTargets = new Set(stanzaLengths);
  stanzaLengths.forEach((_, index) => {
    for (
      let windowSize = 2;
      windowSize <= 4 && index + windowSize <= stanzaLengths.length;
      windowSize += 1
    ) {
      const window = stanzaLengths.slice(index, index + windowSize);
      mergeTargets.add(window.reduce((sum, item) => sum + item, 0));
    }
  });

  mergeTargets.forEach(targetLength => {
    const mergedStanzas = [];
    const removedBoundaryIndexes = [];
    let index = 0;

    while (index < stanzaLengths.length) {
      let sum = 0;
      let windowSize = 0;
      for (
        let size = 1;
        size <= 4 && index + size <= stanzaLengths.length;
        size += 1
      ) {
        sum += stanzaLengths[index + size - 1];
        if (sum === targetLength) {
          windowSize = size;
          break;
        }
        if (sum > targetLength) {
          break;
        }
      }

      if (windowSize === 0) {
        mergedStanzas.push(stanzaLengths[index]);
        index += 1;
        continue;
      }

      mergedStanzas.push(targetLength);
      for (let offset = 0; offset < windowSize - 1; offset += 1) {
        removedBoundaryIndexes.push(index + offset);
      }
      index += windowSize;
    }

    if (
      removedBoundaryIndexes.length === 0 ||
      (removedBoundaryIndexes.length > 1 && mergedStanzas.length < 3) ||
      !supportsPattern(mergedStanzas, targetLength)
    ) {
      return;
    }

    const matchingStanzaCount = mergedStanzas.filter(
      stanzaLength => stanzaLength === targetLength
    ).length;
    const coherence = matchingStanzaCount / mergedStanzas.length;
    removedBoundaryIndexes.forEach(boundaryIndex => {
      localCandidates.push({
        coherence,
        editCount: removedBoundaryIndexes.length,
        observedSupport: stanzaLengths.filter(
          stanzaLength => stanzaLength === targetLength
        ).length,
        candidate: {
          type: 'possible_extra_boundary',
          after_verse_line: observedBoundaries[boundaryIndex],
          confidence: coherence >= 0.8 ? 2 : 1,
          reason: `Strofefragmenterne kan samles til et dominerende mønster på ${targetLength} linjer.`,
          action:
            'Kontrollér, om strofegrænsen efter denne verslinje er overflødig.',
        },
      });
    });
  });

  stanzaLengths.forEach((length, index) => {
    const splitLengths = [...new Set(stanzaLengths)]
      .filter(
        splitLength =>
          splitLength >= 2 &&
          splitLength < length &&
          length % splitLength === 0
      )
      .sort((left, right) => left - right);
    splitLengths.forEach(splitLength => {
      const observedSupport = stanzaLengths.filter(
        stanzaLength => stanzaLength === splitLength
      ).length;
      const splitCount = length / splitLength;
      // A single short block can be a page fragment rather than a complete
      // stanza. Do not let one observation manufacture an arbitrarily long
      // run of identical stanzas; geometry can supply the missing evidence.
      if (observedSupport < 2 && splitCount > 3) {
        return;
      }
      const splitStanzas = stanzaLengths.toSpliced(
        index,
        1,
        ...Array(splitCount).fill(splitLength)
      );
      if (!supportsPattern(splitStanzas, splitLength)) {
        return;
      }

      const matchingStanzaCount = splitStanzas.filter(
        stanzaLength => stanzaLength === splitLength
      ).length;
      const coherence = matchingStanzaCount / splitStanzas.length;
      for (let splitIndex = 1; splitIndex < splitCount; splitIndex += 1) {
        localCandidates.push({
          coherence,
          editCount: splitCount - 1,
          observedSupport,
          candidate: {
            type: 'possible_missing_boundary',
            after_verse_line: stanzaStart + splitIndex * splitLength,
            confidence: observedSupport >= 2 && coherence >= 0.8 ? 2 : 1,
            reason: `Strofen på ${length} linjer er et heltalsmultiplum af den lokalt observerede strofelængde på ${splitLength} linjer.`,
            action:
              'Kontrollér, om der mangler en strofegrænse efter denne verslinje.',
          },
        });
      }
    });

    stanzaStart += length;
  });

  const bestCoherence = Math.max(
    0,
    ...localCandidates.map(item => item.coherence)
  );
  const bestObservedSupport = Math.max(
    0,
    ...localCandidates
      .filter(item => item.coherence === bestCoherence)
      .map(item => item.observedSupport)
  );
  const bestEditCount = Math.min(
    ...localCandidates
      .filter(item => item.coherence === bestCoherence)
      .filter(item => item.observedSupport === bestObservedSupport)
      .map(item => item.editCount)
  );
  localCandidates
    .filter(
      item =>
        item.coherence === bestCoherence &&
        item.observedSupport === bestObservedSupport &&
        item.editCount === bestEditCount
    )
    .forEach(item => addCandidate(candidates, item.candidate));
};

const globalUniformPatternAnalysis = ({
  observedBoundaries,
  stanzaLengths,
  verseLineCount,
  candidates,
}) => {
  if (stanzaLengths.length < 8 || verseLineCount < 12) {
    return { hypotheses: [], targetLength: null };
  }

  const observedSet = new Set(observedBoundaries);
  const maxLength = Math.min(24, Math.floor(verseLineCount / 3));
  const hypotheses = [];

  for (let targetLength = 2; targetLength <= maxLength; targetLength += 1) {
    if (verseLineCount % targetLength !== 0) continue;

    const stanzaCount = verseLineCount / targetLength;
    const expectedBoundaries = Array.from(
      { length: stanzaCount - 1 },
      (_, index) => (index + 1) * targetLength
    );
    const expectedSet = new Set(expectedBoundaries);
    const removedBoundaries = observedBoundaries.filter(
      boundary => !expectedSet.has(boundary)
    );
    const addedBoundaries = expectedBoundaries.filter(
      boundary => !observedSet.has(boundary)
    );
    const alignedBoundaryCount =
      expectedBoundaries.length - addedBoundaries.length;
    const alignedBoundaryRatio =
      expectedBoundaries.length === 0
        ? 0
        : alignedBoundaryCount / expectedBoundaries.length;
    const intactStanzaCount = stanzaLengths.filter(
      length => length === targetLength
    ).length;

    // En global hypotese skal have selvstændig støtte i den observerede tekst.
    // Ellers vil tilfældige divisorer af det samlede linjetal ligne versformer.
    if (intactStanzaCount < 3 || alignedBoundaryRatio < 0.5) continue;

    // Manglende grænser er dyrere end ekstra grænser: OCR og sideopdeling
    // indsætter ofte falske blanklinjer, mens en helt usynlig trykt grænse er
    // mindre sandsynlig. Det skelner bl.a. 16 × 14 fra 32 × 7 i lange digte.
    const editCost =
      removedBoundaries.length + 3 * addedBoundaries.length;
    const boundaryPopulation =
      observedBoundaries.length + expectedBoundaries.length;
    const intactLineCoverage =
      (intactStanzaCount * targetLength) / verseLineCount;
    const score =
      4 * alignedBoundaryRatio +
      2 * intactLineCoverage -
      2 * (editCost / boundaryPopulation);

    hypotheses.push({
      targetLength,
      stanzaCount,
      score,
      alignedBoundaryCount,
      alignedBoundaryRatio,
      intactStanzaCount,
      removedBoundaries,
      addedBoundaries,
      editCost,
    });
  }

  hypotheses.sort(
    (left, right) =>
      right.score - left.score ||
      left.editCost - right.editCost ||
      right.targetLength - left.targetLength
  );

  const publicHypotheses = hypotheses.slice(0, 3).map((hypothesis, index) => ({
    stanza_length: hypothesis.targetLength,
    stanza_count: hypothesis.stanzaCount,
    score: Number(hypothesis.score.toFixed(3)),
    intact_stanza_count: hypothesis.intactStanzaCount,
    aligned_boundary_count: hypothesis.alignedBoundaryCount,
    expected_boundary_count: hypothesis.stanzaCount - 1,
    boundaries_to_remove: hypothesis.removedBoundaries,
    boundaries_to_add: hypothesis.addedBoundaries,
    preferred: index === 0,
  }));

  const best = hypotheses[0];
  const runnerUp = hypotheses[1];
  const scoreMargin =
    best == null ? 0 : runnerUp == null ? best.score : best.score - runnerUp.score;
  if (best == null || best.score < 1.25 || scoreMargin < 0.2) {
    return { hypotheses: publicHypotheses, targetLength: null };
  }

  const reason = `En global afprøvning af hele digtet foretrækker ${best.stanzaCount} strofer på ${best.targetLength} linjer uden rest.`;
  best.removedBoundaries.forEach(boundary => {
    addCandidate(candidates, {
      type: 'possible_extra_boundary',
      after_verse_line: boundary,
      confidence: scoreMargin >= 0.4 ? 3 : 2,
      reason,
      action: 'Kontrollér, om strofegrænsen efter denne verslinje er overflødig.',
    });
  });
  best.addedBoundaries.forEach(boundary => {
    addCandidate(candidates, {
      type: 'possible_missing_boundary',
      after_verse_line: boundary,
      confidence: scoreMargin >= 0.4 ? 3 : 2,
      reason,
      action: 'Kontrollér, om der mangler en strofegrænse efter denne verslinje.',
    });
  });

  return {
    hypotheses: publicHypotheses,
    targetLength: best.targetLength,
  };
};

const punctuationAnalysis = ({ stanzas, candidates }) => {
  stanzas.forEach((stanza, index) => {
    if (index === 0 || index === stanzas.length - 1 || stanza.lines.length !== 1) {
      return;
    }

    const previousStanza = stanzas[index - 1];
    const previousLine = previousStanza.lines.at(-1).trimEnd();
    const isolatedLine = stanza.lines[0].trimEnd();
    if (!previousLine.endsWith(',') || !isolatedLine.endsWith(',')) {
      return;
    }

    const reason =
      'En enkeltstående verslinje er omgivet af strofegrænser, selv om både linjen før og enkeltlinjen selv ender med komma.';
    [previousStanza.endVerseLine, stanza.endVerseLine].forEach(boundary => {
      addCandidate(candidates, {
        type: 'possible_extra_boundary',
        after_verse_line: boundary,
        confidence: 2,
        reason,
        action:
          'Kontrollér, om strofegrænsen efter denne verslinje er overflødig.',
      });
    });
  });
};

const publicCandidate = candidate => {
  const { confidence, ...rest } = candidate;
  return {
    ...rest,
    confidence: ['possible', 'likely', 'strong'][confidence - 1],
  };
};

const analyzeStanzas = input => {
  if (input == null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Input skal være et JSON-objekt med feltet "body".');
  }

  const parsed = parseBody(input.body);
  const candidates = new Map();
  const recognizedForms = knownFormAnalysis({
    ...parsed,
    candidates,
  });
  const observedDominantLength =
    recognizedForms.length > 0
      ? null
      : dominantPatternAnalysis({
          ...parsed,
          candidates,
        });
  const globalPattern = recognizedForms.length === 0
    ? globalUniformPatternAnalysis({
        ...parsed,
        candidates,
      })
    : { hypotheses: [], targetLength: null };
  const dominantLength =
    observedDominantLength ?? globalPattern.targetLength;
  if (
    globalPattern.targetLength != null &&
    globalPattern.targetLength !== observedDominantLength
  ) {
    const globallyExpectedBoundaries = new Set(
      cumulativeBoundaries(
        Array(parsed.verseLineCount / globalPattern.targetLength)
          .fill(globalPattern.targetLength)
      )
    );
    [...candidates.entries()].forEach(([key, candidate]) => {
      const boundary = candidate.after_verse_line;
      const contradictsGlobalPattern =
        (candidate.type === 'possible_missing_boundary' &&
          !globallyExpectedBoundaries.has(boundary)) ||
        (candidate.type === 'possible_extra_boundary' &&
          globallyExpectedBoundaries.has(boundary));
      if (contradictsGlobalPattern) candidates.delete(key);
    });
  }
  if (
    recognizedForms.length === 0 &&
    observedDominantLength == null &&
    globalPattern.targetLength == null
  ) {
    localPatternAnalysis({
      ...parsed,
      candidates,
    });
  }
  punctuationAnalysis({
    ...parsed,
    candidates,
  });

  const publicCandidates = [...candidates.values()]
    .sort(
      (left, right) =>
        (left.after_verse_line ?? left.verse_line_start) -
          (right.after_verse_line ?? right.verse_line_start) ||
        left.type.localeCompare(right.type)
    )
    .map(publicCandidate);

  let status = 'no_stable_pattern';
  if (publicCandidates.length > 0) {
    status = 'candidates_found';
  } else if (recognizedForms.length > 0 || dominantLength != null) {
    status = 'no_candidates';
  } else if (parsed.stanzaLengths.length < 3) {
    status = 'insufficient_evidence';
  }

  return {
    status,
    verse_line_count: parsed.verseLineCount,
    observed_stanza_lengths: parsed.stanzaLengths,
    dominant_stanza_length: dominantLength,
    recognized_forms: recognizedForms,
    uniform_pattern_hypotheses: globalPattern.hypotheses,
    candidates: publicCandidates,
  };
};

const usage = () => {
  console.error(
    'Brug: node analyze-stanzas.js [input.json|-]\n' +
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
    const result = analyzeStanzas(JSON.parse(json));
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Kunne ikke analysere strofer: ${error.message}`);
    process.exitCode = 1;
  }
};

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}

export { analyzeStanzas, parseBody };
