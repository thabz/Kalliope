#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  directChild,
  elementChildren,
  parseXml,
  serializeChildren,
} from './audit-utils.js';
import { parseTesseractTsv } from './analyze-stanza-geometry.js';

const minimumMatchSimilarity = 0.48;
const ambiguousMatchMargin = 0.035;
const densePhysicalWrappingRatio = 0.4;
const densePhysicalWrappingMinimum = 4;

const decodeEntities = value => value
  .replace(/&amp;/gu, '&')
  .replace(/&apos;/gu, "'")
  .replace(/&quot;/gu, '"')
  .replace(/&lt;/gu, '<')
  .replace(/&gt;/gu, '>')
  .replace(/&#(\d+);/gu, (_, number) => String.fromCodePoint(Number(number)))
  .replace(/&#x([\da-f]+);/giu, (_, number) =>
    String.fromCodePoint(Number.parseInt(number, 16))
  );

const plainText = value => decodeEntities(value.replace(/<[^>]+>/gu, ''));

const normalizeForMatch = value => plainText(String(value ?? ''))
  .normalize('NFKD')
  .replace(/\p{M}/gu, '')
  .toLocaleLowerCase('da-DK')
  .replace(/ſ/gu, 's')
  .replace(/æ/gu, 'ae')
  .replace(/ø/gu, 'o')
  .replace(/å/gu, 'aa')
  .replace(/[^\p{L}\p{N}]+/gu, '');

const levenshteinDistance = (left, right) => {
  if (left === right) return 0;
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[right.length];
};

const textSimilarity = (left, right) => {
  const normalizedLeft = normalizeForMatch(left);
  const normalizedRight = normalizeForMatch(right);
  const longest = Math.max(normalizedLeft.length, normalizedRight.length);
  if (longest === 0) return 1;
  return 1 - levenshteinDistance(normalizedLeft, normalizedRight) / longest;
};

const facsimileNumber = facsimile => {
  const match = /^(\d+)\.jpg$/iu.exec(facsimile ?? '');
  return match == null ? null : Number(match[1]);
};

const facsimileFromPageNumber = pageNumber =>
  `${String(Number(pageNumber) - 1).padStart(3, '0')}.jpg`;

const firstNumber = value => /^(\d+)/u.exec(value ?? '')?.[1] ?? null;

const sourceForText = (workhead, source) => {
  const wanted = source?.getAttribute('in') ?? 'default';
  return elementChildren(workhead, 'source').find(candidate =>
    (candidate.getAttribute('id') ?? 'default') === wanted
  ) ?? null;
};

const initialFacsimile = (source, workSource, firstPb) => {
  const explicit = firstNumber(source?.getAttribute('facsimile-pages'));
  if (explicit != null) return facsimileFromPageNumber(explicit);
  const printed = firstNumber(source?.getAttribute('pages'));
  const offset = workSource?.getAttribute('facsimile-pages-offset');
  if (printed != null && /^-?\d+$/u.test(offset ?? '')) {
    return facsimileFromPageNumber(Number(printed) + Number(offset));
  }
  const firstPbFacsimile = firstPb?.getAttribute('facs') ?? null;
  const firstPbNumber = facsimileNumber(firstPbFacsimile);
  return firstPbNumber == null
    ? null
    : `${String(firstPbNumber - 1).padStart(3, '0')}.jpg`;
};

const isVerseLine = serialized => {
  const trimmed = serialized.trim();
  return trimmed !== '' &&
    !/^<nonum(?:\s|>)/u.test(trimmed) &&
    !/^<wrap(?:\s|>)/u.test(trimmed) &&
    !/^<right(?:\s|>)/u.test(trimmed) &&
    !/^<hr(?:\s|\/|>)/u.test(trimmed) &&
    !/^-{3,}$/u.test(trimmed) &&
    plainText(trimmed).trim() !== '';
};

const isStructuralDivider = serialized => {
  const trimmed = serialized.trim();
  return /^<nonum(?:\s|>)/u.test(trimmed) ||
    /^<wrap(?:\s|>)/u.test(trimmed) ||
    /^<right(?:\s|>)/u.test(trimmed) ||
    /^<hr(?:\s|\/|>)/u.test(trimmed) ||
    /^-{3,}$/u.test(trimmed);
};

const isNumberedSectionDivider = serialized => {
  const trimmed = serialized.trim();
  if (!/^<nonum(?:\s|>)/u.test(trimmed)) return false;
  return /^(?:\d+|[ivxlcdm]+)[.]?$/iu.test(plainText(trimmed).trim());
};

const countIndentation = serialized => {
  const prefix = /^[ \t]*/u.exec(serialized)?.[0] ?? '';
  return [...prefix].reduce((total, character) =>
    total + (character === '\t' ? 4 : 1), 0
  );
};

const pbPattern = /<pb\b[^>]*\bfacs="([^"]+)"[^>]*\/>/gu;

