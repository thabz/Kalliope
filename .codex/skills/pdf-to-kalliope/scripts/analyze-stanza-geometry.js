#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';

const defaultThresholds = {
  alignedMaxRatio: 1.25,
  boundaryMinRatio: 1.75,
};

const median = values => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

const finiteNumber = (value, field) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`OCR-linjens ${field} skal være et tal.`);
  }
  return number;
};

const normalizeLine = (line, index) => {
  if (line == null || typeof line !== 'object' || Array.isArray(line)) {
    throw new TypeError('Hver OCR-linje skal være et objekt.');
  }
  const text = String(line.text ?? '').trim();
  if (text === '') return null;
  return {
    inputIndex: index,
    page: finiteNumber(line.page ?? 1, 'page'),
    left: finiteNumber(line.left, 'left'),
    top: finiteNumber(line.top, 'top'),
    width: finiteNumber(line.width, 'width'),
    height: finiteNumber(line.height, 'height'),
    text,
  };
};

const parseTesseractTsv = tsv => {
  if (typeof tsv !== 'string') {
    throw new TypeError('TSV-input skal være en streng.');
  }
  const rows = tsv.replace(/\r\n?/gu, '\n').split('\n');
  const header = rows.shift()?.split('\t') ?? [];
  const required = [
    'level', 'page_num', 'block_num', 'par_num', 'line_num', 'word_num',
    'left', 'top', 'width', 'height', 'text',
  ];
  const indexes = Object.fromEntries(
    required.map(field => [field, header.indexOf(field)])
  );
  const missing = required.filter(field => indexes[field] === -1);
  if (missing.length > 0) {
    throw new Error(`TSV-headeren mangler: ${missing.join(', ')}.`);
  }

  const pageBoxes = new Map();
  rows.forEach(row => {
    if (row.trim() === '') return;
    const fields = row.split('\t');
    if (fields[indexes.level] !== '1') return;
    pageBoxes.set(finiteNumber(fields[indexes.page_num], 'page_num'), {
      left: finiteNumber(fields[indexes.left], 'left'),
      width: finiteNumber(fields[indexes.width], 'width'),
    });
  });

  const groups = new Map();
  rows.forEach(row => {
    if (row.trim() === '') return;
    const fields = row.split('\t');
    if (fields[indexes.level] !== '5') return;
    const text = fields.slice(indexes.text).join('\t').trim();
    if (text === '') return;
    const key = [
      fields[indexes.page_num], fields[indexes.block_num],
      fields[indexes.par_num], fields[indexes.line_num],
    ].join(':');
    const word = {
      word: finiteNumber(fields[indexes.word_num], 'word_num'),
      left: finiteNumber(fields[indexes.left], 'left'),
      top: finiteNumber(fields[indexes.top], 'top'),
      width: finiteNumber(fields[indexes.width], 'width'),
      height: finiteNumber(fields[indexes.height], 'height'),
      text,
    };
    const page = finiteNumber(fields[indexes.page_num], 'page_num');
    const pageBox = pageBoxes.get(page);
    if (pageBox != null) {
      const centre = word.left + word.width / 2;
      const relativeCentre = (centre - pageBox.left) / pageBox.width;
      const narrowFringeArtifact =
        word.width / pageBox.width < 0.02 &&
        (relativeCentre < 0.05 || relativeCentre > 0.95);
      if (
        relativeCentre < 0.02 || relativeCentre > 0.98 ||
        narrowFringeArtifact
      ) {
        return;
      }
    }
    const group = groups.get(key) ?? {
      page,
      words: [],
    };
    group.words.push(word);
    groups.set(key, group);
  });

  return [...groups.values()].map(group => {
    const words = group.words.sort((left, right) => left.word - right.word);
    const left = Math.min(...words.map(word => word.left));
    const top = Math.min(...words.map(word => word.top));
    const right = Math.max(...words.map(word => word.left + word.width));
    const bottom = Math.max(...words.map(word => word.top + word.height));
    return {
      page: group.page,
      left,
      top,
      width: right - left,
      height: bottom - top,
      text: words.map(word => word.text).join(' '),
    };
  });
};

const stanzaLengths = (lineCount, boundaries) => {
  const lengths = [];
  let previous = 0;
  [...boundaries, lineCount].forEach(boundary => {
    lengths.push(boundary - previous);
    previous = boundary;
  });
  return lengths;
};

