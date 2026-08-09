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

const isSectionHeading = line => {
  if (!/^\s*<nonum(?:\s|>)/u.test(line)) {
    return false;
  }

  return /^(?:[IVXLCDM]+|\d+)[.)]?$/u.test(plainText(line));
};

const parseBody = body => {
  if (typeof body !== 'string') {
    throw new TypeError('Inputfeltet "body" skal være en streng.');
  }

  const lines = body.replace(/\r\n?/gu, '\n').split('\n');
  const verseLines = [];
  const sections = [];
  let pendingHeading = null;
  let currentSection = null;

  const ensureSection = () => {
    if (currentSection != null) {
      return;
    }
    currentSection = {
      heading: pendingHeading,
      indentations: [],
      verseLineStart: verseLines.length + 1,
    };
    pendingHeading = null;
    sections.push(currentSection);
  };

  lines.forEach(line => {
    if (isSectionHeading(line)) {
      currentSection = null;
      pendingHeading = plainText(line);
      return;
    }
    if (/^\s*<nonum(?:\s|>)/u.test(line) || line.trim() === '') {
      return;
    }

    ensureSection();
    const indentation = indentationWidth(line);
    verseLines.push({
      indentation,
      text: plainText(line),
      verseLine: verseLines.length + 1,
    });
    currentSection.indentations.push(indentation);
  });

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
    if (offset !== 0 && end - start >= minimumRunLength) {
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

const confidenceForRun = ({ atPageBreak, model, run }) => {
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

const analyzeSection = ({ pageBreaks, section }) => {
  const model = bestPatternModel(section.indentations);
  if (model == null) {
    return {
      candidateDetails: [],
      dominantPattern: null,
      patternLength: null,
    };
  }

  const candidateDetails = model.runs.map(run => {
    const verseLineStart = section.verseLineStart + run.start;
    const verseLineEnd = section.verseLineStart + run.end - 1;
    const atPageBreak = pageBreaks.has(verseLineStart);
    const expectedPattern = Array.from(
      { length: run.end - run.start },
      (_, index) => model.pattern[(run.start + index) % model.patternLength]
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
          confidenceForRun({ atPageBreak, model, run })
        ),
        reason: `En sammenhængende passage er forskudt ${run.offset > 0 ? '+' : ''}${run.offset} mellemrum fra afdelingens sandsynlige indrykningsmønster.`,
        action:
          'Kontrollér passage og sideskift mod facsimilet; ret kun indrykningen, hvis trykket bekræfter forskydningen.',
      },
      model,
    };
  });

  return {
    candidateDetails,
    dominantPattern: model.pattern,
    patternLength: model.patternLength,
  };
};

const normalizedPattern = pattern => {
  const baseline = Math.min(...pattern);
  return pattern.map(indentation => indentation - baseline);
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
        normalizedPattern(previous.dominantPattern),
        normalizedPattern(current.dominantPattern)
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
  const candidates = [
    ...sectionAnalyses.flatMap(section =>
      section.candidateDetails.map(detail => detail.candidate)
    ),
    ...sectionBoundaryCandidates(sectionAnalyses),
  ].sort(
    (left, right) =>
      left.verse_line_start - right.verse_line_start ||
      left.type.localeCompare(right.type)
  );
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