const parsePoetryElement = ({ poetry, startingFacsimile }) => {
  const serialized = serializeChildren(poetry).replace(/\r\n?/gu, '\n');
  const lines = [];
  const equipment = [];
  const observedBoundaries = [];
  const issues = [];
  let currentFacsimile = startingFacsimile;
  let pendingBoundary = null;
  let indentationSection = 1;
  serialized.split('\n').forEach(serializedLine => {
    const matches = [...serializedLine.matchAll(pbPattern)];
    const withoutPageBreaks = serializedLine.replace(pbPattern, '');
    const firstPb = matches[0];
    if (firstPb != null) {
      const before = serializedLine.slice(0, firstPb.index);
      const after = serializedLine.slice(firstPb.index + firstPb[0].length);
      const hasVisibleBefore = plainText(before).trim() !== '';
      const hasVisibleAfter = plainText(after).trim() !== '';
      if (hasVisibleBefore && hasVisibleAfter) {
        issues.push({
          type: 'page_break_inside_verse_line',
          source_verse_line: lines.length + 1,
          from_facsimile: currentFacsimile,
          to_facsimile: firstPb[1],
        });
      } else if (!hasVisibleBefore) {
        currentFacsimile = firstPb[1];
      }
    }
    if (isVerseLine(withoutPageBreaks)) {
      if (pendingBoundary != null && pendingBoundary < lines.length + 1) {
        observedBoundaries.push(pendingBoundary);
      }
      pendingBoundary = null;
      lines.push({
        source_verse_line: lines.length + 1,
        text: plainText(withoutPageBreaks).trim(),
        indentation: countIndentation(withoutPageBreaks),
        indentation_section: indentationSection,
        facsimile: currentFacsimile,
      });
    } else if (withoutPageBreaks.trim() === '' ||
      isStructuralDivider(withoutPageBreaks)) {
      if (lines.length > 0) pendingBoundary = lines.length;
      const equipmentText = plainText(withoutPageBreaks).trim();
      if (equipmentText !== '') {
        equipment.push({
          text: equipmentText,
          facsimile: currentFacsimile,
          after_source_verse_line: lines.length,
        });
      }
      if (isNumberedSectionDivider(withoutPageBreaks) && lines.length > 0) {
        indentationSection += 1;
      }
    }
    if (matches.length > 0) currentFacsimile = matches.at(-1)[1];
  });
  return {
    lines,
    equipment,
    observedBoundaries: [...new Set(observedBoundaries)],
    issues,
    endingFacsimile: currentFacsimile,
  };
};

