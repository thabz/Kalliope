#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  estimatePageRotation,
  levelPoint,
  parseTesseractTsv,
} from './analyze-stanza-geometry.js';

const median = values => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

const lowerQuartileMedian = values => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return median(sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 4))));
};

const baselineClusters = (values, tolerance, minimumCount = 2) => {
  const sorted = [...values].sort((left, right) => left - right);
  const clusters = [];
  sorted.forEach(value => {
    const cluster = clusters.at(-1);
    if (cluster == null || value - cluster[0] > tolerance) {
      clusters.push([value]);
    } else {
      cluster.push(value);
    }
  });
  return clusters.filter(cluster => cluster.length >= minimumCount).map(cluster => ({
    count: cluster.length,
    left: median(cluster),
  }));
};

const unreliableReason = issue => issue === 'drop_cap_clearance'
  ? 'En stor begyndelseskapitæl forskyder den efterfølgende linjes fysiske start, så den ikke kan bruges som poetisk indrykning.'
  : 'OCR mangler indledende tegn eller bogstaver, så linjestarten kan ikke måles sikkert.';

const selectBaseline = ({
  alignedMax,
  comparesWithXml,
  indentMin,
  levelledLines,
  normalCharacterAdvance,
  observed,
}) => {
  const reliableLines = levelledLines.filter(line => line.indentationGeometrySafe);
  const basisLines = reliableLines.length > 0 ? reliableLines : levelledLines;
  const values = basisLines.map(line => line.levelledLeft);
  if (comparesWithXml) {
    const observedBaselineValues = basisLines
      .filter(line => Number(observed[line.verseLine - 1]) === 0)
      .map(line => line.levelledLeft);
    const clusters = baselineClusters(
      observedBaselineValues,
      alignedMax * normalCharacterAdvance,
      1
    );
    if (clusters.length > 0) {
      return clusters.sort((left, right) =>
        right.count - left.count || left.left - right.left
      )[0].left;
    }
  }
  const clusters = baselineClusters(
    values,
    alignedMax * normalCharacterAdvance
  );
  if (clusters.length === 0) return lowerQuartileMedian(values);
  if (!comparesWithXml) {
    const leftmost = clusters[0];
    if (leftmost.count / values.length >= 0.25) return leftmost.left;
  }
  return clusters.map(cluster => {
    const mismatches = comparesWithXml
      ? basisLines.filter(line => {
        const displacement =
          (line.levelledLeft - cluster.left) / normalCharacterAdvance;
        const predicted = displacement >= indentMin;
        const observedIndented = Number(observed[line.verseLine - 1]) > 0;
        return predicted !== observedIndented;
      }).length
      : 0;
    return { ...cluster, mismatches };
  }).sort((left, right) =>
    left.mismatches - right.mismatches ||
    right.count - left.count ||
    left.left - right.left
  )[0].left;
};

const normalizeLine = (line, index) => {
  if (line == null || typeof line !== 'object' || Array.isArray(line)) {
    throw new TypeError('Hver OCR-linje skal være et objekt.');
  }
  const text = String(line.text ?? '').trim();
  if (text === '') return null;
  const numeric = field => {
    const value = Number(line[field]);
    if (!Number.isFinite(value)) {
      throw new TypeError(`OCR-linjens ${field} skal være et tal.`);
    }
    return value;
  };
  const visibleCharacters = text.replace(/\s/gu, '').length;
  const measuredAdvance = line.character_advance == null
    ? numeric('width') / Math.max(visibleCharacters, 1)
    : Number(line.character_advance);
  if (!Number.isFinite(measuredAdvance) || measuredAdvance <= 0) {
    throw new TypeError('OCR-linjens character_advance skal være et positivt tal.');
  }
  return {
    inputIndex: index,
    page: Number(line.page ?? 1),
    left: numeric('left'),
    top: numeric('top'),
    width: numeric('width'),
    height: numeric('height'),
    anchorLeft: Number(line.anchor_left ?? line.left),
    anchorCentreY: Number(
      line.anchor_center_y ?? numeric('top') + numeric('height') / 2
    ),
    rotationSlope: line.rotation_slope == null
      ? null
      : Number(line.rotation_slope),
    characterAdvance: measuredAdvance,
    indentationGeometrySafe: line.indentation_geometry_safe !== false,
    indentationGeometryIssue: line.indentation_geometry_issue ?? null,
    text,
  };
};

