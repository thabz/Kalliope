#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';
import { parseTesseractTsv } from './analyze-stanza-geometry.js';

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
    characterAdvance: measuredAdvance,
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
  if (
    !Array.isArray(observed) || observed.length !== lines.length ||
    observed.some(value => !Number.isFinite(Number(value)) || Number(value) < 0)
  ) {
    throw new TypeError(
      'observed_indentation skal have ét ikke-negativt tal for hver OCR-linje.'
    );
  }

  const pages = [];
  const candidates = [];
  const suggestedIndentedLines = [];
  [...new Set(lines.map(line => line.page))].forEach(page => {
    const pageLines = lines.filter(line => line.page === page);
    const baselineLeft = lowerQuartileMedian(pageLines.map(line => line.left));
    const normalCharacterAdvance = median(
      pageLines
        .filter(line => line.text.replace(/\s/gu, '').length >= 4)
        .map(line => line.characterAdvance)
    ) ?? median(pageLines.map(line => line.characterAdvance));
    const measurements = pageLines.map(line => {
      const displacement = line.left - baselineLeft;
      const characters = displacement / normalCharacterAdvance;
      const classification = characters <= alignedMax
        ? 'aligned'
        : characters >= indentMin
          ? 'indented'
          : 'ambiguous';
      const observedIndented = Number(observed[line.verseLine - 1]) > 0;
      if (classification === 'indented') suggestedIndentedLines.push(line.verseLine);
      if (classification === 'indented' && !comparesWithXml) {
        candidates.push({
          type: 'possible_indentation',
          verse_line: line.verseLine,
          page,
          confidence: 'strong',
          displacement_characters: Number(characters.toFixed(3)),
          reason: 'Facsimilelinjen er forskudt mere end den sikre indrykningstærskel.',
        });
      } else if (classification === 'indented' && !observedIndented) {
        candidates.push({
          type: 'possible_missing_indentation',
          verse_line: line.verseLine,
          page,
          confidence: 'strong',
          displacement_characters: Number(characters.toFixed(3)),
          reason: 'Facsimilelinjen er forskudt mere end den sikre indrykningstærskel, men XML-linjen er ikke indrykket.',
        });
      } else if (
        classification === 'aligned' && comparesWithXml && observedIndented
      ) {
        candidates.push({
          type: 'possible_extra_indentation',
          verse_line: line.verseLine,
          page,
          confidence: 'strong',
          displacement_characters: Number(characters.toFixed(3)),
          reason: 'XML-linjen er indrykket, men facsimilelinjens forskydning er højst én normal tegnbredde.',
        });
      } else if (classification === 'ambiguous') {
        candidates.push({
          type: 'ambiguous_indentation_geometry',
          verse_line: line.verseLine,
          page,
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
        classification,
      };
    });
    pages.push({
      page,
      line_count: pageLines.length,
      baseline_left: baselineLeft,
      normal_character_advance: Number(normalCharacterAdvance.toFixed(3)),
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