const extractPoetryBlocks = xml => {
  const document = parseXml(xml);
  const workhead = directChild(document.documentElement, 'workhead');
  const entries = Array.from(document.getElementsByTagName('*')).filter(node =>
    (node.nodeName === 'text' || node.nodeName === 'prose') &&
    directChild(node, 'head') != null && directChild(node, 'body') != null
  );
  const blocks = [];
  entries.forEach(entry => {
    const body = directChild(entry, 'body');
    const head = directChild(entry, 'head');
    const source = directChild(head, 'source');
    if (body == null) return;
    const firstPb = body.getElementsByTagName('pb')[0] ?? null;
    let currentFacsimile = initialFacsimile(
      source,
      sourceForText(workhead, source),
      firstPb,
    );
    let blockIndex = 0;
    elementChildren(body).forEach(child => {
      if (child.nodeName === 'poetry') {
        blockIndex += 1;
        const parsed = parsePoetryElement({
          poetry: child,
          startingFacsimile: currentFacsimile,
        });
        currentFacsimile = parsed.endingFacsimile;
        blocks.push({
          textId: entry.getAttribute('id') ?? '',
          pages: source?.getAttribute('pages') ?? null,
          blockIndex,
          ...parsed,
        });
      } else {
        const pageBreaks = Array.from(child.getElementsByTagName('pb'));
        const facsimile = pageBreaks.at(-1)?.getAttribute('facs') ?? null;
        if (facsimile != null) currentFacsimile = facsimile;
      }
    });
  });
  return blocks;
};

const operationPriority = operation => ({
  match: 0,
  exclude_ocr: 1,
  missing_xml: 2,
  merge_ocr: 3,
  split_xml: 4,
}[operation] ?? 9);

const updateCell = (cells, row, column, candidate) => {
  const previous = cells[row][column];
  if (
    previous == null || candidate.cost < previous.cost - 1e-9 ||
    (
      Math.abs(candidate.cost - previous.cost) <= 1e-9 &&
      operationPriority(candidate.operation.type) <
        operationPriority(previous.operation.type)
    )
  ) {
    cells[row][column] = candidate;
  }
};