const analyzeIndentationGeometry = input => {
  if (input == null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Input skal være et JSON-objekt med feltet "lines".');
  }
  if (!Array.isArray(input.lines)) {
    throw new TypeError('Inputfeltet "lines" skal være en liste.');
  }
  const alignedMax = Number(
    input.thresholds?.aligned_max_characters ?? 1
  );
  const indentMin = Number(
    input.thresholds?.indent_min_characters ?? 1.5
  );
  if (
    !Number.isFinite(alignedMax) || !Number.isFinite(indentMin) ||
    alignedMax < 1 || indentMin <= alignedMax
  ) {
    throw new RangeError(
      'Indrykningstærsklerne skal opfylde 1 <= aligned_max_characters < indent_min_characters.'
    );
  }

  const lines = input.lines
    .map(normalizeLine)
    .filter(Boolean)
    .sort(
      (left, right) =>
        left.page - right.page || left.top - right.top || left.left - right.left
    )
    .map((line, index) => ({ ...line, verseLine: index + 1 }));
  const comparesWithXml = input.observed_indentation != null;
  const observed = input.observed_indentation ?? Array(lines.length).fill(0);
  const indentationSections = input.indentation_sections ??
    Array(lines.length).fill(1);
  if (
    !Array.isArray(observed) || observed.length !== lines.length ||
    observed.some(value => !Number.isFinite(Number(value)) || Number(value) < 0)
  ) {
    throw new TypeError(
      'observed_indentation skal have ét ikke-negativt tal for hver OCR-linje.'
    );
  }
  if (
    !Array.isArray(indentationSections) ||
    indentationSections.length !== lines.length ||
    indentationSections.some(value =>
      !Number.isInteger(Number(value)) || Number(value) < 1
    )
  ) {
    throw new TypeError(
      'indentation_sections skal have ét positivt heltal for hver OCR-linje.'
    );
  }
  lines.forEach((line, index) => {
    line.indentationSection = Number(indentationSections[index]);
  });

  const pages = [];
  const candidates = [];
  const suggestedIndentedLines = [];
  const pageSections = [...new Set(lines.map(line =>
    `${line.page}:${line.indentationSection}`
  ))].map(key => {
    const [page, indentationSection] = key.split(':').map(Number);
    return { page, indentationSection };
  });
  pageSections.forEach(({ page, indentationSection }) => {
    const pageLines = lines.filter(line =>
      line.page === page && line.indentationSection === indentationSection
    );
    const hasObservedBaseline = !comparesWithXml || pageLines.some(
      line => line.indentationGeometrySafe &&
        Number(observed[line.verseLine - 1]) === 0
    );
    const hasObservedIndentation = comparesWithXml && pageLines.some(
      line => line.indentationGeometrySafe &&
        Number(observed[line.verseLine - 1]) > 0
    );
    const rotation = estimatePageRotation(pageLines);
    const levelledLines = pageLines.map(line => ({
      ...line,
      levelledLeft: levelPoint(
        line.anchorLeft,
        line.anchorCentreY,
        rotation.angle
      ).x,
    }));
    const normalCharacterAdvance = median(
      pageLines
        .filter(line => line.text.replace(/\s/gu, '').length >= 4)
        .map(line => line.characterAdvance)
    ) ?? median(pageLines.map(line => line.characterAdvance));
    const baselineLeft = selectBaseline({
      alignedMax,
      comparesWithXml:
        comparesWithXml && hasObservedBaseline && hasObservedIndentation,
      indentMin,
      levelledLines,
      normalCharacterAdvance,
      observed,
    });
    const measurements = levelledLines.map(line => {
      const displacement = line.levelledLeft - baselineLeft;
      const characters = displacement / normalCharacterAdvance;
      const classification = characters <= alignedMax
        ? 'aligned'
        : characters >= indentMin
          ? 'indented'
          : 'ambiguous';
      const observedIndented = Number(observed[line.verseLine - 1]) > 0;
      if (!line.indentationGeometrySafe) {
        candidates.push({
          type: 'unreliable_indentation_geometry',
          verse_line: line.verseLine,
          page,
          indentation_section: indentationSection,
          confidence: 'possible',
          reason: unreliableReason(line.indentationGeometryIssue),
          cause: line.indentationGeometryIssue,
        });
      } else if (classification === 'indented') {
        suggestedIndentedLines.push(line.verseLine);
      }
      if (!line.indentationGeometrySafe) {
        // The measurement is retained for diagnostics but must not become a
        // claim about the source indentation.
      } else if (classification === 'indented' && !comparesWithXml) {
        candidates.push({
          type: 'possible_indentation',
          verse_line: line.verseLine,
          page,
          indentation_section: indentationSection,
          confidence: 'strong',
          displacement_characters: Number(characters.toFixed(3)),
          reason: 'Facsimilelinjen er forskudt mere end den sikre indrykningstærskel.',
        });
      } else if (classification === 'indented' && !observedIndented) {
        candidates.push({
          type: 'possible_missing_indentation',
          verse_line: line.verseLine,
          page,
          indentation_section: indentationSection,
          confidence: 'strong',
          displacement_characters: Number(characters.toFixed(3)),
          reason: 'Facsimilelinjen er forskudt mere end den sikre indrykningstærskel, men XML-linjen er ikke indrykket.',
        });
      } else if (
        classification === 'aligned' && comparesWithXml && observedIndented &&
        hasObservedBaseline
      ) {
        candidates.push({
          type: 'possible_extra_indentation',
          verse_line: line.verseLine,
          page,
          indentation_section: indentationSection,
          confidence: 'strong',
          displacement_characters: Number(characters.toFixed(3)),
          reason: 'XML-linjen er indrykket, men facsimilelinjens forskydning er højst én normal tegnbredde.',
        });
      } else if (classification === 'ambiguous') {
        candidates.push({
          type: 'ambiguous_indentation_geometry',
          verse_line: line.verseLine,
          page,
          indentation_section: indentationSection,
          confidence: 'possible',
          displacement_characters: Number(characters.toFixed(3)),
          observed_indentation: Number(observed[line.verseLine - 1]),
          reason: `Forskydningen ligger mellem tærsklerne (${alignedMax}–${indentMin} tegnbredder).`,
        });
      }
      return {
        verse_line: line.verseLine,
        text: line.text,
        left: line.left,
        displacement_pixels: Number(displacement.toFixed(3)),
        displacement_characters: Number(characters.toFixed(3)),
        classification: line.indentationGeometrySafe
          ? classification
          : 'unreliable',
      };
    });
    if (comparesWithXml && !hasObservedBaseline) {
      candidates.push({
        type: 'unanchored_page_indentation',
        page,
        indentation_section: indentationSection,
        confidence: 'possible',
        verse_lines: pageLines.map(line => line.verseLine),
        reason:
          'Alle XML-verslinjer på siden er indrykket, så siden mangler en sikker nul-linje til geometrisk sammenligning.',
      });
    }
    pages.push({
      page,
      indentation_section: indentationSection,
      line_count: pageLines.length,
      baseline_left: Number(baselineLeft.toFixed(3)),
      normal_character_advance: Number(normalCharacterAdvance.toFixed(3)),
      rotation_degrees: Number((rotation.angle * 180 / Math.PI).toFixed(4)),
      rotation_basis: rotation.basis,
      baseline_comparison: hasObservedBaseline ? 'anchored' : 'relative_only',
      measurements,
    });
  });

  return {
    status: lines.length < 2
      ? 'insufficient_evidence'
      : candidates.length > 0
        ? 'candidates_found'
        : 'no_candidates',
    line_count: lines.length,
    thresholds: {
      aligned_max_characters: alignedMax,
      indent_min_characters: indentMin,
    },
    suggested_indented_lines: suggestedIndentedLines,
    pages,
    candidates,
  };
};

const runCli = () => {
  const inputPath = process.argv[2];
  if (inputPath == null) {
    console.error('Brug: node analyze-indentation-geometry.js INPUT.json|OCR.tsv');
    process.exitCode = 1;
    return;
  }
  const source = fs.readFileSync(inputPath, 'utf8');
  const input = inputPath.toLowerCase().endsWith('.tsv')
    ? { lines: parseTesseractTsv(source) }
    : JSON.parse(source);
  process.stdout.write(`${JSON.stringify(analyzeIndentationGeometry(input), null, 2)}\n`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) runCli();

export { analyzeIndentationGeometry };
