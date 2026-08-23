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
    if (line.trim() === '') {
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
    if (runLength % dominantLength === 0) {
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
      if (length !== dominantLength) {
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
    if (length % 2 === 0 && length / 2 >= 2) {
      const splitLength = length / 2;
      const splitStanzas = stanzaLengths.toSpliced(
        index,
        1,
        splitLength,
        splitLength
      );
      if (supportsPattern(splitStanzas, splitLength)) {
        const matchingStanzaCount = splitStanzas.filter(
          stanzaLength => stanzaLength === splitLength
        ).length;
        const coherence = matchingStanzaCount / splitStanzas.length;
        localCandidates.push({
          coherence,
          editCount: 1,
          candidate: {
            type: 'possible_missing_boundary',
            after_verse_line: stanzaStart + splitLength,
            confidence: coherence >= 0.8 ? 2 : 1,
            reason: `Strofen på ${length} linjer kan deles til et dominerende mønster på ${splitLength} linjer.`,
            action:
              'Kontrollér, om der mangler en strofegrænse efter denne verslinje.',
          },
        });
      }
    }

    stanzaStart += length;
  });

  const bestCoherence = Math.max(
    0,
    ...localCandidates.map(item => item.coherence)
  );
  const bestEditCount = Math.min(
    ...localCandidates
      .filter(item => item.coherence === bestCoherence)
      .map(item => item.editCount)
  );
  localCandidates
    .filter(
      item =>
        item.coherence === bestCoherence && item.editCount === bestEditCount
    )
    .forEach(item => addCandidate(candidates, item.candidate));
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
  const dominantLength =
    recognizedForms.length > 0
      ? null
      : dominantPatternAnalysis({
          ...parsed,
          candidates,
        });
  if (recognizedForms.length === 0 && dominantLength == null) {
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