const alignPage = ({ expectedLines, ocrLines }) => {
  const expectedCount = expectedLines.length;
  const ocrCount = ocrLines.length;
  const cells = Array.from(
    { length: expectedCount + 1 },
    () => Array(ocrCount + 1).fill(null),
  );
  cells[0][0] = { cost: 0, previous: null, operation: null };
  for (let expectedIndex = 0; expectedIndex <= expectedCount; expectedIndex += 1) {
    for (let ocrIndex = 0; ocrIndex <= ocrCount; ocrIndex += 1) {
      const cell = cells[expectedIndex][ocrIndex];
      if (cell == null) continue;
      if (ocrIndex < ocrCount) {
        updateCell(cells, expectedIndex, ocrIndex + 1, {
          cost: cell.cost + 0.42,
          previous: [expectedIndex, ocrIndex],
          operation: {
            type: 'exclude_ocr',
            ocr: [ocrIndex],
            expectedCursor: expectedIndex,
          },
        });
      }
      if (expectedIndex < expectedCount) {
        updateCell(cells, expectedIndex + 1, ocrIndex, {
          cost: cell.cost + 0.82,
          previous: [expectedIndex, ocrIndex],
          operation: { type: 'missing_xml', expected: [expectedIndex] },
        });
      }
      if (expectedIndex < expectedCount && ocrIndex < ocrCount) {
        const similarity = textSimilarity(
          expectedLines[expectedIndex].text,
          ocrLines[ocrIndex].text,
        );
        if (similarity >= minimumMatchSimilarity) {
          updateCell(cells, expectedIndex + 1, ocrIndex + 1, {
            cost: cell.cost + 1 - similarity,
            previous: [expectedIndex, ocrIndex],
            operation: {
              type: 'match',
              expected: [expectedIndex],
              ocr: [ocrIndex],
              similarity,
            },
          });
        }
      }
      if (expectedIndex < expectedCount && ocrIndex + 1 < ocrCount) {
        const firstPartSimilarity = textSimilarity(
          expectedLines[expectedIndex].text,
          ocrLines[ocrIndex].text,
        );
        const secondPartSimilarity = textSimilarity(
          expectedLines[expectedIndex].text,
          ocrLines[ocrIndex + 1].text,
        );
        const similarity = textSimilarity(
          expectedLines[expectedIndex].text,
          `${ocrLines[ocrIndex].text} ${ocrLines[ocrIndex + 1].text}`,
        );
        if (
          similarity >= minimumMatchSimilarity &&
          similarity >= Math.max(firstPartSimilarity, secondPartSimilarity) + 0.025
        ) {
          updateCell(cells, expectedIndex + 1, ocrIndex + 2, {
            // Prefer a demonstrably complete two-row reading over accepting a
            // truncated first row and discarding its continuation as equipment.
            cost: cell.cost + 1.3 - similarity,
            previous: [expectedIndex, ocrIndex],
            operation: {
              type: 'merge_ocr',
              expected: [expectedIndex],
              ocr: [ocrIndex, ocrIndex + 1],
              similarity,
            },
          });
        }
      }
      if (
        expectedIndex + 1 < expectedCount && ocrIndex < ocrCount &&
        expectedLines[expectedIndex].blockKey ===
          expectedLines[expectedIndex + 1].blockKey
      ) {
        const similarity = textSimilarity(
          `${expectedLines[expectedIndex].text} ${expectedLines[expectedIndex + 1].text}`,
          ocrLines[ocrIndex].text,
        );
        if (similarity >= minimumMatchSimilarity) {
          updateCell(cells, expectedIndex + 2, ocrIndex + 1, {
            cost: cell.cost + 1.5 - similarity,
            previous: [expectedIndex, ocrIndex],
            operation: {
              type: 'split_xml',
              expected: [expectedIndex, expectedIndex + 1],
              ocr: [ocrIndex],
              similarity,
            },
          });
        }
      }
    }
  }
  const operations = [];
  let cursor = [expectedCount, ocrCount];
  while (cursor[0] !== 0 || cursor[1] !== 0) {
    const cell = cells[cursor[0]][cursor[1]];
    operations.push(cell.operation);
    cursor = cell.previous;
  }
  operations.reverse();

  const matchedOcr = new Set(
    operations.filter(operation => operation.type !== 'exclude_ocr')
      .flatMap(operation => operation.ocr ?? []),
  );
  operations.forEach(operation => {
    if (operation.type !== 'match') return;
    const expectedIndex = operation.expected[0];
    const alternatives = ocrLines
      .map((line, index) => ({
        index,
        similarity: textSimilarity(expectedLines[expectedIndex].text, line.text),
      }))
      .filter(candidate =>
        !matchedOcr.has(candidate.index) &&
        candidate.similarity >= minimumMatchSimilarity &&
        candidate.similarity >= operation.similarity - ambiguousMatchMargin
      );
    if (alternatives.length > 0) operation.alternatives = alternatives;
  });

  const matchedExpected = operations
    .filter(operation => operation.type !== 'missing_xml' && operation.expected != null)
    .reduce((total, operation) => total + operation.expected.length, 0);
  const similarities = operations
    .map(operation => operation.similarity)
    .filter(value => value != null);
  const averageSimilarity = similarities.length === 0
    ? 0
    : similarities.reduce((sum, value) => sum + value, 0) / similarities.length;
  const missingCount = operations.filter(operation =>
    operation.type === 'missing_xml'
  ).length;
  const structuralCount = operations.filter(operation =>
    operation.type === 'merge_ocr' || operation.type === 'split_xml'
  ).length;
  const ambiguousCount = operations.filter(operation =>
    operation.alternatives != null
  ).length;
  return {
    operations,
    matchedExpected,
    averageSimilarity,
    selectionScore:
      matchedExpected * 10 + averageSimilarity * 5 - missingCount * 20 -
      structuralCount * 8 - ambiguousCount * 4,
  };
};

const classifyExcluded = (line, knownEquipment = []) => {
  const normalized = String(line.text ?? '').trim();
  if (/^(?:\d+|[ivxlcdm]+)[.]?$/iu.test(normalized)) return 'page_or_section_number';
  if (/^[*—–_.·-]{2,}$/u.test(normalized)) return 'ornament_or_separator';
  if (knownEquipment.some(item => textSimilarity(item.text, normalized) >= 0.8)) {
    return 'known_xml_equipment';
  }
  return 'unmatched_page_content';
};