const analyzeStanzaGeometry = input => {
  if (input == null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Input skal være et JSON-objekt med feltet "lines".');
  }
  if (!Array.isArray(input.lines)) {
    throw new TypeError('Inputfeltet "lines" skal være en liste.');
  }

  const thresholds = {
    alignedMaxRatio: Number(
      input.thresholds?.aligned_max_ratio ?? defaultThresholds.alignedMaxRatio
    ),
    boundaryMinRatio: Number(
      input.thresholds?.boundary_min_ratio ?? defaultThresholds.boundaryMinRatio
    ),
  };
  if (
    !Number.isFinite(thresholds.alignedMaxRatio) ||
    !Number.isFinite(thresholds.boundaryMinRatio) ||
    thresholds.alignedMaxRatio <= 1 ||
    thresholds.boundaryMinRatio <= thresholds.alignedMaxRatio
  ) {
    throw new RangeError(
      'Geometritærsklerne skal opfylde 1 < aligned_max_ratio < boundary_min_ratio.'
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
  const comparesWithXml = input.observed_boundaries != null;
  const observedBoundaries = new Set(input.observed_boundaries ?? []);
  [...observedBoundaries].forEach(boundary => {
    if (!Number.isInteger(boundary) || boundary < 1 || boundary >= lines.length) {
      throw new RangeError(
        'Alle observed_boundaries skal være gyldige verslinjenumre før sidste linje.'
      );
    }
  });

  const pageNumbers = [...new Set(lines.map(line => line.page))];
  const pageLineGroups = new Map(
    pageNumbers.map(page => [page, lines.filter(line => line.page === page)])
  );
  const globalDeltas = [...pageLineGroups.values()].flatMap(pageLines =>
    pageLines.slice(0, -1)
      .map((line, index) => pageLines[index + 1].top - line.top)
      .filter(delta => delta > 0)
  );
  const globalPitch = median(globalDeltas);
  const pages = [];
  const allGaps = [];
  pageNumbers.forEach(page => {
    const pageLines = pageLineGroups.get(page);
    const rawGaps = pageLines.slice(0, -1).map((line, index) => ({
      after: line,
      before: pageLines[index + 1],
      delta: pageLines[index + 1].top - line.top,
    })).filter(gap => gap.delta > 0);
    const pagePitch = median(rawGaps.map(gap => gap.delta));
    const usesWorkFallback = rawGaps.length < 2 && pageNumbers.length > 1;
    const normalPitch = usesWorkFallback ? globalPitch : pagePitch;
    const gaps = rawGaps.map(gap => {
      const ratio = normalPitch == null ? null : gap.delta / normalPitch;
      const classification = ratio == null
        ? 'insufficient_evidence'
        : ratio <= thresholds.alignedMaxRatio
          ? 'continuous'
          : ratio >= thresholds.boundaryMinRatio
            ? 'boundary'
            : 'ambiguous';
      const result = {
        page,
        after_verse_line: gap.after.verseLine,
        before_text: gap.after.text,
        after_text: gap.before.text,
        top_delta: gap.delta,
        normal_line_pitch: normalPitch,
        ratio: ratio == null ? null : Number(ratio.toFixed(3)),
        classification,
      };
      allGaps.push(result);
      return result;
    });
    pages.push({
      page,
      line_count: pageLines.length,
      normal_line_pitch: normalPitch,
      pitch_basis: usesWorkFallback ? 'work' : 'page',
      gaps,
    });
  });

  const suggestedBoundaries = allGaps
    .filter(gap => gap.classification === 'boundary')
    .map(gap => gap.after_verse_line);
  const candidates = [];
  allGaps.forEach(gap => {
    const observed = observedBoundaries.has(gap.after_verse_line);
    if (gap.classification === 'boundary' && !comparesWithXml) {
      candidates.push({
        type: 'possible_stanza_boundary',
        after_verse_line: gap.after_verse_line,
        page: gap.page,
        confidence: 'strong',
        ratio: gap.ratio,
        reason: `Den målte linjeafstand er ${gap.ratio} gange den normale linjeafstand.`,
      });
    } else if (gap.classification === 'boundary' && !observed) {
      candidates.push({
        type: 'possible_missing_boundary',
        after_verse_line: gap.after_verse_line,
        page: gap.page,
        confidence: 'strong',
        ratio: gap.ratio,
        reason: `Den målte linjeafstand er ${gap.ratio} gange den normale linjeafstand.`,
      });
    } else if (
      gap.classification === 'continuous' && comparesWithXml && observed
    ) {
      candidates.push({
        type: 'possible_extra_boundary',
        after_verse_line: gap.after_verse_line,
        page: gap.page,
        confidence: 'strong',
        ratio: gap.ratio,
        reason: `XML har en strofegrænse, men den målte linjeafstand er kun ${gap.ratio} gange normalen.`,
      });
    } else if (gap.classification === 'ambiguous') {
      candidates.push({
        type: 'ambiguous_boundary_geometry',
        after_verse_line: gap.after_verse_line,
        page: gap.page,
        confidence: 'possible',
        ratio: gap.ratio,
        observed_boundary: observed,
        reason: `Den målte linjeafstand ligger mellem tærsklerne (${thresholds.alignedMaxRatio}–${thresholds.boundaryMinRatio}).`,
      });
    }
  });

  return {
    status: lines.length < 3
      ? 'insufficient_evidence'
      : candidates.length > 0
        ? 'candidates_found'
        : 'no_candidates',
    line_count: lines.length,
    thresholds: {
      aligned_max_ratio: thresholds.alignedMaxRatio,
      boundary_min_ratio: thresholds.boundaryMinRatio,
    },
    suggested_boundaries: suggestedBoundaries,
    suggested_stanza_lengths: stanzaLengths(lines.length, suggestedBoundaries),
    pages,
    candidates,
  };
};

const runCli = () => {
  const inputPath = process.argv[2];
  if (inputPath == null) {
    console.error('Brug: node analyze-stanza-geometry.js INPUT.json|OCR.tsv');
    process.exitCode = 1;
    return;
  }
  const source = fs.readFileSync(inputPath, 'utf8');
  const input = inputPath.toLowerCase().endsWith('.tsv')
    ? { lines: parseTesseractTsv(source) }
    : JSON.parse(source);
  process.stdout.write(`${JSON.stringify(analyzeStanzaGeometry(input), null, 2)}\n`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) runCli();

export { analyzeStanzaGeometry, parseTesseractTsv };