const normalizeVariantLines = (lines, facsimile) => {
  const page = facsimileNumber(facsimile);
  return lines.map(line => ({
    ...line,
    page: page ?? Number(line.page ?? 1),
    facsimile,
  })).sort((left, right) => left.top - right.top || left.left - right.left);
};

const operationSignature = operations => operations
  .filter(operation => operation.type !== 'exclude_ocr')
  .map(operation => [operation.type, operation.expected ?? []]);

const selectVariant = ({ expectedLines, variants, facsimile }) => {
  const analyses = variants.map(variant => {
    const lines = normalizeVariantLines(variant.lines, facsimile);
    return {
      name: variant.name,
      lines,
      ...alignPage({ expectedLines, ocrLines: lines }),
    };
  }).sort((left, right) =>
    right.selectionScore - left.selectionScore || left.name.localeCompare(right.name)
  );
  const selected = analyses[0];
  const runnerUp = analyses[1];
  const competingVariant = runnerUp != null &&
    selected.selectionScore - runnerUp.selectionScore <= 0.2 &&
    JSON.stringify(operationSignature(selected.operations)) !==
      JSON.stringify(operationSignature(runnerUp.operations));
  return { selected, competingVariant: competingVariant ? runnerUp : null };
};

const nearestBlockKey = (operation, expectedLines) => {
  const expectedIndex = operation.expected?.[0];
  if (expectedIndex != null) return expectedLines[expectedIndex].blockKey;
  const cursor = Math.min(
    operation.expectedCursor ?? 0,
    Math.max(expectedLines.length - 1, 0),
  );
  return expectedLines[cursor]?.blockKey ?? null;
};

const joinedGeometryLine = ({ expected, operation, ocrLines }) => {
  const physicalLines = operation.ocr.map(index => ocrLines[index]).sort(
    (left, right) => left.top - right.top || left.left - right.left
  );
  const first = physicalLines[0];
  const firstCentre = first.top + first.height / 2;
  const samePrintedRow = physicalLines.every(line =>
    Math.abs(line.top + line.height / 2 - firstCentre) <=
      Math.min(line.height, first.height) * 0.4
  );
  const visibleCharacters = first.text.replace(/\s/gu, '').length;
  return {
    ...first,
    text: physicalLines.map(line => line.text).join(' '),
    xml_text: expected.text,
    source_verse_line: expected.source_verse_line,
    match_similarity: Number(operation.similarity.toFixed(4)),
    character_advance: first.width / Math.max(visibleCharacters, 1),
    physical_line_span: samePrintedRow ? 1 : physicalLines.length,
    joined_ocr_lines: operation.ocr.map(index => ({
      ocr_line: index + 1,
      text: ocrLines[index].text,
    })),
  };
};

const leadingOcrOmission = (expectedText, ocrText) => {
  const expected = normalizeForMatch(expectedText);
  const ocr = normalizeForMatch(ocrText);
  const leadingWord = /^\p{L}+/u.exec(String(expectedText).trim())?.[0] ?? '';
  const ocrLeadingWord = /^\p{L}+/u.exec(String(ocrText).trim())?.[0] ?? '';
  const omittedLetters = ocr === '' ? 0 : expected.indexOf(ocr);
  const omittedPunctuation =
    expected === ocr &&
    /^[^\p{L}\p{N}]/u.test(String(expectedText).trim()) &&
    /^[\p{L}\p{N}]/u.test(String(ocrText).trim());
  const shortenedLeadingWord =
    leadingWord !== '' && ocrLeadingWord !== '' &&
    normalizeForMatch(leadingWord).endsWith(normalizeForMatch(ocrLeadingWord)) &&
    normalizeForMatch(leadingWord) !== normalizeForMatch(ocrLeadingWord);
  return omittedPunctuation || shortenedLeadingWord ||
    (omittedLetters > 0 && omittedLetters <= 3);
};

const annotateIndentationSafety = line => leadingOcrOmission(
  line.xml_text,
  line.text,
) ? {
  ...line,
  indentation_geometry_safe: false,
  indentation_geometry_issue: 'ocr_missing_leading_content',
} : line;

const preparePoetryGeometry = ({ xml, variantsByFacsimile }) => {
  const extracted = extractPoetryBlocks(xml);
  const blockStates = new Map(extracted.map(block => {
    const key = `${block.textId}:${block.blockIndex}`;
    return [key, {
      key,
      block,
      safeMatches: [],
      coveredSourceLines: new Set(),
      excluded: [],
      ambiguous: [...block.issues],
      selectedVariants: [],
    }];
  }));
  const expectedByFacsimile = new Map();
  const equipmentByFacsimile = new Map();
  blockStates.forEach(state => {
    state.block.lines.forEach(line => {
      if (line.facsimile == null) {
        state.ambiguous.push({
          type: 'missing_page_mapping',
          source_verse_line: line.source_verse_line,
        });
        return;
      }
      const lines = expectedByFacsimile.get(line.facsimile) ?? [];
      lines.push({ ...line, blockKey: state.key });
      expectedByFacsimile.set(line.facsimile, lines);
    });
    state.block.equipment.forEach(item => {
      if (item.facsimile == null) return;
      const equipment = equipmentByFacsimile.get(item.facsimile) ?? [];
      equipment.push({ ...item, blockKey: state.key });
      equipmentByFacsimile.set(item.facsimile, equipment);
    });
  });

  const pageReports = [];
  expectedByFacsimile.forEach((expectedLines, facsimile) => {
    const variants = variantsByFacsimile[facsimile] ?? [];
    if (variants.length === 0) {
      expectedLines.forEach(expected => {
        blockStates.get(expected.blockKey).ambiguous.push({
          type: 'missing_tsv_page',
          facsimile,
          source_verse_line: expected.source_verse_line,
        });
      });
      pageReports.push({
        facsimile,
        status: 'manual_review',
        selected_variant: null,
        expected_line_count: expectedLines.length,
        excluded: [],
      });
      return;
    }
    const { selected, competingVariant } = selectVariant({
      expectedLines,
      variants,
      facsimile,
    });
    const excluded = [];
    selected.operations.forEach((operation, operationIndex) => {
      const state = blockStates.get(nearestBlockKey(operation, expectedLines));
      if (operation.type === 'match') {
        const expected = expectedLines[operation.expected[0]];
        const ocr = selected.lines[operation.ocr[0]];
        const expectedState = blockStates.get(expected.blockKey);
        expectedState.coveredSourceLines.add(expected.source_verse_line);
        expectedState.safeMatches.push(annotateIndentationSafety({
          ...ocr,
          text: ocr.text,
          xml_text: expected.text,
          source_verse_line: expected.source_verse_line,
          match_similarity: Number(operation.similarity.toFixed(4)),
        }));
        if (operation.alternatives != null) {
          expectedState.ambiguous.push({
            type: 'ambiguous_match',
            facsimile,
            source_verse_line: expected.source_verse_line,
            selected_ocr_line: operation.ocr[0] + 1,
            alternative_ocr_lines: operation.alternatives.map(candidate => ({
              ocr_line: candidate.index + 1,
              similarity: Number(candidate.similarity.toFixed(4)),
            })),
          });
        }
      } else if (operation.type === 'exclude_ocr') {
        const ocr = selected.lines[operation.ocr[0]];
        const reason = classifyExcluded(
          ocr,
          equipmentByFacsimile.get(facsimile) ?? [],
        );
        const item = {
          facsimile,
          variant: selected.name,
          reason,
          line: ocr,
        };
        excluded.push(item);
        if (state != null) state.excluded.push(item);
        if (reason === 'unmatched_page_content') {
          const isMatchedOperation = candidate =>
            candidate != null &&
            ['match', 'merge_ocr', 'split_xml'].includes(candidate.type) &&
            candidate.expected?.length > 0;
          const previous = selected.operations.slice(0, operationIndex)
            .reverse().find(isMatchedOperation);
          const next = selected.operations.slice(operationIndex + 1)
            .find(isMatchedOperation);
          const previousBlock = previous == null
            ? null
            : expectedLines[previous.expected.at(-1)]?.blockKey;
          const nextBlock = next == null
            ? null
            : expectedLines[next.expected[0]]?.blockKey;
          if (
            state != null &&
            previousBlock === state.key &&
            nextBlock === state.key
          ) {
            state.ambiguous.push({
              type: 'unmatched_internal_ocr_line',
              facsimile,
              variant: selected.name,
              text: ocr.text,
              top: ocr.top,
              reason:
                'En verslignende OCR-linje mellem to matchede XML-vers kan være tekst, der mangler i XML.',
            });
          }
        }
      } else if (operation.type === 'missing_xml') {
        const expected = expectedLines[operation.expected[0]];
        blockStates.get(expected.blockKey).ambiguous.push({
          type: 'missing_ocr_line',
          facsimile,
          source_verse_line: expected.source_verse_line,
          xml_text: expected.text,
        });
      } else if (operation.type === 'merge_ocr') {
        const expected = expectedLines[operation.expected[0]];
        const expectedState = blockStates.get(expected.blockKey);
        expectedState.coveredSourceLines.add(expected.source_verse_line);
        expectedState.safeMatches.push(annotateIndentationSafety(joinedGeometryLine({
          expected,
          operation,
          ocrLines: selected.lines,
        })));
      } else {
        operation.expected.forEach(expectedIndex => {
          const expected = expectedLines[expectedIndex];
          const expectedState = blockStates.get(expected.blockKey);
          expectedState.coveredSourceLines.add(expected.source_verse_line);
          expectedState.ambiguous.push({
            type: 'split_xml_lines',
            facsimile,
            source_verse_lines: operation.expected.map(index =>
              expectedLines[index].source_verse_line
            ),
            ocr_lines: operation.ocr.map(index => ({
              ocr_line: index + 1,
              text: selected.lines[index].text,
            })),
            similarity: Number(operation.similarity.toFixed(4)),
          });
        });
      }
    });
    const affectedBlocks = new Set(expectedLines.map(line => line.blockKey));
    affectedBlocks.forEach(blockKey => {
      const state = blockStates.get(blockKey);
      state.selectedVariants.push({
        facsimile,
        variant: selected.name,
        selection_score: Number(selected.selectionScore.toFixed(4)),
      });
      if (competingVariant != null) {
        state.ambiguous.push({
          type: 'ambiguous_ocr_variant',
          facsimile,
          selected_variant: selected.name,
          competing_variant: competingVariant.name,
        });
      }
    });
    pageReports.push({
      facsimile,
      status: competingVariant == null ? 'ok' : 'manual_review',
      selected_variant: selected.name,
      expected_line_count: expectedLines.length,
      matched_line_count: selected.matchedExpected,
      average_similarity: Number(selected.averageSimilarity.toFixed(4)),
      excluded,
    });
  });

  const blocks = [...blockStates.values()].map(state => {
    const sortedMatches = state.safeMatches.sort((left, right) =>
      left.source_verse_line - right.source_verse_line
    );
    const projectedIndex = new Map(sortedMatches.map((line, index) =>
      [line.source_verse_line, index + 1]
    ));
    const observedBoundaries = state.block.observedBoundaries
      .filter(boundary =>
        projectedIndex.has(boundary) &&
        projectedIndex.get(boundary + 1) === projectedIndex.get(boundary) + 1
      )
      .map(boundary => projectedIndex.get(boundary));
    const indentationBySourceLine = new Map(state.block.lines.map(line =>
      [line.source_verse_line, line.indentation]
    ));
    const indentationSectionBySourceLine = new Map(state.block.lines.map(line =>
      [line.source_verse_line, line.indentation_section]
    ));
    const expectedLineCount = state.block.lines.length;
    const matchedLineCount = state.coveredSourceLines.size;
    const physicallyWrappedCount = sortedMatches.filter(line =>
      Number(line.physical_line_span ?? 1) > 1
    ).length;
    if (
      physicallyWrappedCount >= densePhysicalWrappingMinimum &&
      physicallyWrappedCount / Math.max(expectedLineCount, 1) >=
        densePhysicalWrappingRatio
    ) {
      state.ambiguous.push({
        type: 'dense_physical_wrapping',
        physically_wrapped_line_count: physicallyWrappedCount,
        expected_line_count: expectedLineCount,
        ratio: Number((physicallyWrappedCount / expectedLineCount).toFixed(4)),
        reason:
          'Tætte fysiske ombrud gør automatisk strofe- og indrykningsgeometri usikker.',
      });
    }
    const geometryReady = state.ambiguous.length === 0 &&
      sortedMatches.length === expectedLineCount;
    return {
      text_id: state.block.textId,
      pages: state.block.pages,
      block_index: state.block.blockIndex,
      status: geometryReady ? 'ready' : 'manual_review',
      geometry_ready: geometryReady,
      lines: sortedMatches,
      observed_boundaries: observedBoundaries,
      observed_indentation: sortedMatches.map(line =>
        indentationBySourceLine.get(line.source_verse_line) ?? 0
      ),
      indentation_sections: sortedMatches.map(line =>
        indentationSectionBySourceLine.get(line.source_verse_line) ?? 1
      ),
      coverage: {
        expected_line_count: expectedLineCount,
        matched_line_count: matchedLineCount,
        safe_geometry_line_count: sortedMatches.length,
        ratio: expectedLineCount === 0
          ? 1
          : Number((matchedLineCount / expectedLineCount).toFixed(4)),
      },
      selected_variants: state.selectedVariants,
      excluded: state.excluded,
      ambiguous: state.ambiguous,
    };
  });
  return {
    status: blocks.every(block => block.status === 'ready')
      ? 'ready'
      : 'manual_review',
    poetry_block_count: blocks.length,
    pages: pageReports,
    blocks,
  };
};

const facsimileFromTsvFilename = filename => {
  const stem = path.basename(filename, path.extname(filename));
  const match = /(?:^|[^\d])(\d{3,})(?=$|[^\d])/u.exec(stem);
  return match == null ? null : `${match[1]}.jpg`;
};

const tsvFiles = directory => fs.readdirSync(directory, { withFileTypes: true })
  .flatMap(entry => {
    const pathname = path.join(directory, entry.name);
    if (entry.isDirectory()) return tsvFiles(pathname);
    return entry.isFile() && entry.name.toLowerCase().endsWith('.tsv')
      ? [pathname]
      : [];
  });

const loadTsvVariants = directory => {
  const variants = {};
  tsvFiles(directory).sort().forEach(filename => {
    const facsimile = facsimileFromTsvFilename(filename);
    if (facsimile == null) return;
    variants[facsimile] ??= [];
    variants[facsimile].push({
      name: path.relative(directory, filename),
      lines: parseTesseractTsv(fs.readFileSync(filename, 'utf8')),
    });
  });
  return variants;
};

const runCli = () => {
  const [xmlFile, tsvDirectory] = process.argv.slice(2);
  if (xmlFile == null || tsvDirectory == null) {
    console.error(
      'Brug: node prepare-poetry-geometry.js WORK.xml TSV_DIRECTORY',
    );
    process.exitCode = 2;
    return;
  }
  const result = preparePoetryGeometry({
    xml: fs.readFileSync(xmlFile, 'utf8'),
    variantsByFacsimile: loadTsvVariants(tsvDirectory),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) runCli();

export {
  alignPage,
  extractPoetryBlocks,
  facsimileFromTsvFilename,
  loadTsvVariants,
  normalizeForMatch,
  preparePoetryGeometry,
  textSimilarity,
};
